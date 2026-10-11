import crypto from 'crypto';
import { eventBus } from '../../../core/events/event-bus.js';

export interface WebhookSimulationPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  event: string;
  defaultPayload: Record<string, unknown>;
}

export interface WebhookSimulationRequest {
  targetUrl: string;
  event: string;
  payload: Record<string, unknown>;
  customHeaders?: Record<string, string>;
  signatureSecret?: string;
  timeoutMs?: number;
}

export interface WebhookSimulationResponse {
  success: boolean;
  statusCode: number;
  statusText: string;
  latencyMs: number;
  request: {
    targetUrl: string;
    method: string;
    headers: Record<string, string>;
    payload: Record<string, unknown>;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    isJson: boolean;
    jsonBody?: unknown;
  };
  signatureHeader?: string;
  timestamp: string;
  diagnosis: string;
}

export class WebhookSimulatorService {
  public getPresets(): WebhookSimulationPreset[] {
    const nowIso = new Date().toISOString();

    return [
      {
        id: 'order_paid',
        name: 'Order Paid (Pembayaran Lunas)',
        badge: 'Critical',
        description: 'Dipicu saat pembayaran pesanan telah terverifikasi lunas (QRIS, VA, Kartu, e-Wallet).',
        event: 'order_paid',
        defaultPayload: {
          event: 'order_paid',
          eventId: `evt_paid_${Math.floor(100000 + Math.random() * 900000)}`,
          timestamp: nowIso,
          data: {
            orderId: 'INV-20261010-891',
            customer: {
              name: 'Budi Pratama',
              phone: '+6281234567890',
              email: 'budi.pratama@example.com',
            },
            store: {
              name: 'Toko Berkah Mandiri',
              storeId: 'store_jkt_01',
            },
            payment: {
              method: 'QRIS BCA',
              amount: 285000,
              currency: 'IDR',
              status: 'PAID',
              paidAt: nowIso,
              transactionReference: 'TRX-QRIS-9921471',
            },
            items: [
              {
                sku: 'KB-WL-01',
                name: 'Keyboard Wireless RGB Ergonomis',
                quantity: 1,
                price: 250000,
              },
              {
                sku: 'MP-XL-02',
                name: 'Mousepad XL Waterproof',
                quantity: 1,
                price: 35000,
              },
            ],
            shipping: {
              recipientName: 'Budi Pratama',
              address: 'Jl. Sudirman No. 45, Kebayoran Baru, Jakarta Selatan 12190',
              courier: 'J&T Express Regular',
            },
          },
        },
      },
      {
        id: 'order_shipped',
        name: 'Order Shipped (Pesanan Dikirim / Resi)',
        badge: 'Fulfillment',
        description: 'Dipicu saat paket diserahkan ke kurir dan nomor resi pengiriman diterbitkan.',
        event: 'order_shipped',
        defaultPayload: {
          event: 'order_shipped',
          eventId: `evt_ship_${Math.floor(100000 + Math.random() * 900000)}`,
          timestamp: nowIso,
          data: {
            orderId: 'INV-20261010-891',
            customer: {
              name: 'Budi Pratama',
              phone: '+6281234567890',
            },
            store: {
              name: 'Toko Berkah Mandiri',
            },
            shipping: {
              courier: 'J&T Express',
              service: 'EZ Regular',
              trackingNumber: 'JT9823419082ID',
              trackingUrl: 'https://jet.co.id/track?awb=JT9823419082ID',
              shippedAt: nowIso,
              estimateDays: '2-3 Hari Kerja',
              deliveryAddress: 'Jl. Sudirman No. 45, Kebayoran Baru, Jakarta Selatan 12190',
            },
            itemsSummary: '1x Keyboard Wireless RGB, 1x Mousepad XL',
          },
        },
      },
      {
        id: 'order_created',
        name: 'Order Created (Pesanan Baru Dibuat)',
        badge: 'Billing',
        description: 'Dipicu saat checkout selesai dengan instruksi pembayaran (VA, Transfer, atau QRIS).',
        event: 'order_created',
        defaultPayload: {
          event: 'order_created',
          eventId: `evt_create_${Math.floor(100000 + Math.random() * 900000)}`,
          timestamp: nowIso,
          data: {
            orderId: 'INV-20261010-904',
            customer: {
              name: 'Siti Rahma',
              phone: '+6285712345678',
              email: 'siti.rahma@example.com',
            },
            store: {
              name: 'Fashion Store ID',
            },
            payment: {
              method: 'Virtual Account Mandiri',
              amount: 420000,
              virtualAccountNumber: '892019827364110',
              paymentExpiry: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
              instruction: 'Transfer via Livin Mandiri > Bayar > Multipayment',
            },
            itemsSummary: '2x Kemeja Flanel Oversize (Sage Green, Navy)',
          },
        },
      },
      {
        id: 'order_delivered',
        name: 'Order Delivered (Paket Diterima)',
        badge: 'Success',
        description: 'Dipicu saat status ekspedisi menyatakan paket telah berhasil diterima pelanggan.',
        event: 'order_delivered',
        defaultPayload: {
          event: 'order_delivered',
          eventId: `evt_deliv_${Math.floor(100000 + Math.random() * 900000)}`,
          timestamp: nowIso,
          data: {
            orderId: 'INV-20261010-891',
            customer: {
              name: 'Budi Pratama',
              phone: '+6281234567890',
            },
            shipping: {
              courier: 'J&T Express',
              trackingNumber: 'JT9823419082ID',
              deliveredAt: nowIso,
              recipientSignature: 'Pak Satpam Komplek / Ybs',
            },
          },
        },
      },
      {
        id: 'cod_confirmation',
        name: 'COD Confirmation (Konfirmasi Bayar di Tempat)',
        badge: 'Anti-Return',
        description: 'Dipicu untuk memvalidasi kesiapan pembeli menerima paket COD sebelum barang diproses.',
        event: 'cod_confirmation',
        defaultPayload: {
          event: 'cod_confirmation',
          eventId: `evt_cod_${Math.floor(100000 + Math.random() * 900000)}`,
          timestamp: nowIso,
          data: {
            orderId: 'COD-20261010-332',
            customer: {
              name: 'Ahmad Fauzi',
              phone: '+6287811223344',
            },
            store: {
              name: 'Elektronik Nusantara',
            },
            cod: {
              amountToPrepare: 'Rp 175.000',
              confirmationStatus: 'pending_customer_reply',
              courier: 'SiCepat COD',
            },
          },
        },
      },
      {
        id: 'abandoned_cart',
        name: 'Abandoned Cart (Keranjang Tertinggal)',
        badge: 'Marketing',
        description: 'Dipicu untuk memulihkan transaksi calon pembeli yang meninggalkan keranjang belanja.',
        event: 'abandoned_cart',
        defaultPayload: {
          event: 'abandoned_cart',
          eventId: `evt_cart_${Math.floor(100000 + Math.random() * 900000)}`,
          timestamp: nowIso,
          data: {
            cartId: 'CART-USER-994',
            customer: {
              name: 'Rina Wijaya',
              phone: '+6281399887766',
            },
            itemsSummary: '1x Sepatu Sneakers Putih Casual (Size 39)',
            cartTotal: 'Rp 320.000',
            discountPromo: 'DISKON10 (Potongan 10%)',
            checkoutUrl: 'https://tokoberkah.com/cart?token=abc9827164',
          },
        },
      },
    ];
  }

  public async simulateWebhook(req: WebhookSimulationRequest): Promise<WebhookSimulationResponse> {
    const rawTargetUrl = (req.targetUrl || '').trim();
    if (!rawTargetUrl.startsWith('http://') && !rawTargetUrl.startsWith('https://')) {
      throw new Error("URL target webhook tidak valid. Harus diawali dengan 'http://' atau 'https://'.");
    }

    const payload = req.payload || {};
    const rawJsonBody = JSON.stringify(payload, null, 2);
    const eventName = req.event || 'test_event';
    const deliveryId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'WhatsApp-OTP-Gateway-Webhook-Simulator/2.0',
      'X-Event': eventName,
      'X-Delivery-ID': deliveryId,
      'X-Timestamp': timestamp,
      ...(req.customHeaders || {}),
    };

    let signatureHeader: string | undefined;
    if (req.signatureSecret && req.signatureSecret.trim().length > 0) {
      const hmac = crypto.createHmac('sha256', req.signatureSecret.trim());
      hmac.update(rawJsonBody);
      const signature = 'sha256=' + hmac.digest('hex');
      headers['X-Signature-SHA256'] = signature;
      headers['X-Hub-Signature-256'] = signature;
      signatureHeader = signature;
    }

    eventBus.emit('console:log', {
      level: 'info',
      source: 'ecommerce',
      message: `[Webhook Simulator] Memancarkan dummy event '${eventName}' ke: ${rawTargetUrl}...`,
    });

    const startTime = Date.now();
    const timeoutMs = Math.min(Math.max(req.timeoutMs || 8000, 1000), 15000);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(rawTargetUrl, {
        method: 'POST',
        headers,
        body: rawJsonBody,
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Date.now() - startTime;
      const responseText = await res.text().catch(() => '');

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        responseHeaders[key] = val;
      });

      let isJson = false;
      let jsonBody: unknown = undefined;
      try {
        jsonBody = JSON.parse(responseText);
        isJson = true;
      } catch {
        isJson = false;
      }

      let diagnosis = '';
      if (res.ok) {
        diagnosis = `Sukses (HTTP ${res.status}): Server backend Anda berhasil menerima dan memproses payload event '${eventName}'.`;
      } else if (res.status === 404) {
        diagnosis = `Gagal (HTTP 404 Not Found): Route webhook tidak ditemukan di backend Anda. Periksa path URL dan routing server.`;
      } else if (res.status === 401 || res.status === 403) {
        diagnosis = `Gagal (HTTP ${res.status}): Akses ditolak. Periksa Secret Key HMAC atau header Authorization yang diharapkan oleh server Anda.`;
      } else if (res.status >= 500) {
        diagnosis = `Gagal (HTTP ${res.status} Internal Server Error): Server backend Anda mengalami unhandled exception saat menerima payload JSON ini.`;
      } else {
        diagnosis = `Perhatian (HTTP ${res.status}): Server merespons dengan status non-2xx. Periksa validasi input backend Anda.`;
      }

      eventBus.emit('console:log', {
        level: res.ok ? 'success' : 'warn',
        source: 'ecommerce',
        message: `[Webhook Simulator] Respons dari ${rawTargetUrl}: HTTP ${res.status} ${res.statusText} (${latencyMs}ms)`,
      });

      return {
        success: res.ok,
        statusCode: res.status,
        statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
        latencyMs,
        request: {
          targetUrl: rawTargetUrl,
          method: 'POST',
          headers,
          payload,
        },
        response: {
          status: res.status,
          statusText: res.statusText,
          headers: responseHeaders,
          body: responseText,
          isJson,
          jsonBody,
        },
        signatureHeader,
        timestamp,
        diagnosis,
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      const latencyMs = Date.now() - startTime;
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const errMsg = err instanceof Error ? err.message : String(err);

      let diagnosis = '';
      if (isAbort) {
        diagnosis = `Timeout Error (> ${timeoutMs / 1000}s): Server tujuan tidak merespons dalam batas waktu. Pastikan endpoint Anda tidak blocking.`;
      } else if (errMsg.includes('ECONNREFUSED')) {
        diagnosis = `Connection Refused: Tidak ada server yang berjalan di alamat tersebut. Jika menguji localhost, gunakan tunnel seperti ngrok atau Cloudflare Tunnel.`;
      } else if (errMsg.includes('ENOTFOUND')) {
        diagnosis = `Domain Not Found (ENOTFOUND): Hostname tidak dapat di-resolve oleh DNS server.`;
      } else {
        diagnosis = `Network Error: Gagal menghubungi target (${errMsg}).`;
      }

      eventBus.emit('console:log', {
        level: 'error',
        source: 'ecommerce',
        message: `[Webhook Simulator] Gagal mengirim ke ${rawTargetUrl}: ${errMsg}`,
      });

      return {
        success: false,
        statusCode: 0,
        statusText: isAbort ? 'TIMEOUT' : 'NETWORK_ERROR',
        latencyMs,
        request: {
          targetUrl: rawTargetUrl,
          method: 'POST',
          headers,
          payload,
        },
        response: {
          status: 0,
          statusText: isAbort ? 'TIMEOUT' : 'NETWORK_ERROR',
          headers: {},
          body: errMsg,
          isJson: false,
        },
        signatureHeader,
        timestamp,
        diagnosis,
      };
    }
  }
}

export const webhookSimulatorService = new WebhookSimulatorService();
