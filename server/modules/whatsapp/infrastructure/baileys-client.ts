import baileysModule, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import { AppConfig } from '../../../core/config/app.config.js';
import { eventBus } from '../../../core/events/event-bus.js';
import { ErrorCodes } from '../../../core/errors/error-codes.js';
import { webhookDispatcher } from '../../otp/infrastructure/webhook-dispatcher.js';

const makeWASocket = (baileysModule as any).default || baileysModule;

export class BaileysClient {
  private sock: WASocket | null = null;
  private authDir = AppConfig.whatsapp.authDir;

  public async createSocket(handlers: {
    onQr: (qr: string, qrDataUrl: string) => void;
    onConnected: (phone: string, pushName: string) => void;
    onDisconnected: (statusCode?: number, reasonText?: string, shouldReconnect?: boolean) => void;
  }): Promise<WASocket> {
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
    let version: [number, number, number] = [2, 3000, 1015901307];

    try {
      const fetchedVersion = await fetchLatestBaileysVersion();
      if (fetchedVersion && fetchedVersion.version) {
        version = fetchedVersion.version;
      }
    } catch {
      // Use fallback version
    }

    const pinoLogger = pino({ level: 'silent' });

    this.sock = makeWASocket({
      version,
      auth: state,
      logger: pinoLogger,
      printQRInTerminal: false,
      browser: AppConfig.whatsapp.browser,
      connectTimeoutMs: AppConfig.whatsapp.connectTimeoutMs,
      keepAliveIntervalMs: AppConfig.whatsapp.keepAliveIntervalMs,
      emitOwnEvents: false,
    });

    const sock = this.sock;
    if (!sock) {
      throw new Error('Gagal menginisialisasi Baileys socket.');
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            width: 320,
            color: { dark: '#0f172a', light: '#ffffff' },
          });
          handlers.onQr(qr, qrDataUrl);
        } catch (err: any) {
          eventBus.emit('error:logged', {
            category: 'socket',
            code: ErrorCodes.QR_RENDER_FAILED,
            title: 'Gagal merender QR Code',
            details: err?.message,
            suggestedAction: 'Coba refresh koneksi dengan tombol Reconnect di dasbor.',
          });
        }
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        const reasonText = this.humanizeDisconnectReason(statusCode);
        handlers.onDisconnected(statusCode, reasonText, shouldReconnect);
      } else if (connection === 'open') {
        const userJid = sock.user?.id || '';
        const phone = userJid.split(':')[0] || userJid.split('@')[0] || '';
        const pushName = sock.user?.name || 'WhatsApp Device';
        handlers.onConnected(phone, pushName);
      }
    });

    // Handle real-time delivery receipt updates & Webhooks
    sock.ev.on('messages.update', (updates) => {
      for (const update of updates) {
        if (update.key.id && update.update.status) {
          const statusNum = update.update.status;
          const messageId = update.key.id;

          if (statusNum >= 3) {
            // Level 3: Delivered (Centang dua abu-abu), Level 4: Read (Centang dua biru)
            const isRead = statusNum >= 4;
            const statusStr = isRead ? 'delivered' : 'delivered';

            eventBus.emit('delivery:updated', {
              id: messageId,
              status: 'delivered',
            });

            webhookDispatcher.triggerByMessageId(messageId, isRead ? 'otp.read' : 'otp.delivered', {
              status: isRead ? 'read' : 'delivered',
            }).catch(() => {});

            eventBus.emit('console:log', {
              level: 'info',
              source: 'whatsapp',
              message: `Tanda terima pesan WA #${messageId}: ${isRead ? 'DIBACA (READ)' : 'DITERIMA (DELIVERED)'}`,
            });
          }
        }
      }
    });

    return sock;
  }

  public getSocket(): WASocket | null {
    return this.sock;
  }

  public async closeSocket(): Promise<void> {
    if (this.sock) {
      try {
        await this.sock.logout();
      } catch {}
      try {
        this.sock.end(undefined);
      } catch {}
      this.sock = null;
    }
  }

  public clearAuthCredentials(): void {
    if (fs.existsSync(this.authDir)) {
      fs.rmSync(this.authDir, { recursive: true, force: true });
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  public humanizeDisconnectReason(statusCode?: number): string {
    switch (statusCode) {
      case DisconnectReason.loggedOut:
        return 'Perangkat dikeluarkan dari WhatsApp (Logged Out). Harap scan ulang QR Code.';
      case DisconnectReason.badSession:
        return 'Sesi otentikasi rusak (Bad Session). Perlu reset sesi.';
      case DisconnectReason.connectionClosed:
        return 'Koneksi ditutup oleh server WhatsApp.';
      case DisconnectReason.connectionLost:
      case DisconnectReason.timedOut:
        return 'Waktu koneksi habis atau koneksi internet terputus (Timed Out).';
      case DisconnectReason.connectionReplaced:
        return 'Koneksi digantikan oleh sesi baru pada perangkat/browser lain.';
      case DisconnectReason.restartRequired:
        return 'Server WhatsApp meminta socket di-restart (Restart Required).';
      case DisconnectReason.unavailableService:
        return 'Layanan WhatsApp sementara tidak tersedia (503).';
      default:
        return statusCode ? `Kode diskoneksi: ${statusCode}` : 'Koneksi terputus tidak diketahui';
    }
  }
}
