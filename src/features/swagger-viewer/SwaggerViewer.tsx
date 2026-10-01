import { useState, useEffect } from 'react';
import {
  ExternalLink,
  Download,
  FileCode,
  Check,
  Copy,
  Shield,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Terminal,
  Key,
} from 'lucide-react';
import { CodeBlock } from '../../components/CodeBlock';
import { api } from '../../services/api';

interface EndpointDef {
  id: string;
  tag: string;
  method: 'GET' | 'POST';
  path: string;
  summary: string;
  description: string;
  authRequired: boolean;
  permission?: string;
  defaultBody?: string;
  defaultQueryParams?: Record<string, string>;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
}

const ENDPOINTS: EndpointDef[] = [
  // OTP Endpoints
  {
    id: 'otp-send',
    tag: 'Pengiriman OTP',
    method: 'POST',
    path: '/api/v1/otp/send',
    summary: 'Kirim Kode OTP WhatsApp',
    description:
      'Mengirimkan kode verifikasi OTP langsung ke nomor WhatsApp tujuan dengan simulasi mengetik manusia (1.1 - 2.0s) dan proteksi jeda cooldown 60 detik.',
    authRequired: true,
    permission: 'otp:send',
    defaultBody: JSON.stringify(
      {
        to: '081234567890',
        otp: '849201',
        appName: 'FinPay Security',
        expiresInMinutes: 5,
        webhookUrl: 'https://api.yourdomain.com/webhooks/whatsapp',
      },
      null,
      2
    ),
    parameters: [
      { name: 'to', type: 'string', required: true, description: 'Nomor WhatsApp penerima (format 08... atau 62...)' },
      { name: 'otp', type: 'string', required: false, description: 'Kode OTP (opsional: jika dikosongkan, server otomatis mengacak kode 6-digit)' },
      { name: 'appName', type: 'string', required: false, description: 'Nama brand / aplikasi pengirim' },
      { name: 'expiresInMinutes', type: 'number', required: false, description: 'Masa berlaku kode (default 5 menit)' },
      { name: 'webhookUrl', type: 'string', required: false, description: 'URL Webhook untuk menerima callback status pesan' },
      { name: 'bypassRateLimit', type: 'boolean', required: false, description: 'Bypass batas jeda (untuk sandbox testing)' },
    ],
  },
  {
    id: 'otp-verify',
    tag: 'Pengiriman OTP',
    method: 'POST',
    path: '/api/v1/otp/verify',
    summary: 'Verifikasi Kode OTP WhatsApp (Terintegrasi)',
    description:
      'Memvalidasi apakah kode OTP yang dimasukkan pengguna valid, belum kedaluwarsa, dan belum melewati batas maksimal 3 kali percobaan. Sesi otomatis hangus setelah berhasil diverifikasi.',
    authRequired: true,
    permission: 'otp:send atau otp:read',
    defaultBody: JSON.stringify(
      {
        to: '081234567890',
        otp: '849201',
      },
      null,
      2
    ),
    parameters: [
      { name: 'to', type: 'string', required: true, description: 'Nomor WhatsApp penerima yang memverifikasi kode' },
      { name: 'otp', type: 'string', required: true, description: 'Kode OTP yang dimasukkan' },
    ],
  },
  {
    id: 'otp-template-get',
    tag: 'Pengiriman OTP',
    method: 'GET',
    path: '/api/v1/otp/template',
    summary: 'Ambil Template Pesan Default & Presets',
    description: 'Mengambil template pesan WhatsApp yang sedang aktif, daftar preset, serta variabel dinamis yang tersedia.',
    authRequired: false,
  },
  {
    id: 'otp-template-update',
    tag: 'Pengiriman OTP',
    method: 'POST',
    path: '/api/v1/otp/template/preview',
    summary: 'Simulasi Preview Template Pesan',
    description: 'Menerima teks template dan nilai dummy, mengembalikan hasil teks pesan terkompilasi.',
    authRequired: false,
    defaultBody: JSON.stringify(
      {
        template: 'Halo! Kode rahasia *{{appName}}* Anda adalah 👉 *{{otp}}*. Berlaku {{expiresIn}} menit.',
        otp: '849201',
        appName: 'FinPay Indonesia',
        expiresInMinutes: 5,
        phone: '+6281234567890',
      },
      null,
      2
    ),
    parameters: [
      { name: 'template', type: 'string', required: true, description: 'String template dengan placeholder {{otp}}, dll.' },
      { name: 'otp', type: 'string', required: false, description: 'Kode OTP contoh' },
    ],
  },
  {
    id: 'otp-logs',
    tag: 'Pengiriman OTP',
    method: 'GET',
    path: '/api/v1/otp/logs',
    summary: 'Riwayat Log Pengiriman OTP',
    description: 'Mengambil riwayat log pengiriman OTP yang tersimpan dalam ring-buffer memori server.',
    authRequired: false,
    defaultQueryParams: { limit: '10' },
    parameters: [
      { name: 'limit', type: 'number', required: false, description: 'Jumlah entri maksimal (default 50)' },
      { name: 'status', type: 'string', required: false, description: 'Filter status (sent / delivered / failed / pending)' },
    ],
  },

  // Auth Endpoints
  {
    id: 'auth-token',
    tag: 'Otentikasi Pengembang',
    method: 'POST',
    path: '/api/v1/auth/token',
    summary: 'Generate Token JWT Pengembang',
    description: 'Membuat token otentikasi JWT baru untuk pengembang dengan klaim identitas dan izin yang dapat disesuaikan.',
    authRequired: false,
    defaultBody: JSON.stringify(
      {
        sub: 'dev_finpay_backend',
        name: 'FinPay Production Service',
        permissions: ['otp:send', 'otp:read', 'status:read'],
        expiresIn: '30d',
      },
      null,
      2
    ),
    parameters: [
      { name: 'sub', type: 'string', required: true, description: 'ID unik pengembang / aplikasi' },
      { name: 'name', type: 'string', required: true, description: 'Nama aplikasi pengembang' },
      { name: 'permissions', type: 'string[]', required: false, description: 'Daftar izin (otp:send, otp:read, status:read)' },
      { name: 'expiresIn', type: 'string', required: false, description: 'Durasi masa aktif token (contoh: 30d, 7d, 365d)' },
    ],
  },
  {
    id: 'auth-verify',
    tag: 'Otentikasi Pengembang',
    method: 'POST',
    path: '/api/v1/auth/verify',
    summary: 'Validasi Token JWT Pengembang',
    description: 'Menguji apakah token JWT masih sah, belum kedaluwarsa, dan memeriksa klaim izin yang tersemat.',
    authRequired: false,
    defaultBody: JSON.stringify(
      {
        token: '',
      },
      null,
      2
    ),
    parameters: [{ name: 'token', type: 'string', required: true, description: 'String JWT token untuk diverifikasi' }],
  },

  // Gateway & Socket Endpoints
  {
    id: 'gateway-status',
    tag: 'WhatsApp Gateway',
    method: 'GET',
    path: '/api/v1/status',
    summary: 'Status Koneksi Socket & Metrik',
    description: 'Mengembalikan status koneksi WhatsApp Baileys (connected / disconnected / qr_ready) dan metrik pengiriman sistem.',
    authRequired: false,
  },
  {
    id: 'gateway-qr',
    tag: 'WhatsApp Gateway',
    method: 'GET',
    path: '/api/v1/qr',
    summary: 'Ambil QR Code Pairing Saat Ini',
    description: 'Mengembalikan QR code dalam format Base64 DataURL dan teks mentah jika WhatsApp dalam kondisi belum terhubung.',
    authRequired: false,
  },
  {
    id: 'gateway-pair-code',
    tag: 'WhatsApp Gateway',
    method: 'POST',
    path: '/api/v1/pair-code',
    summary: 'Minta Kode Pairing 8 Karakter (Tanpa Kamera)',
    description: 'Meminta 8 karakter kode pairing dari server WhatsApp untuk ditautkan via nomor telepon tanpa perlu memindai kamera.',
    authRequired: false,
    defaultBody: JSON.stringify(
      {
        phoneNumber: '081234567890',
      },
      null,
      2
    ),
    parameters: [{ name: 'phoneNumber', type: 'string', required: true, description: 'Nomor telepon WhatsApp server pengirim' }],
  },

  // Observabilitas & Debugging
  {
    id: 'logs-errors',
    tag: 'Observabilitas & Debugging',
    method: 'GET',
    path: '/api/v1/logs/errors',
    summary: 'Daftar Log Error Rinci',
    description: 'Mengambil daftar log error sistem lengkap dengan kode error dan saran tindakan perbaikan.',
    authRequired: false,
    defaultQueryParams: { limit: '20' },
  },
  {
    id: 'logs-console',
    tag: 'Observabilitas & Debugging',
    method: 'GET',
    path: '/api/v1/logs/console',
    summary: 'Stream Log Konsol Server',
    description: 'Mengambil riwayat log konsol dari modul WhatsApp, Hono API, dan otentikasi.',
    authRequired: false,
    defaultQueryParams: { limit: '50' },
  },
];

export function SwaggerViewer() {
  const [copiedSpec, setCopiedSpec] = useState(false);
  const [activeTab, setActiveTab] = useState<'explorer' | 'spec' | 'iframe'>('explorer');
  const [globalToken, setGlobalToken] = useState<string>('');
  const [openApiSpec, setOpenApiSpec] = useState<any>(null);
  const [isLoadingSpec, setIsLoadingSpec] = useState(false);

  // Endpoint interactive state
  const [expandedEndpoint, setExpandedEndpoint] = useState<string>('otp-send');
  const [requestBodies, setRequestBodies] = useState<Record<string, string>>({});
  const [requestParams, setRequestParams] = useState<Record<string, Record<string, string>>>({});
  const [executing, setExecuting] = useState<Record<string, boolean>>({});
  const [executionResults, setExecutionResults] = useState<Record<string, any>>({});

  const openApiUrl = `${window.location.origin}/api/openapi.json`;
  const swaggerDocsUrl = `${window.location.origin}/api/docs`;

  // Prepopulate default bodies & params
  useEffect(() => {
    const bodies: Record<string, string> = {};
    const params: Record<string, Record<string, string>> = {};
    ENDPOINTS.forEach((ep) => {
      if (ep.defaultBody) bodies[ep.id] = ep.defaultBody;
      if (ep.defaultQueryParams) params[ep.id] = { ...ep.defaultQueryParams };
    });
    setRequestBodies(bodies);
    setRequestParams(params);

    // Auto load token from auth generator if available
    api
      .generateToken({
        sub: 'dev_swagger_tester',
        name: 'Swagger Interactive Explorer',
        permissions: ['otp:send', 'otp:read', 'status:read'],
        expiresIn: '30d',
      })
      .then((res) => {
        setGlobalToken(res.token);
      })
      .catch(() => {});
  }, []);

  // Fetch OpenAPI JSON spec
  const fetchSpec = async () => {
    setIsLoadingSpec(true);
    try {
      const res = await fetch('/api/openapi.json');
      const data = await res.json();
      setOpenApiSpec(data);
    } catch (err) {
      console.error('Failed to fetch openapi spec:', err);
    } finally {
      setIsLoadingSpec(false);
    }
  };

  useEffect(() => {
    fetchSpec();
  }, []);

  const copySpecUrl = async () => {
    await navigator.clipboard.writeText(openApiUrl);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2000);
  };

  const handleExecute = async (endpoint: EndpointDef) => {
    setExecuting((prev) => ({ ...prev, [endpoint.id]: true }));
    setExecutionResults((prev) => ({ ...prev, [endpoint.id]: null }));

    const startTime = Date.now();
    try {
      let url = endpoint.path;
      const query = requestParams[endpoint.id];
      if (query && Object.keys(query).length > 0) {
        const qp = new URLSearchParams(query).toString();
        if (qp) url += `?${qp}`;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (globalToken.trim()) {
        headers['Authorization'] = `Bearer ${globalToken.trim()}`;
      }

      let bodyData: any = undefined;
      if (endpoint.method === 'POST') {
        const rawBody = requestBodies[endpoint.id] || '{}';
        try {
          bodyData = JSON.stringify(JSON.parse(rawBody));
        } catch {
          bodyData = rawBody;
        }
      }

      const res = await fetch(url, {
        method: endpoint.method,
        headers,
        body: bodyData,
      });

      const latencyMs = Date.now() - startTime;
      let responseBody: any;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        responseBody = await res.json();
      } else {
        responseBody = await res.text();
      }

      setExecutionResults((prev) => ({
        ...prev,
        [endpoint.id]: {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          latencyMs,
          body: responseBody,
        },
      }));
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      setExecutionResults((prev) => ({
        ...prev,
        [endpoint.id]: {
          status: 0,
          statusText: 'Network / Connection Error',
          ok: false,
          latencyMs,
          body: { error: err.message || 'Gagal menghubungi endpoint' },
        },
      }));
    } finally {
      setExecuting((prev) => ({ ...prev, [endpoint.id]: false }));
    }
  };

  // Group endpoints by tag
  const groupedEndpoints = ENDPOINTS.reduce((acc, ep) => {
    if (!acc[ep.tag]) acc[ep.tag] = [];
    acc[ep.tag].push(ep);
    return acc;
  }, {} as Record<string, EndpointDef[]>);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FileCode className="h-5 w-5 text-emerald-400" />
            <span>Dokumentasi OpenAPI &amp; Swagger API Explorer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dokumentasi REST API berstandar OpenAPI 3.0.3 lengkap dengan konsol pengujian interaktif *Try It Out* langsung di browser.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copySpecUrl}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            title="Salin URL openapi.json"
          >
            {copiedSpec ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedSpec ? 'URL Tersalin' : 'Salin URL Spec'}</span>
          </button>

          <a
            href={openApiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>openapi.json</span>
          </a>

          <a
            href={swaggerDocsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span>Buka /api/docs Tab Baru</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('explorer')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === 'explorer'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="h-3.5 w-3.5 text-emerald-400" />
          <span>Interactive API Explorer (Try It Out)</span>
        </button>
        <button
          onClick={() => setActiveTab('spec')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === 'spec'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="h-3.5 w-3.5 text-sky-400" />
          <span>Skema OpenAPI 3.0 JSON</span>
        </button>
        <button
          onClick={() => setActiveTab('iframe')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === 'iframe'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ExternalLink className="h-3.5 w-3.5 text-amber-400" />
          <span>Swagger UI Klasik</span>
        </button>
      </div>

      {activeTab === 'explorer' && (
        <div className="space-y-6">
          {/* Global Authorization Bar */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                <Key className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Global Authorization Token (Bearer)</h4>
                <p className="text-[11px] text-slate-400">
                  Token ini otomatis disematkan pada header <code className="text-slate-300">Authorization: Bearer &lt;token&gt;</code> di setiap eksekusi *Try It Out*.
                </p>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={globalToken}
                onChange={(e) => setGlobalToken(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Grouped Endpoints */}
          <div className="space-y-6">
            {Object.entries(groupedEndpoints).map(([tag, endpoints]) => (
              <div key={tag} className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  <span>{tag}</span>
                </h3>

                <div className="space-y-3">
                  {endpoints.map((ep) => {
                    const isExpanded = expandedEndpoint === ep.id;
                    const isRunning = executing[ep.id];
                    const result = executionResults[ep.id];

                    return (
                      <div
                        key={ep.id}
                        className={`rounded-xl border transition-all ${
                          isExpanded
                            ? 'border-slate-700 bg-slate-900/90 shadow-lg'
                            : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700/80'
                        }`}
                      >
                        {/* Endpoint Header / Trigger */}
                        <div
                          onClick={() => setExpandedEndpoint(isExpanded ? '' : ep.id)}
                          className="p-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                ep.method === 'POST'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                                  : 'bg-sky-950 text-sky-400 border border-sky-800/60'
                              }`}
                            >
                              {ep.method}
                            </span>
                            <span className="font-mono text-xs font-semibold text-slate-200">{ep.path}</span>
                            <span className="text-xs text-slate-400 hidden sm:inline">— {ep.summary}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            {ep.authRequired ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/30">
                                <Shield className="h-3 w-3" />
                                <span>{ep.permission || 'Bearer Auth'}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                Publik
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Expanded Interactive Body */}
                        {isExpanded && (
                          <div className="p-4 pt-1 border-t border-slate-800/80 space-y-4">
                            <p className="text-xs text-slate-300 leading-relaxed">{ep.description}</p>

                            {/* Parameters Table if any */}
                            {ep.parameters && ep.parameters.length > 0 && (
                              <div>
                                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                  Parameter Skema
                                </h5>
                                <div className="rounded-lg border border-slate-800 overflow-hidden">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                                      <tr>
                                        <th className="py-2 px-3">Nama</th>
                                        <th className="py-2 px-3">Tipe</th>
                                        <th className="py-2 px-3">Kewajiban</th>
                                        <th className="py-2 px-3">Keterangan</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                                      {ep.parameters.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-slate-950/40">
                                          <td className="py-2 px-3 text-slate-200 font-semibold">{p.name}</td>
                                          <td className="py-2 px-3 text-sky-400">{p.type}</td>
                                          <td className="py-2 px-3">
                                            {p.required ? (
                                              <span className="text-rose-400 font-sans font-bold text-[10px]">Wajib</span>
                                            ) : (
                                              <span className="text-slate-500 font-sans text-[10px]">Opsional</span>
                                            )}
                                          </td>
                                          <td className="py-2 px-3 text-slate-400 font-sans text-xs">{p.description}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Request Body Editor for POST */}
                            {ep.method === 'POST' && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                  Request Body (JSON)
                                </label>
                                <textarea
                                  rows={6}
                                  value={requestBodies[ep.id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setRequestBodies((prev) => ({ ...prev, [ep.id]: val }));
                                  }}
                                  className="w-full p-3 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 font-medium leading-relaxed"
                                />
                              </div>
                            )}

                            {/* Execute Action */}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[11px] text-slate-500">
                                Request URL: <code className="text-slate-400 font-mono">{ep.path}</code>
                              </span>
                              <button
                                onClick={() => handleExecute(ep)}
                                disabled={isRunning}
                                className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                {isRunning ? (
                                  <>
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    <span>Mengeksekusi...</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-3.5 w-3.5 fill-current" />
                                    <span>Jalankan Request (Execute)</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Result Display */}
                            {result && (
                              <div className="pt-3 space-y-2 border-t border-slate-800/80">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                        result.ok
                                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                                          : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                                      }`}
                                    >
                                      HTTP {result.status} {result.statusText}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-mono">
                                      Latensi: {result.latencyMs}ms
                                    </span>
                                  </div>
                                </div>

                                <CodeBlock
                                  language="json"
                                  title="Response Body"
                                  code={
                                    typeof result.body === 'object'
                                      ? JSON.stringify(result.body, null, 2)
                                      : String(result.body)
                                  }
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'spec' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60">
            <div>
              <h3 className="text-xs font-semibold text-white">OpenAPI 3.0.3 Specification Document</h3>
              <p className="text-[11px] text-slate-400">
                Definisi lengkap skema, path, skema error, dan komponen otentikasi format JSON.
              </p>
            </div>
            <button
              onClick={fetchSpec}
              disabled={isLoadingSpec}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingSpec ? 'animate-spin' : ''}`} />
              <span>Segarkan Spec</span>
            </button>
          </div>

          {openApiSpec ? (
            <CodeBlock
              language="json"
              title="openapi.json"
              code={JSON.stringify(openApiSpec, null, 2)}
            />
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">Memuat spesifikasi...</div>
          )}
        </div>
      )}

      {activeTab === 'iframe' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Menampilkan Swagger UI HTML bawaan server pada URL: <code className="text-emerald-400 font-mono">/api/docs</code>
            </span>
            <a
              href="/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1.5"
            >
              <span>Buka di Tab Baru Penuh</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0b1120] overflow-hidden shadow-2xl h-[700px]">
            <iframe
              src="/api/docs"
              title="Swagger Documentation"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
