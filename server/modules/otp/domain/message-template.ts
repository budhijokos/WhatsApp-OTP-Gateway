export interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  sample: string;
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { key: '{{otp}}', label: 'Kode OTP', description: 'Kode rahasia verifikasi OTP (Wajib)', sample: '849201' },
  { key: '{{appName}}', label: 'Nama Aplikasi', description: 'Nama brand atau layanan pengirim', sample: 'FinPay Indonesia' },
  { key: '{{expiresIn}}', label: 'Durasi Kedaluwarsa', description: 'Masa berlaku kode dalam menit', sample: '5' },
  { key: '{{phone}}', label: 'Nomor Penerima', description: 'Nomor WhatsApp tujuan yang menerima OTP', sample: '+6281234567890' },
  { key: '{{date}}', label: 'Tanggal', description: 'Tanggal pengiriman lokal (DD/MM/YYYY)', sample: '01/10/2026' },
  { key: '{{time}}', label: 'Waktu', description: 'Waktu pengiriman lokal (HH:mm WIB)', sample: '14:30 WIB' },
];

export interface TemplatePreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  template: string;
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'security_standard',
    name: 'Standar Keamanan Tinggi',
    badge: 'Rekomendasi',
    description: 'Format resmi lengkap dengan peringatan penipuan dan batas kedaluwarsa.',
    template: `🔐 *KODE VERIFIKASI OTP*

Gunakan kode verifikasi berikut untuk masuk ke *{{appName}}*:

👉 *{{otp}}*

⏳ Berlaku selama *{{expiresIn}} menit*.
⚠️ *PENTING:* Jangan berikan kode ini kepada siapa pun, termasuk pihak {{appName}}.

_{{appName}} OTP Security Gateway_`,
  },
  {
    id: 'minimalist',
    name: 'Minimalis & Cepat Salin',
    badge: 'Efisiensi',
    description: 'Format singkat dengan kode di baris teratas agar mudah dibaca pada notifikasi pop-up ponsel.',
    template: `*{{otp}}* adalah kode verifikasi {{appName}} Anda.

Berlaku selama {{expiresIn}} menit. JANGAN bagikan kode ini kepada siapa pun demi keamanan akun Anda.`,
  },
  {
    id: 'friendly_ecommerce',
    name: 'Ramah & E-Commerce',
    badge: 'Kasual',
    description: 'Gaya sapaan hangat yang cocok untuk aplikasi belanja, retail, atau komunitas.',
    template: `Halo! 👋

Terima kasih telah menggunakan layanan *{{appName}}*.
Berikut adalah kode verifikasi OTP Anda:

👉 *{{otp}}*

Kode ini berlaku selama *{{expiresIn}} menit*.
Jika Anda tidak merasa melakukan permintaan ini, abaikan pesan ini.

Salam hangat,
*Tim {{appName}}*`,
  },
  {
    id: 'fintech_banking',
    name: 'Perbankan & Transaksi Finansial',
    badge: 'Fintech',
    description: 'Format formal ketat dengan nomor tujuan dan stempel waktu transaksi.',
    template: `[NOTIFIKASI OTORISASI - {{appName}}]

Permintaan verifikasi transaksi terdeteksi:
• Nomor: {{phone}}
• Waktu: {{date}} {{time}}
• Kode OTP: *{{otp}}*
• Masa Aktif: {{expiresIn}} menit

PERINGATAN: Petugas {{appName}} TIDAK PERNAH meminta kode OTP Anda. Tolak jika ada yang meminta kode ini.`,
  },
];

export class MessageTemplateEngine {
  private static defaultTemplate: string = TEMPLATE_PRESETS[0].template;

  public static getDefaultTemplate(): string {
    return this.defaultTemplate;
  }

  public static setDefaultTemplate(template: string): void {
    if (!template || !template.trim()) {
      this.defaultTemplate = TEMPLATE_PRESETS[0].template;
      return;
    }
    this.defaultTemplate = template.trim();
  }

  public static resetDefaultTemplate(): string {
    this.defaultTemplate = TEMPLATE_PRESETS[0].template;
    return this.defaultTemplate;
  }

  public static compile(
    rawTemplate: string,
    data: {
      otp: string;
      appName?: string;
      expiresInMinutes?: number | string;
      phone?: string;
      date?: string;
      time?: string;
    }
  ): string {
    const template = rawTemplate || this.defaultTemplate;
    const now = new Date();

    const dateStr =
      data.date ||
      now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

    const timeStr =
      data.time ||
      now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });

    const appName = data.appName || 'Aplikasi';
    const expiresIn = String(data.expiresInMinutes || '5');
    const phone = data.phone || '-';
    const otp = data.otp;

    return template
      .replace(/{{otp}}/gi, otp)
      .replace(/{{code}}/gi, otp)
      .replace(/{{appName}}/gi, appName)
      .replace(/{{app_name}}/gi, appName)
      .replace(/{{expiresIn}}/gi, expiresIn)
      .replace(/{{expires_in}}/gi, expiresIn)
      .replace(/{{phone}}/gi, phone)
      .replace(/{{date}}/gi, dateStr)
      .replace(/{{time}}/gi, timeStr);
  }
}
