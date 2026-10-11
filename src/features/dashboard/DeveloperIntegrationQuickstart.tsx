import { useState } from 'react';
import {
  Terminal,
  Key,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Code2,
} from 'lucide-react';

interface DeveloperIntegrationQuickstartProps {
  onNavigate: (tab: string) => void;
}

export function DeveloperIntegrationQuickstart({ onNavigate }: DeveloperIntegrationQuickstartProps) {
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python' | 'php'>('curl');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://otp.bacakata.com';

  const codeSnippets = {
    curl: `curl -X POST "${currentHost}/api/v1/otp/send" \\
  -H "Authorization: Bearer <TOKEN_JWT_DARI_TAB_KUNCI_API>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "081234567890",
    "appName": "Nama Aplikasi Anda",
    "expiryMinutes": 5
  }'`,
    node: `// Node.js (Fetch API ES Modules / Next.js)
const response = await fetch('${currentHost}/api/v1/otp/send', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${process.env.WA_OTP_JWT_TOKEN}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: '081234567890',
    appName: 'Nama Aplikasi Anda',
    expiryMinutes: 5,
  }),
});

const result = await response.json();
console.log('OTP Result:', result);`,
    python: `# Python (Requests)
import os
import requests

url = "${currentHost}/api/v1/otp/send"
headers = {
    "Authorization": f"Bearer {os.getenv('WA_OTP_JWT_TOKEN')}",
    "Content-Type": "application/json"
}
payload = {
    "to": "081234567890",
    "appName": "Nama Aplikasi Anda",
    "expiryMinutes": 5
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    php: `// PHP / Laravel Http Client
use Illuminate\\Support\\Facades\\Http;

$response = Http::withToken(env('WA_OTP_JWT_TOKEN'))
    ->post('${currentHost}/api/v1/otp/send', [
        'to' => '081234567890',
        'appName' => 'Nama Aplikasi Anda',
        'expiryMinutes' => 5,
    ]);

if ($response->successful()) {
    $data = $response->json('data');
    return $data;
}`,
  };

  const envSample = `WA_OTP_GATEWAY_URL=${currentHost}
WA_OTP_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
      {/* Top Banner */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Code2 className="h-4 w-4" />
            <span>Panduan Integrasi Pengembang (Quickstart)</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Cara Menghubungkan Aplikasi Anda ke WhatsApp OTP Gateway
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
            Ikuti 4 langkah sederhana berikut untuk meminta kunci API, menyimpan kredensial dengan aman, dan memanggil endpoint REST API resmi menggunakan spesifikasi OpenAPI / Swagger.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:text-white transition-colors"
          >
            <span>Swagger UI Docs</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>
          <button
            onClick={() => onNavigate('developer')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
            <span>Dokumentasi Lengkap</span>
          </button>
        </div>
      </div>

      {/* 4 Steps Grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1 & Step 2 */}
        <div className="space-y-5">
          {/* Step 1 */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                  1
                </span>
                <h3 className="text-xs font-bold text-white">Dapatkan Kunci API (JWT) Aplikasi</h3>
              </div>
              <button
                onClick={() => onNavigate('keys')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Buka Tab Kunci API</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Buka menu <strong className="text-slate-200">Kunci API (JWT)</strong> di navigasi atas, lalu daftarkan aplikasi klien Anda (contoh: <em>Mobile App iOS</em>, <em>Web Checkout</em>, atau <em>Admin CRM</em>). Anda akan mendapatkan string token JWT yang ditandatangani secara kriptografis oleh server.
            </p>

            <div className="pt-1">
              <button
                onClick={() => onNavigate('keys')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-xs cursor-pointer"
              >
                <Key className="h-3.5 w-3.5" />
                <span>+ Buat Kunci API Baru di Dasbor</span>
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                  2
                </span>
                <h3 className="text-xs font-bold text-white">Simpan di Environment Variables (.env)</h3>
              </div>
              <button
                onClick={() => copyToClipboard(envSample, 'env_file')}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer font-mono"
              >
                {copiedSnippet === 'env_file' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedSnippet === 'env_file' ? 'Tersalin' : 'Salin .env'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Simpan kredensial token JWT pada konfigurasi backend/microservice Anda, jangan cantumkan pada repositori publik:
            </p>

            <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto select-all">
              {envSample}
            </pre>
          </div>

          {/* Step 4: Verification */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                4
              </span>
              <h3 className="text-xs font-bold text-white">Verifikasi Kode OTP (`POST /api/v1/otp/verify`)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jika kode OTP di-generate otomatis oleh gateway, verifikasi kode masukan pengguna dengan mengirimkan JSON:
            </p>
            <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
{`POST /api/v1/otp/verify
{
  "to": "081234567890",
  "otp": "849201"
}`}
            </pre>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Proteksi brute-force otomatis maksimal 3x salah tebak per sesi OTP.</span>
            </div>
          </div>
        </div>

        {/* Step 3: Code Snippets Box */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                  3
                </span>
                <h3 className="text-xs font-bold text-white">Kirim OTP (`POST /api/v1/otp/send`)</h3>
              </div>

              {/* Language Tabs */}
              <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-[11px]">
                {(['curl', 'node', 'python', 'php'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`px-2 py-0.5 rounded font-mono uppercase transition-colors cursor-pointer ${
                      activeLang === lang
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'node' ? 'Node' : lang}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Panggil endpoint pengiriman OTP dengan header HTTP <code className="text-emerald-300 font-mono">Authorization: Bearer &lt;TOKEN&gt;</code>:
            </p>

            <div className="relative mt-2.5">
              <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-72 leading-relaxed">
                {codeSnippets[activeLang]}
              </pre>

              <button
                onClick={() => copyToClipboard(codeSnippets[activeLang], `code_${activeLang}`)}
                className="absolute top-2.5 right-2.5 px-2 py-1 rounded bg-slate-800/90 hover:bg-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1 border border-slate-700 cursor-pointer transition-colors"
                title="Salin Cuplikan Kode"
              >
                {copiedSnippet === `code_${activeLang}` ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{copiedSnippet === `code_${activeLang}` ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Fitur Otomatis Gateway:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400 pl-1">
              <li>Menerima format nomor <code>08xxx</code>, <code>628xxx</code>, maupun berspasi.</li>
              <li>Otomatis mengacak 6 digit angka aman jika field <code>otp</code> dikosongkan.</li>
              <li>Jeda anti-spam 60 detik (*cooldown*) per nomor penerima.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
