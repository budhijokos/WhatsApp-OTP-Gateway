import { useState } from 'react';
import { BookOpen, ShieldCheck, QrCode, Send, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { TokenManager } from './TokenManager';
import { CodeSamples } from './CodeSamples';

export function DeveloperGuide() {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      num: 1,
      title: '1. Otentikasi & Pembuatan Token JWT',
      desc: 'Dapatkan token Bearer bertanda tangan digital dengan hak akses otp:send.',
    },
    {
      num: 2,
      title: '2. Penautan Gateway WhatsApp',
      desc: 'Hubungkan socket Baileys menggunakan QR Code atau kode pairing 8-digit.',
    },
    {
      num: 3,
      title: '3. Integrasi Endpoint Pengiriman OTP',
      desc: 'Panggil POST /api/v1/otp/send dengan payload JSON terstruktur.',
    },
    {
      num: 4,
      title: '4. Penanganan Error & Retry Strategy',
      desc: 'Strategi penanganan kode 401, 403, 503, dan validasi nomor tujuan.',
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
              Integrasi REST API WhatsApp OTP Gateway
            </h1>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Panduan langkah demi langkah untuk mengintegrasikan layanan pengiriman kode OTP WhatsApp ke dalam sistem autentikasi, registrasi akun, checkout, atau verifikasi 2FA aplikasi Anda.
            </p>
          </div>

          {/* Architecture Illustration with CSS Fallback */}
          <div className="w-full md:w-64 h-32 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shrink-0 relative group">
            <img
              src="/src/assets/images/gateway_architecture_visual_1790838738030.jpg"
              alt="Arsitektur Gateway WhatsApp OTP"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              onError={(e) => {
                // Styled CSS fallback if image not found
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent flex items-end p-2.5">
              <span className="text-[10px] text-slate-400 font-mono">
                Hono.js ➔ Baileys Engine
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step by Step Navigation Pill-less */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((s) => {
          const isActive = activeStep === s.num;
          return (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num)}
              className={`p-4 rounded-xl border text-left transition-all ${
                isActive
                  ? 'border-emerald-500/50 bg-slate-900 shadow-sm'
                  : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-bold ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                  Langkah {s.num}
                </span>
                {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
              </div>
              <h3 className="text-xs font-semibold text-white">{s.title.split('. ')[1]}</h3>
              <p className="mt-1 text-[11px] text-slate-400 leading-normal line-clamp-2">{s.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Step Detail Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        {activeStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Langkah 1: Otentikasi Pengembang Menggunakan Token JWT</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Semua endpoint pengiriman OTP diamankan secara ketat menggunakan middleware validasi JWT. Setiap request wajib menyertakan header HTTP <code className="text-emerald-300">Authorization: Bearer &lt;TOKEN&gt;</code>.
            </p>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <span className="font-semibold text-white block">Aturan Validasi Middleware:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Header otentikasi wajib ada dan diawali kata <code className="text-slate-300">Bearer</code>.</li>
                <li>Token harus ditandatangani menggunakan algoritma HMAC-SHA256 (HS256) dengan server secret.</li>
                <li>Payload token harus menyertakan array <code className="text-slate-300">permissions</code> yang memuat string <code className="text-emerald-400 font-mono">otp:send</code>.</li>
                <li>Token yang kedaluwarsa akan menghasilkan kode HTTP 401 dengan error <code className="text-rose-400 font-mono">AUTH_TOKEN_EXPIRED</code>.</li>
              </ul>
            </div>

            <TokenManager />
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <QrCode className="h-4 w-4 text-emerald-400" />
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
              <strong>Catatan Penyimpanan:</strong> Sesuai kebutuhan Anda, sistem ini tidak menggunakan database eksternal. Kredensial socket disimpan di folder lokal <code className="text-amber-300">.baileys_auth</code> sehingga saat server di-restart koneksi langsung pulih otomatis.
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-400" />
              <span>Langkah 3: Mengirim Permintaan OTP via REST API</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Kirimkan HTTP POST ke <code className="text-emerald-300 font-mono">/api/v1/otp/send</code> dengan payload format JSON berikut:
            </p>

            <CodeSamples />
          </div>
        )}

        {activeStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Langkah 4: Penanganan Error &amp; Best Practice Retry</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Setiap respon error mengembalikan payload JSON terstandar dengan error code dan rekomendasi tindakan perbaikan otomatis:
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
                  <span className="font-mono font-bold text-amber-400">HTTP 403 AUTH_FORBIDDEN_PERMISSION</span>
                  <span className="text-[11px] text-slate-500">Izin Kurang</span>
                </div>
                <p className="text-slate-400">
                  Token JWT tidak memiliki izin <code className="text-slate-300">otp:send</code>. Solusi: Buat ulang token pada tab Developer Auth dengan mencentang <code className="text-slate-300">otp:send</code>.
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
                  Pengiriman ke nomor yang sama dibatasi jeda minimal 60 detik demi mematuhi kebijakan anti-spam WhatsApp. Solusi: Tangkap response header atau property <code className="text-slate-300">retryAfterSeconds</code> sebelum mengirim ulang.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-sky-400">HTTP 400 PHONE_INVALID_FORMAT</span>
                  <span className="text-[11px] text-slate-500">Nomor Tidak Valid</span>
                </div>
                <p className="text-slate-400">
                  Nomor kurang dari 10 digit atau memuat karakter non-angka. Server otomatis mengubah awalan 08 menjadi 628, namun pastikan nomor terdaftar di WhatsApp.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
