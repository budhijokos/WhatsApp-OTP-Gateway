import { AppConfig } from '../../../core/config/app.config.js';
import { ErrorCodes } from '../../../core/errors/error-codes.js';
import { ServiceUnavailableError, ValidationError } from '../../../core/errors/app-error.js';
import { eventBus } from '../../../core/events/event-bus.js';
import { BaileysClient } from '../infrastructure/baileys-client.js';
import { WhatsAppState } from '../domain/whatsapp.types.js';

export class WhatsAppService {
  private client = new BaileysClient();
  private isInitializing = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectedTimestamp: number | null = null;

  private state: WhatsAppState = {
    status: 'disconnected',
    phone: null,
    pushName: null,
    qrDataUrl: null,
    qrRaw: null,
    pairingCode: null,
    lastDisconnectReason: null,
    connectedAt: null,
    uptimeSeconds: 0,
  };

  constructor() {
    // Periodic uptime updater
    setInterval(() => {
      if (this.state.status === 'connected' && this.connectedTimestamp) {
        this.state.uptimeSeconds = Math.floor((Date.now() - this.connectedTimestamp) / 1000);
      } else {
        this.state.uptimeSeconds = 0;
      }
    }, 1000);
  }

  public getState(): WhatsAppState {
    return { ...this.state };
  }

  public updateState(partial: Partial<WhatsAppState>): void {
    if (partial.status === 'connected' && this.state.status !== 'connected') {
      this.connectedTimestamp = Date.now();
      this.state.connectedAt = new Date().toISOString();
    } else if (partial.status && partial.status !== 'connected') {
      this.connectedTimestamp = null;
      this.state.connectedAt = null;
    }

    this.state = {
      ...this.state,
      ...partial,
    };

    eventBus.emit('whatsapp:state_updated', this.state);
  }

  public async initialize(): Promise<void> {
    if (this.isInitializing) return;
    this.isInitializing = true;

    try {
      this.updateState({
        status: 'connecting',
        lastDisconnectReason: null,
      });

      eventBus.emit('console:log', {
        level: 'info',
        source: 'whatsapp',
        message: 'Menginisialisasi WhatsApp Baileys Socket...',
      });

      await this.client.createSocket({
        onQr: (qr, qrDataUrl) => {
          eventBus.emit('console:log', {
            level: 'info',
            source: 'whatsapp',
            message: 'QR Code baru berhasil di-generate. Siap dipindai di antarmuka dasbor.',
          });

          this.updateState({
            status: 'qr_ready',
            qrDataUrl,
            qrRaw: qr,
            pairingCode: null,
          });
        },
        onConnected: (phone, pushName) => {
          eventBus.emit('console:log', {
            level: 'success',
            source: 'whatsapp',
            message: `WhatsApp berhasil terhubung! Nomor: +${phone} (${pushName})`,
          });

          this.updateState({
            status: 'connected',
            phone,
            pushName,
            qrDataUrl: null,
            qrRaw: null,
            pairingCode: null,
            lastDisconnectReason: null,
          });
        },
        onDisconnected: (statusCode, reasonText, shouldReconnect) => {
          const reasonStr = `[${statusCode || 'ERR'}] ${reasonText}`;

          eventBus.emit('console:log', {
            level: shouldReconnect ? 'warn' : 'error',
            source: 'whatsapp',
            message: `Koneksi WhatsApp terputus. Alasan: ${reasonStr}`,
          });

          this.updateState({
            status: 'disconnected',
            phone: null,
            pushName: null,
            qrDataUrl: null,
            qrRaw: null,
            pairingCode: null,
            lastDisconnectReason: reasonStr,
          });

          eventBus.emit('error:logged', {
            category: 'socket',
            code: `SOCKET_DISCONNECT_${statusCode || 'UNKNOWN'}`,
            title: `Koneksi WhatsApp tertutup: ${reasonText}`,
            details: { statusCode, reasonText },
            suggestedAction:
              statusCode === 401
                ? 'Sesi telah keluar (logged out). Hapus sesi dan pindai QR Code baru.'
                : 'Sistem akan mencoba menyambung ulang otomatis dalam beberapa detik.',
          });

          if (statusCode === 401) {
            this.client.clearAuthCredentials();
            this.scheduleReconnect(3000);
          } else if (shouldReconnect) {
            this.scheduleReconnect(AppConfig.whatsapp.reconnectDelayMs);
          }
        },
      });
    } catch (err: any) {
      this.updateState({
        status: 'disconnected',
        lastDisconnectReason: err?.message || 'Inisialisasi gagal',
      });

      eventBus.emit('error:logged', {
        category: 'socket',
        code: ErrorCodes.SOCKET_INIT_FAILED,
        title: 'Inisialisasi Baileys socket gagal',
        details: err?.message || err,
        suggestedAction: 'Periksa koneksi jaringan dan hak akses direktori penyimpanan kredensial.',
      });

      this.scheduleReconnect(5000);
    } finally {
      this.isInitializing = false;
    }
  }

  public scheduleReconnect(delayMs: number): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      eventBus.emit('console:log', {
        level: 'info',
        source: 'whatsapp',
        message: `Mencoba rekoneksi otomatis WhatsApp (${delayMs}ms)...`,
      });
      this.initialize();
    }, delayMs);
  }

  public async requestPairingCode(phoneNumber: string): Promise<string> {
    const sock = this.client.getSocket();
    if (!sock) {
      throw new ServiceUnavailableError(
        'Socket WhatsApp belum diinisialisasi atau sedang offline.',
        ErrorCodes.SOCKET_INIT_FAILED
      );
    }

    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    let formattedNumber = cleaned;
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '62' + formattedNumber.substring(1);
    } else if (formattedNumber.startsWith('8')) {
      formattedNumber = '62' + formattedNumber;
    }

    if (formattedNumber.length < AppConfig.otp.minPhoneDigits) {
      throw new ValidationError(
        'Nomor telepon tidak valid. Gunakan format seperti 081234567890 atau 6281234567890.',
        ErrorCodes.PHONE_INVALID_FORMAT
      );
    }

    eventBus.emit('console:log', {
      level: 'info',
      source: 'whatsapp',
      message: `Meminta kode pairing 8-digit untuk nomor: +${formattedNumber}...`,
    });

    try {
      const code = await sock.requestPairingCode(formattedNumber);
      this.updateState({ pairingCode: code });

      eventBus.emit('console:log', {
        level: 'success',
        source: 'whatsapp',
        message: `Kode pairing 8-digit diterima: ${code}`,
      });

      return code;
    } catch (err: any) {
      eventBus.emit('error:logged', {
        category: 'socket',
        code: ErrorCodes.PAIRING_CODE_FAILED,
        title: 'Gagal meminta kode pairing dari WhatsApp',
        details: err?.message || err,
        suggestedAction: 'Pastikan nomor ponsel aktif di WhatsApp dan belum tertaut ke terlalu banyak browser.',
      });
      throw err;
    }
  }

  public async reconnect(): Promise<void> {
    eventBus.emit('console:log', {
      level: 'info',
      source: 'whatsapp',
      message: 'Menjalankan rekoneksi manual WhatsApp...',
    });
    await this.client.closeSocket();
    await this.initialize();
  }

  public async resetSession(): Promise<void> {
    eventBus.emit('console:log', {
      level: 'warn',
      source: 'whatsapp',
      message: 'Melakukan reset sesi WhatsApp dan menghapus kredensial lokal...',
    });

    await this.client.closeSocket();
    this.client.clearAuthCredentials();

    this.updateState({
      status: 'disconnected',
      phone: null,
      pushName: null,
      qrDataUrl: null,
      qrRaw: null,
      pairingCode: null,
      lastDisconnectReason: 'Sesi di-reset secara manual oleh pengguna',
    });

    await this.initialize();
  }

  public getActiveSocket() {
    return this.client.getSocket();
  }
}

export const whatsAppService = new WhatsAppService();
