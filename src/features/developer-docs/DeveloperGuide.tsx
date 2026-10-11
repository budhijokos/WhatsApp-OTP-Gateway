import { useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  QrCode,
  Send,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RotateCw,
  Key,
  Lock,
  ExternalLink,
  ShieldAlert,
  Clock,
  ShoppingBag,
  Truck,
  Package,
  CreditCard,
  Layers,
} from 'lucide-react';
import { TokenManager } from './TokenManager';
import { CodeSamples } from './CodeSamples';
import { CodeBlock } from '../../components/CodeBlock';

interface DeveloperGuideProps {
  onNavigate?: (tab: string) => void;
}

export function DeveloperGuide({ onNavigate }: DeveloperGuideProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const baseUrl = window.location.origin;

  const steps = [
    {
      num: 1,
      title: '1. Otentikasi & Kunci API Pengembang',
      desc: 'Daftarkan aplikasi klien dan dapatkan token JWT bertanda tangan digital.',
    },
    {
      num: 2,
      title: '2. Penautan Gateway WhatsApp',
      desc: 'Hubungkan socket Baileys menggunakan QR Code atau kode pairing 8-digit.',
    },
    {
      num: 3,
      title: '3. Integrasi Kirim & Verifikasi OTP',
      desc: 'Panggil POST /api/v1/otp/send dan verifikasi kode via REST API.',
    },
    {
      num: 4,
      title: '4. Notifikasi E-Commerce & Toko Online',
      desc: 'Pesan otomatis saat order masuk, pembayaran lunas, resi keluar, COD, dll.',
    },
    {
      num: 5,
      title: '5. Penanganan Error & Kode Galat',
      desc: 'Penanganan kode 401, 403, 429, 503, dan validasi format nomor.',
    },
    {
      num: 6,
      title: '6. Rotasi Kunci (Zero-Downtime)',
      desc: 'Rotasi berkala token produksi dengan masa tenggang (grace period).',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-2">
              <BookOpen className="h-4 w-4" />
              <span>Panduan Lengkap Implementasi Pengembang</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white text-balance">
              Integrasi REST API WhatsApp OTP &amp; E-Commerce Gateway
            </h1>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Panduan langkah demi langkah untuk mengintegrasikan layanan pengiriman kode OTP WhatsApp dan notifikasi pesanan e-commerce (order, pembayaran lunas, nomor resi kurir, konfirmasi COD, dan keranjang belanja) dengan standar keamanan perbankan dan rotasi kunci tanpa downtime.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <span>Swagger UI Docs</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
            {onNavigate && (
              <button
                onClick={() => onNavigate('keys')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Key className="h-3.5 w-3.5" />
                <span>Kelola Kunci API (JWT)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step by Step Navigation - Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {steps.map((s) => {
          const isActive = activeStep === s.num;
          return (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num)}
              className={`p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'border-emerald-500/50 bg-slate-900 shadow-sm ring-1 ring-emerald-500/30'
                  : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-bold ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                  Langkah {s.num}
                </span>
                {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
              </div>
              <h3 className="text-xs font-semibold text-white truncate">{s.title.split('. ')[1]}</h3>
              <p className="mt-1 text-[11px] text-slate-400 leading-normal line-clamp-2">{s.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Step Detail Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6 space-y-6">
        {/* STEP 1 */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Langkah 1: Otentikasi Pengembang Menggunakan Token JWT</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Semua endpoint pengiriman OTP dan notifikasi e-commerce diamankan secara ketat menggunakan middleware validasi JWT. Setiap request wajib menyertakan header HTTP <code className="text-emerald-300">Authorization: Bearer &lt;TOKEN&gt;</code>.
            </p>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <span className="font-semibold text-white block">Aturan Validasi Middleware:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Header otentikasi wajib ada dan diawali kata <code className="text-slate-300">Bearer</code>.</li>
                <li>Token harus ditandatangani menggunakan algoritma HMAC-SHA256 (HS256) dengan server secret.</li>
                <li>Payload token harus menyertakan array <code className="text-slate-300">permissions</code> yang memuat string <code className="text-emerald-400 font-mono">otp:send</code>.</li>
                <li>Mendukung sistem <strong>Zero-Downtime Key Rotation</strong> dengan masa tenggang toleransi kunci lama.</li>
                <li>Token yang kedaluwarsa akan menghasilkan kode HTTP 401 dengan error <code className="text-rose-400 font-mono">AUTH_TOKEN_EXPIRED</code>, dan kunci yang dicabut menghasilkan <code className="text-rose-400 font-mono">AUTH_KEY_REVOKED</code>.</li>
              </ul>
            </div>

            {/* Quick Action to Keys Tab */}
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-emerald-400" />
                  <span>Manajemen Multi-Klien &amp; Rotasi Kunci Produksi</span>
                </span>
                <span className="text-[11px] text-emerald-300/80 block">
                  Untuk mendaftarkan beberapa aplikasi (Mobile App, Web, Toko Online), melihat statistik panggilan, atau merotasi kunci dengan masa tenggang, gunakan tab <strong>Kunci API (JWT)</strong>.
                </span>
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('keys')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shrink-0 cursor-pointer"
                >
                  Buka Menu Kunci API →
                </button>
              )}
            </div>

            <TokenManager />
          </div>
        )}

        {/* STEP 2 */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <QrCode className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Langkah 2: Penautan Gateway WhatsApp (WhiskeySockets Baileys)</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gateway ini menggunakan library <strong className="text-white">@whiskeysockets/baileys</strong> untuk terhubung langsung ke jaringan protokol multi-device WhatsApp melalui web socket terenkripsi end-to-end tanpa memerlukan WhatsApp Business API resmi yang mahal.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-emerald-400">Opsi A:</span> Pindai QR Code Kamera
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Buka dasbor utama atau klik tombol &quot;Tautkan WhatsApp&quot; di sudut atas.</li>
                  <li>Di HP server, buka WhatsApp &gt; Perangkat Tertaut &gt; Tautkan Perangkat.</li>
                  <li>Arahkan kamera ke QR Code yang otomatis di-refresh tiap 20 detik.</li>
                </ol>
              </div>

              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-sky-400">Opsi B:</span> Kode Pairing 8 Karakter (Tanpa Kamera)
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Buka modal pairing &gt; tab &quot;Kode Pairing 8 Karakter&quot;.</li>
                  <li>Ketikkan nomor telepon ponsel pengirim (misal: 081234567890).</li>
                  <li>Di WhatsApp HP: Perangkat Tertaut &gt; Tautkan dengan nomor telepon saja &gt; ketik 8 karakter.</li>
                </ol>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
              <strong>Catatan Penyimpanan Sesi:</strong> Kredensial socket disimpan di folder lokal <code className="text-amber-300">.baileys_auth</code> sehingga saat server di-restart koneksi langsung pulih otomatis tanpa perlu scan ulang.
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Langkah 3: Mengirim Permintaan OTP via REST API</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Kirimkan HTTP POST ke <code className="text-emerald-300 font-mono">/api/v1/otp/send</code> dengan payload format JSON berikut. Gateway mendukung mode acak otomatis (server membuat kode 6 digit) maupun kode kustom dari backend Anda:
            </p>

            <CodeSamples />
          </div>
        )}

        {/* STEP 4: E-COMMERCE & TOKO ONLINE */}
        {activeStep === 4 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Langkah 4: Integrasi Notifikasi E-Commerce &amp; Toko Online</span>
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  Kirimkan notifikasi WhatsApp otomatis berbasis status pesanan (Checkout, Pembayaran Terverifikasi, Resi Ekspedisi Keluar, Paket Sampai, Konfirmasi COD, dan Keranjang Belanja).
                </p>
              </div>

              {onNavigate && (
                <button
                  onClick={() => onNavigate('ecommerce')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Buka Tab E-Commerce →</span>
                </button>
              )}
            </div>

            {/* Endpoint & Header Box */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-400">
                    POST
                  </span>
                  <span className="text-slate-200">{baseUrl}/api/v1/ecommerce/events</span>
                </div>
                <span className="text-slate-400 font-sans">
                  Header: <code className="text-emerald-400">Authorization: Bearer &lt;TOKEN&gt;</code>
                </span>
              </div>
            </div>

            {/* Event Catalog Grid */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Tipe Event yang Didukung (Parameter &quot;event&quot;):
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <code className="text-emerald-400 font-bold">order_created</code>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400">Checkout</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Dipicu saat pembeli selesai membuat pesanan baru (berisi rekening transfer &amp; rincian barang).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <code className="text-emerald-400 font-bold">payment_received</code>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-300">Lunas</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Dipicu saat pembayaran berhasil diverifikasi (dari Midtrans/Xendit/manual mutasi).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <code className="text-emerald-400 font-bold">shipping_dispatched</code>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-950 text-cyan-300">Resi Keluar</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Dipicu saat nomor resi ekspedisi (J&amp;T, JNE, SiCepat) tersedia beserta link pelacakan paket.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <code className="text-emerald-400 font-bold">order_delivered</code>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400">Sampai</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Dipicu saat kurir mengonfirmasi paket tiba di alamat tujuan + permintaan ulasan produk.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <code className="text-emerald-400 font-bold">cod_confirmation</code>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-950 text-amber-300">Anti-Retur</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Konfirmasi pesanan COD sebelum dikirim: pembeli diminta membalas <strong>YA</strong> atau <strong>BATAL</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <code className="text-emerald-400 font-bold">abandoned_cart</code>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-950 text-rose-300">Keranjang</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Pengingat otomatis untuk pelanggan yang meninggalkan barang di keranjang belanja belum lunas.
                  </p>
                </div>
              </div>
            </div>

            {/* Code Sample */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Contoh Pemanggilan REST API / Webhook (cURL):
              </span>
              <CodeBlock
                language="bash"
                code={`curl -X POST "${baseUrl}/api/v1/ecommerce/events" \\
  -H "Authorization: Bearer <KUNCI_API_JWT_ANDA>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "shipping_dispatched",
    "to": "081234567890",
    "data": {
      "customerName": "Budi Santoso",
      "orderId": "INV-202610-098",
      "storeName": "Toko Keren Official",
      "courier": "J&T Express",
      "trackingNumber": "JT9823481230ID",
      "trackingUrl": "https://cekresi.com/?no=JT9823481230ID",
      "totalAmount": "Rp 275.000"
    }
  }'`}
              />
            </div>

            {/* Feature Highlights */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 text-slate-300">
              <span className="font-bold text-white block">Keunggulan Modul E-Commerce Terpadu:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><strong>Anti-Ban Typing Simulation:</strong> WhatsApp bot mensimulasikan status mengetik <em>composing</em> selama 1.1s – 2.0s sebelum pesan meluncur.</li>
                <li><strong>Template Editor Lengkap:</strong> Sesuaikan susunan kata-kata per event langsung dari tab <strong className="text-white">E-Commerce</strong> di dasbor.</li>
                <li><strong>Variabel Dinamis:</strong> Mendukung tag variabel <code className="text-emerald-400">&#123;&#123;customerName&#125;&#125;</code>, <code className="text-emerald-400">&#123;&#123;orderId&#125;&#125;</code>, <code className="text-emerald-400">&#123;&#123;trackingNumber&#125;&#125;</code>, <code className="text-emerald-400">&#123;&#123;trackingUrl&#125;&#125;</code>, dan lainnya.</li>
                <li><strong>Pelacakan Otomatis:</strong> Setiap pesan tercatat ke Log Pengiriman dan Konsol Server Live secara real-time.</li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 5 */}
        {activeStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>Langkah 5: Penanganan Error &amp; Best Practice Retry</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Setiap respon error mengembalikan payload JSON terstandar dengan kode galat (*error code*) terdefinisi dan rekomendasi tindakan otomatis:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-amber-400">HTTP 401 AUTH_HEADER_MISSING</span>
                  <span className="text-[11px] text-slate-500">Otentikasi Hilang</span>
                </div>
                <p className="text-slate-400">
                  Header Authorization tidak dikirim. Solusi: Pastikan library client menyertakan <code className="text-slate-300">Authorization: Bearer &lt;token&gt;</code>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-rose-400">HTTP 401 AUTH_KEY_REVOKED</span>
                  <span className="text-[11px] text-slate-500">Kunci Dicabut</span>
                </div>
                <p className="text-slate-400">
                  Kunci API ini telah dicabut atau dinonaktifkan oleh administrator karena alasan keamanan. Solusi: Masuk ke tab Kunci API (JWT) dan terbitkan kunci baru.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-amber-400">HTTP 401 AUTH_TOKEN_EXPIRED</span>
                  <span className="text-[11px] text-slate-500">Kunci Kedaluwarsa</span>
                </div>
                <p className="text-slate-400">
                  Masa berlaku token telah habis atau masa tenggang (*grace period*) rotasi telah terlampaui. Solusi: Rotasi token di dasbor dengan masa aktif baru.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-amber-400">HTTP 403 AUTH_FORBIDDEN_PERMISSION</span>
                  <span className="text-[11px] text-slate-500">Izin Kurang</span>
                </div>
                <p className="text-slate-400">
                  Token JWT tidak memiliki izin <code className="text-slate-300">otp:send</code>. Solusi: Buat ulang token pada tab Kunci API dengan mencentang scope <code className="text-slate-300">otp:send</code>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-rose-400">HTTP 503 WA_NOT_CONNECTED</span>
                  <span className="text-[11px] text-slate-500">Gateway WhatsApp Terputus</span>
                </div>
                <p className="text-slate-400">
                  Socket WhatsApp ponsel server sedang offline atau belum dipindai QR code. Solusi: Pindai ulang QR di dasbor atau periksa koneksi internet ponsel server.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-amber-400">HTTP 429 RATE_LIMIT_COOLDOWN</span>
                  <span className="text-[11px] text-slate-500">Jeda Cooldown 60 Detik</span>
                </div>
                <p className="text-slate-400">
                  Pengiriman ke nomor yang sama dibatasi jeda minimal 60 detik demi mematuhi kebijakan anti-spam WhatsApp. Solusi: Tangkap response property <code className="text-slate-300">retryAfterSeconds</code> sebelum mengirim ulang.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-rose-400">HTTP 400 OTP_MAX_ATTEMPTS_EXCEEDED</span>
                  <span className="text-[11px] text-slate-500">Batas Percobaan Habis</span>
                </div>
                <p className="text-slate-400">
                  Pengguna salah memasukkan kode OTP 3 kali berturut-turut. Demi keamanan, sesi OTP otomatis hangus dan pengguna wajib meminta OTP baru.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6 */}
        {activeStep === 6 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <RotateCw className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Langkah 6: Zero-Downtime Key Rotation &amp; Manajemen Multi-Klien</span>
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  Pada lingkungan enterprise, penggantian kunci API produksi tidak boleh menyebabkan transaksi atau pengiriman pesan yang sedang berjalan terputus (*zero downtime*).
                </p>
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('keys')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer shrink-0"
                >
                  Buka Dasbor Kunci API →
                </button>
              )}
            </div>

            {/* Rotation Timeline Visual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                <div className="text-amber-400 font-bold flex items-center gap-1.5">
                  <RotateCw className="h-4 w-4" />
                  <span>1. Inisiasi Rotasi</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Administrator menekan tombol <strong>Rotasi Kunci</strong> di tab Kunci API (JWT) dan memilih durasi masa tenggang (contoh: 24 jam).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-950/20 space-y-2">
                <div className="text-amber-300 font-bold flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>2. Masa Tenggang (Grace Period)</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Kunci baru langsung aktif. <strong>Kunci lama tetap diizinkan</strong> hingga batas masa tenggang berakhir, disertai respon header <code className="text-amber-300 font-mono text-[10px]">X-Key-Rotation-Warning</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 space-y-2">
                <div className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>3. Transisi Sempurna</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Tim pengembang memperbarui variabel lingkungan di backend/CI-CD. Setelah grace period usai, kunci lama otomatis hangus tanpa pernah ada request yang gagal.
                </p>
              </div>
            </div>

            {/* REST API Endpoints for Key Management */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <span className="text-xs font-bold text-white block">
                Endpoint REST API Manajemen Kunci Pengembang:
              </span>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-emerald-400">GET /api/v1/keys</span>
                  <span className="text-slate-400 font-sans text-xs">Melihat daftar semua kunci dan telemetri</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-sky-400">POST /api/v1/keys</span>
                  <span className="text-slate-400 font-sans text-xs">Mendaftarkan aplikasi klien baru</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-amber-400">POST /api/v1/keys/:id/rotate</span>
                  <span className="text-slate-400 font-sans text-xs">Rotasi kunci dengan masa tenggang (grace period)</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-rose-400">POST /api/v1/keys/:id/revoke</span>
                  <span className="text-slate-400 font-sans text-xs">Pencabutan darurat kunci yang bocor</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
