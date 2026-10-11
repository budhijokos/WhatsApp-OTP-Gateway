import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  EcommerceEventData,
  EcommerceEventTemplate,
  EcommerceEventType,
} from './ecommerce.types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_FILE = path.resolve(__dirname, '../../../../.ecommerce_templates.json');

export const DEFAULT_ECOMMERCE_TEMPLATES: EcommerceEventTemplate[] = [
  {
    id: 'order_created',
    title: 'Pesanan Dibuat (Menunggu Pembayaran)',
    badge: 'Checkout',
    description: 'Terkirim otomatis saat pelanggan selesai checkout dan membutuhkan panduan bayar.',
    icon: 'ShoppingCart',
    enabled: true,
    template: `Halo Kak *{{customerName}}*! 👋

Terima kasih telah berbelanja di *{{storeName}}*. Pesanan Anda berhasil dibuat dan sedang menunggu pembayaran.

📦 *ID Pesanan:* #{{orderId}}
🛍️ *Rincian:* {{itemsSummary}}
💰 *Total Tagihan:* *{{totalAmount}}*
💳 *Metode:* {{paymentMethod}}

📌 *Instruksi Pembayaran:*
{{paymentInstruction}}

Mohon selesaikan pembayaran agar pesanan segera kami proses. Terima kasih! 🙏`,
    sampleData: {
      customerName: 'Budi Santoso',
      storeName: 'Toko Keren Official',
      orderId: 'INV-202610-098',
      itemsSummary: '2x Kaos Polos Combed 30s (Hitam & Navy L)',
      totalAmount: 'Rp 175.000',
      paymentMethod: 'BCA Virtual Account (8077708123456789)',
      paymentInstruction: 'Transfer sebelum 24 jam melalui ATM / m-Banking BCA ke nomor VA di atas.',
    },
  },
  {
    id: 'payment_received',
    title: 'Pembayaran Diterima (Lunas)',
    badge: 'Lunas',
    description: 'Terkirim saat pembayaran berhasil terkonfirmasi dari payment gateway atau admin.',
    icon: 'CheckCircle2',
    enabled: true,
    template: `Halo Kak *{{customerName}}*! 🎉

Pembayaran untuk pesanan *#{{orderId}}* sebesar *{{totalAmount}}* telah berhasil kami verifikasi (LUNAS).

🛍️ *Toko:* {{storeName}}
💳 *Metode Pembayaran:* {{paymentMethod}}

Pesanan Anda sedang masuk ke antrean pengemasan di gudang kami. Kami akan memberi tahu Anda begitu paket diserahkan ke kurir. Terima kasih! ✨`,
    sampleData: {
      customerName: 'Budi Santoso',
      storeName: 'Toko Keren Official',
      orderId: 'INV-202610-098',
      totalAmount: 'Rp 175.000',
      paymentMethod: 'BCA Virtual Account',
    },
  },
  {
    id: 'order_processing',
    title: 'Pesanan Sedang Dikemas',
    badge: 'Diproses',
    description: 'Terkirim saat tim gudang sedang menyiapkan dan mengemas barang belanjaan.',
    icon: 'Package',
    enabled: true,
    template: `Halo Kak *{{customerName}}*! 📦

Kabar baik! Pesanan Anda *#{{orderId}}* sedang dikemas dengan rapi dan aman oleh tim gudang *{{storeName}}*.

⏳ *Estimasi Siap Kirim:* {{estimateDays}}
📍 *Alamat Pengiriman:* {{deliveryAddress}}

Nomor resi pengiriman akan kami kirimkan sesaat setelah paket diambil oleh kurir. Terima kasih atas kesabaran Anda! 🚚`,
    sampleData: {
      customerName: 'Budi Santoso',
      storeName: 'Toko Keren Official',
      orderId: 'INV-202610-098',
      estimateDays: '1x24 Jam kerja',
      deliveryAddress: 'Jl. Merdeka No. 45, Tebet, Jakarta Selatan 12810',
    },
  },
  {
    id: 'shipping_dispatched',
    title: 'Paket Dikirim & Resi Tersedia',
    badge: 'Dikirim',
    description: 'Terkirim saat paket diserahkan ke ekspedisi beserta nomor resi untuk pelacakan.',
    icon: 'Truck',
    enabled: true,
    template: `Halo Kak *{{customerName}}*! 🚚💨

Paket pesanan Anda *#{{orderId}}* telah diserahkan kepada pihak ekspedisi dan sedang dalam perjalanan!

🛍️ *Toko:* {{storeName}}
📦 *Kurir Ekspedisi:* *{{courier}}*
🔖 *Nomor Resi:* *{{trackingNumber}}*

🔍 Lacak perjalanan paket Anda secara real-time di:
👉 {{trackingUrl}}

Mohon pastikan nomor telepon Anda aktif saat kurir mengantarkan paket ke alamat tujuan. Terima kasih! 🙏`,
    sampleData: {
      customerName: 'Budi Santoso',
      storeName: 'Toko Keren Official',
      orderId: 'INV-202610-098',
      courier: 'J&T Express (Regular)',
      trackingNumber: 'JT9823481230ID',
      trackingUrl: 'https://cekresi.com/?no=JT9823481230ID',
    },
  },
  {
    id: 'order_delivered',
    title: 'Paket Telah Sampai (Delivered)',
    badge: 'Selesai',
    description: 'Terkirim saat kurir berhasil menyerahkan paket ke alamat pembeli.',
    icon: 'Gift',
    enabled: true,
    template: `Halo Kak *{{customerName}}*! 🎁✨

Menurut laporan kurir *{{courier}}*, paket pesanan *#{{orderId}}* telah berhasil sampai di alamat tujuan.

Semoga produk dari *{{storeName}}* sampai dalam kondisi terbaik dan bermanfaat untuk Anda!

🌟 *Apakah Anda puas dengan layanan kami?*
Bantu kami memberikan ulasan dan rating produk di:
👉 {{trackingUrl}}

Terima kasih banyak telah berbelanja bersama kami! ❤️`,
    sampleData: {
      customerName: 'Budi Santoso',
      storeName: 'Toko Keren Official',
      orderId: 'INV-202610-098',
      courier: 'J&T Express',
      trackingUrl: 'https://tokokeren.com/orders/INV-202610-098/review',
    },
  },
  {
    id: 'cod_confirmation',
    title: 'Konfirmasi Pesanan COD',
    badge: 'Anti-Retur',
    description: 'Terkirim sebelum barang dikirim untuk memverifikasi keaslian pesanan COD dan mengurangi resiko retur.',
    icon: 'ShieldAlert',
    enabled: true,
    template: `Halo Kak *{{customerName}}*! ⚠️

Kami menerima pesanan dengan metode *Bayar di Tempat (COD)* dari *{{storeName}}*:

📦 *ID Pesanan:* #{{orderId}}
🛍️ *Rincian:* {{itemsSummary}}
💰 *Total Bayar ke Kurir:* *{{totalAmount}}*
📍 *Alamat Kirim:* {{deliveryAddress}}

Mohon konfirmasi pesanan ini dengan membalas pesan ini:
👉 Balas *YA* untuk konfirmasi pengiriman
👉 Balas *BATAL* jika Anda ingin membatalkan

*Catatan:* Mohon siapkan uang pas saat kurir tiba di alamat Anda. Terima kasih! 🙏`,
    sampleData: {
      customerName: 'Budi Santoso',
      storeName: 'Toko Keren Official',
      orderId: 'INV-202610-098',
      itemsSummary: '1x Jaket Hoodie Waterproof Premium (Hitam XL)',
      totalAmount: 'Rp 245.000',
      deliveryAddress: 'Jl. Merdeka No. 45, Tebet, Jakarta Selatan',
    },
  },
  {
    id: 'abandoned_cart',
    title: 'Pengingat Keranjang Belanja',
    badge: 'Follow-Up',
    description: 'Terkirim ke pembeli yang memasukkan barang ke keranjang tapi belum menyelesaikan checkout.',
    icon: 'Flame',
    enabled: true,
    template: `Halo Kak *{{customerName}}*! 👋

Barang impian Anda di keranjang belanja *{{storeName}}* masih setia menunggu lho! 🛒

🛍️ *Produk:* {{itemsSummary}}
💰 *Total:* {{totalAmount}}
🎁 *Kode Diskon Khusus Hari Ini:* *{{discountPromo}}*

Jangan sampai kehabisan stok! Selesaikan checkout sekarang melalui tautan berikut:
👉 {{checkoutUrl}}

Ada pertanyaan seputar produk atau pembayaran? Cukup balas pesan ini ya kak! 😊`,
    sampleData: {
      customerName: 'Budi Santoso',
      storeName: 'Toko Keren Official',
      itemsSummary: 'Sepatu Sneaker Classic Leather White 42',
      totalAmount: 'Rp 399.000',
      discountPromo: 'HEMAT15 (Diskon 15%)',
      checkoutUrl: 'https://tokokeren.com/checkout?cart=xyz890',
    },
  },
];

export class EcommerceTemplateEngine {
  private templates: Map<EcommerceEventType, EcommerceEventTemplate>;

  constructor() {
    this.templates = new Map();
    this.loadTemplates();
  }

  private loadTemplates(): void {
    try {
      if (fs.existsSync(TEMPLATES_FILE)) {
        const raw = fs.readFileSync(TEMPLATES_FILE, 'utf-8');
        const parsed: EcommerceEventTemplate[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const t of parsed) {
            this.templates.set(t.id, t);
          }
          // Ensure all default events exist
          for (const def of DEFAULT_ECOMMERCE_TEMPLATES) {
            if (!this.templates.has(def.id)) {
              this.templates.set(def.id, def);
            }
          }
          return;
        }
      }
    } catch {
      // Fallback
    }

    // Default init
    for (const t of DEFAULT_ECOMMERCE_TEMPLATES) {
      this.templates.set(t.id, { ...t });
    }
    this.saveTemplates();
  }

  private saveTemplates(): void {
    try {
      const list = Array.from(this.templates.values());
      fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch {
      // Ignore write errors in read-only environments
    }
  }

  public getAll(): EcommerceEventTemplate[] {
    return Array.from(this.templates.values());
  }

  public getById(id: EcommerceEventType): EcommerceEventTemplate | undefined {
    return this.templates.get(id);
  }

  public update(id: EcommerceEventType, template: string, enabled?: boolean): EcommerceEventTemplate | undefined {
    const existing = this.templates.get(id);
    if (!existing) return undefined;

    existing.template = template;
    if (typeof enabled === 'boolean') {
      existing.enabled = enabled;
    }
    this.templates.set(id, existing);
    this.saveTemplates();
    return existing;
  }

  public resetAll(): EcommerceEventTemplate[] {
    this.templates.clear();
    for (const t of DEFAULT_ECOMMERCE_TEMPLATES) {
      this.templates.set(t.id, { ...t });
    }
    this.saveTemplates();
    return this.getAll();
  }

  public compile(templateText: string, data: EcommerceEventData): string {
    let result = templateText;

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeFormatted = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const context: Record<string, string> = {
      customerName: data.customerName || 'Pelanggan',
      orderId: data.orderId || 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      storeName: data.storeName || 'Toko Online Kami',
      itemsSummary: data.itemsSummary || 'Produk Pesanan',
      totalAmount: data.totalAmount || 'Rp 0',
      paymentMethod: data.paymentMethod || 'Transfer Bank',
      paymentInstruction: data.paymentInstruction || 'Silakan transfer sesuai total tagihan.',
      courier: data.courier || 'Ekspedisi Reguler',
      trackingNumber: data.trackingNumber || '-',
      trackingUrl: data.trackingUrl || 'https://cekresi.com',
      deliveryAddress: data.deliveryAddress || 'Alamat Terdaftar',
      checkoutUrl: data.checkoutUrl || 'https://toko.com/checkout',
      discountPromo: data.discountPromo || 'HEMAT10',
      estimateDays: data.estimateDays || '1-3 Hari Kerja',
      date: dateFormatted,
      time: timeFormatted,
    };

    // Inject any extra custom data
    if (data.customData && typeof data.customData === 'object') {
      for (const [k, v] of Object.entries(data.customData)) {
        context[k] = String(v);
      }
    }

    // Replace all {{variables}}
    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      result = result.replace(regex, value);
    }

    return result.trim();
  }
}

export const ecommerceTemplateEngine = new EcommerceTemplateEngine();
