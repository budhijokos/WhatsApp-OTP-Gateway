import { useState, useEffect } from 'react';
import { Send, RefreshCw, Key, CheckCircle2, AlertCircle, Sparkles, MessageSquare, ShieldCheck, Webhook, Zap, Clock } from 'lucide-react';
import { WhatsAppState } from '../../types';
import { api } from '../../services/api';
import { CodeBlock } from '../../components/CodeBlock';

interface OtpTesterProps {
  waState: WhatsAppState;
  onOpenPairing: () => void;
  initialTemplate?: string;
}

export function OtpTester({ waState, onOpenPairing, initialTemplate }: OtpTesterProps) {
  const [activeMode, setActiveMode] = useState<'send' | 'verify'>('send');

  // Send state
  const [phone, setPhone] = useState('081234567890');
  const [otp, setOtp] = useState('739104');
  const [appName, setAppName] = useState('FinPay Security');
  const [expiresIn, setExpiresIn] = useState(5);
  const [customMessage, setCustomMessage] = useState(initialTemplate || '');
  const [useCustomTemplate, setUseCustomTemplate] = useState(Boolean(initialTemplate));
  const [webhookUrl, setWebhookUrl] = useState('');
  const [bypassCooldown, setBypassCooldown] = useState(false);
  const [jwtToken, setJwtToken] = useState('');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [responseResult, setResponseResult] = useState<any>(null);
  const [errorResult, setErrorResult] = useState<any>(null);

  // Sync initialTemplate if updated from Template Editor
  useEffect(() => {
    if (initialTemplate) {
      setCustomMessage(initialTemplate);
      setUseCustomTemplate(true);
    }
  }, [initialTemplate]);

  // Verify state
  const [verifyPhone, setVerifyPhone] = useState('081234567890');
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResponse, setVerifyResponse] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<any>(null);

  // Generate a random 6-digit OTP
  const generateRandomOtp = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    setOtp(String(num));
    setVerifyCode(String(num));
  };

  // Generate initial developer token if empty
  useEffect(() => {
    async function loadToken() {
      if (!jwtToken) {
        try {
          const res = await api.generateToken({
            sub: 'dev_sandbox_tester',
            name: 'Sandbox Developer User',
            permissions: ['otp:send', 'otp:read', 'status:read'],
            expiresIn: '30d',
          });
          setJwtToken(res.token);
        } catch {
          // Token generate failure fallback
        }
      }
    }
    loadToken();
  }, [jwtToken]);

  const handleGenerateFreshToken = async () => {
    setIsGeneratingToken(true);
    try {
      const res = await api.generateToken({
        sub: 'dev_sandbox_' + Math.random().toString(36).substring(2, 7),
        name: 'Tester App Admin',
        permissions: ['otp:send', 'otp:read', 'status:read'],
        expiresIn: '7d',
      });
      setJwtToken(res.token);
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setResponseResult(null);
    setErrorResult(null);

    const payload = {
      to: phone,
      otp: otp.trim() ? otp.trim() : undefined,
      appName,
      expiresInMinutes: expiresIn,
      message: useCustomTemplate && customMessage.trim() ? customMessage : undefined,
      webhookUrl: webhookUrl.trim() ? webhookUrl.trim() : undefined,
      bypassRateLimit: bypassCooldown,
    };

    try {
      const result = await api.sendOtp(payload as any, jwtToken);
      setResponseResult(result);
      // Auto fill verification form with sent or auto-generated OTP
      setVerifyPhone(phone);
      const finalUsedOtp = result?.data?.otp || otp;
      setVerifyCode(finalUsedOtp);
      if (!otp.trim()) {
        setOtp(finalUsedOtp);
      }
    } catch (err: any) {
      setErrorResult(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setVerifyResponse(null);
    setVerifyError(null);

    try {
      const result = await api.verifyOtp(
        {
          to: verifyPhone,
          otp: verifyCode,
        },
        jwtToken
      );
      setVerifyResponse(result);
    } catch (err: any) {
      setVerifyError(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const isConnected = waState.status === 'connected';

  // Preview text for WhatsApp bubble
  const previewText =
    useCustomTemplate && customMessage.trim()
      ? customMessage
      : `🔐 *KODE VERIFIKASI OTP*\n\nGunakan kode verifikasi berikut untuk masuk ke *${appName || 'Aplikasi'}*:\n\n👉 *${otp || '000000'}*\n\n⏳ Berlaku selama *${expiresIn} menit*.\n⚠️ *PENTING:* Jangan berikan kode ini kepada siapa pun, termasuk pihak ${appName || 'layanan'}.\n\n_${appName || 'Aplikasi'} OTP Security Gateway_`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Interactive OTP Testing Sandbox</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Uji coba siklus pengiriman OTP, simulasi mengetik anti-ban, cooldown rate limiter, dan verifikasi kode terintegrasi.
          </p>
        </div>
        {!isConnected && (
          <button
            onClick={onOpenPairing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Ponsel Belum Terhubung (Tautkan WA)</span>
          </button>
        )}
      </div>

      {/* Mode Switcher */}
      <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800 w-fit">
        <button
          onClick={() => setActiveMode('send')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
            activeMode === 'send'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send className="h-3.5 w-3.5 text-emerald-400" />
          <span>Kirim OTP (POST /api/v1/otp/send)</span>
        </button>
        <button
          onClick={() => setActiveMode('verify')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
            activeMode === 'verify'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
          <span>Verifikasi OTP (POST /api/v1/otp/verify)</span>
        </button>
      </div>

      {activeMode === 'send' ? (
        /* SEND OTP SECTION */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            <form onSubmit={handleSend} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              {/* JWT Token Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Developer JWT Bearer Token</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateFreshToken}
                    disabled={isGeneratingToken}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${isGeneratingToken ? 'animate-spin' : ''}`} />
                    <span>Generate Token Baru</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={jwtToken}
                  onChange={(e) => setJwtToken(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Recipient Phone & OTP */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nomor WhatsApp Penerima
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    required
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Jeda cooldown otomatis 60 detik berlaku per nomor penerima.
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">
                      Kode OTP <span className="text-[10px] text-slate-500 font-normal">(Acak jika kosong)</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomOtp}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Acak Sekarang</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Kosongkan untuk acak otomatis 6 digit"
                    className="w-full px-3 py-2 text-xs font-mono font-bold tracking-wider rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Server otomatis mengacak 6-digit angka acak jika kolom ini dikosongkan.
                  </span>
                </div>
              </div>

              {/* App Name & Expiry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Aplikasi / Brand
                  </label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Misal: FinPay Security"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Masa Berlaku Sesi (Menit)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Optional Webhook URL */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Webhook className="h-3.5 w-3.5 text-sky-400" />
                  <span>Webhook Callback URL (Opsional)</span>
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.yourdomain.com/webhooks/whatsapp"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Server akan mengirimkan HTTP POST event (otp.sent, otp.delivered, otp.read) ke URL ini.
                </span>
              </div>

              {/* Rate Limit Bypass Checkbox */}
              <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bypassCooldown}
                    onChange={(e) => setBypassCooldown(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-0"
                  />
                  <span>Bypass Cooldown 60 Detik (Testing Sandbox Header)</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSending || !phone || !otp}
                  className="w-full py-2.5 px-4 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Simulasi Mengetik &amp; Mengirim ke WhatsApp...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Kirim OTP Sekarang (POST /api/v1/otp/send)</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Response Inspector */}
            {responseResult && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>HTTP 200 OK — Pesan Berhasil Terkirim</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-emerald-400">
                    <span>Typing: {responseResult.data?.simulatedTypingMs || 0}ms</span>
                    <span>Total Latensi: {responseResult.data?.latencyMs}ms</span>
                  </div>
                </div>
                <CodeBlock
                  code={JSON.stringify(responseResult, null, 2)}
                  language="json"
                  title="Server Response"
                />
              </div>
            )}

            {errorResult && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      HTTP {errorResult.status || 400} — {errorResult.code || 'REQUEST_FAILED'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-rose-300 font-medium">{errorResult.error || errorResult.message}</p>
                {errorResult.suggestedAction && (
                  <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/40 text-xs text-rose-200">
                    <strong>Saran Perbaikan:</strong> {errorResult.suggestedAction}
                  </div>
                )}
                <CodeBlock
                  code={JSON.stringify(errorResult, null, 2)}
                  language="json"
                  title="Error Payload"
                />
              </div>
            )}
          </div>

          {/* Right Preview (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* WhatsApp Chat Simulation */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">Pratinjau Pesan WhatsApp</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Penerima: {phone || '-'}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="max-w-[92%] ml-auto bg-[#075e54]/25 border border-[#128c7e]/40 text-slate-100 rounded-lg p-3.5 shadow-sm text-xs leading-relaxed font-sans whitespace-pre-wrap selection:bg-emerald-500/40">
                  {previewText}
                  <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-emerald-400 font-mono">
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Anti-Ban & Features Card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Proteksi Sistem Terpasang</span>
              </h3>
              <div className="space-y-2 text-[11px] text-slate-400">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Simulasi Mengetik:</strong> Meniru interaksi manusia dengan status <em>composing</em> selama 1.1 - 2.0 detik acak.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Rate Limit Cooldown:</strong> Mencegah blast spam dengan jeda 60 detik per nomor tujuan.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Sesi Verifikasi Otomatis:</strong> Sesi aktif disimpan di memori dan dapat diverifikasi via tab Verifikasi OTP.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VERIFY OTP SECTION */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-5">
            <form onSubmit={handleVerify} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Verifikasi Kode OTP Aktif</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Validasi kode OTP tanpa memerlukan logika database di aplikasi Anda. Kode hanya dapat digunakan satu kali (*single-use burn*).
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nomor WhatsApp Penerima
                </label>
                <input
                  type="text"
                  value={verifyPhone}
                  onChange={(e) => setVerifyPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  required
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kode OTP yang Dimasukkan
                </label>
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="Contoh: 739104"
                  required
                  className="w-full px-3 py-2 text-xs font-mono font-bold tracking-widest text-sky-400 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying || !verifyPhone || !verifyCode}
                className="w-full py-2.5 px-4 text-xs font-bold rounded-lg text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Memvalidasi Kode OTP...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Verifikasi Kode OTP (POST /api/v1/otp/verify)</span>
                  </>
                )}
              </button>
            </form>

            {/* Verify Success Result */}
            {verifyResponse && (
              <div className={`p-4 rounded-xl border ${
                verifyResponse.verified
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                  : 'border-amber-500/40 bg-amber-950/20 text-amber-300'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  {verifyResponse.verified ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>KODE OTP VALID &amp; TERVERIFIKASI</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <span>KODE OTP TIDAK SESUAI</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-300">{verifyResponse.message}</p>
                {verifyResponse.attemptsRemaining !== undefined && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    Sisa kesempatan: <strong>{verifyResponse.attemptsRemaining} kali</strong>
                  </p>
                )}
              </div>
            )}

            {/* Verify Error Result */}
            {verifyError && (
              <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/20 text-rose-300 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                  <span>{verifyError.code || 'VERIFIKASI GAGAL'}</span>
                </div>
                <p className="text-xs">{verifyError.error || verifyError.message}</p>
                {verifyError.suggestedAction && (
                  <p className="text-[11px] text-rose-400 pt-1">
                    💡 {verifyError.suggestedAction}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-xs font-semibold text-white mb-2">Perintah cURL Verifikasi</h3>
              <p className="text-[11px] text-slate-400 mb-3">
                Kirim request ini dari backend Anda saat pengguna memasukkan kode OTP di form login:
              </p>
              <CodeBlock
                language="bash"
                title="cURL Verify"
                code={`curl -X POST "${window.location.origin}/api/v1/otp/verify" \\
  -H "Authorization: Bearer ${jwtToken || '<DEVELOPER_JWT_TOKEN>'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "${verifyPhone}",
    "otp": "${verifyCode}"
  }'`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
