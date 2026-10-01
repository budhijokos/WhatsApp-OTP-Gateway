import { useState } from 'react';
import { Key, ShieldCheck, Check, Copy, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { DeveloperTokenResult } from '../../types';
import { CodeBlock } from '../../components/CodeBlock';

export function TokenManager() {
  const [sub, setSub] = useState('app_ecommerce_auth');
  const [name, setName] = useState('E-Commerce Core Auth Service');
  const [permissions, setPermissions] = useState<string[]>(['otp:send', 'otp:read', 'status:read']);
  const [expiresIn, setExpiresIn] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<DeveloperTokenResult | null>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setVerifyResult(null);
    try {
      const res = await api.generateToken({
        sub,
        name,
        permissions,
        expiresIn,
      });
      setTokenResult(res);
    } catch (err: any) {
      alert(`Gagal membuat token: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!tokenResult?.token) return;
    setIsVerifying(true);
    try {
      const res = await api.verifyToken(tokenResult.token);
      setVerifyResult(res);
    } finally {
      setIsVerifying(false);
    }
  };

  const togglePermission = (perm: string) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter((p) => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const copyToken = () => {
    if (!tokenResult?.token) return;
    navigator.clipboard.writeText(tokenResult.token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Key className="h-4 w-4 text-emerald-400" />
            <span>Manajemen Autentikasi &amp; Token JWT Pengembang</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Setiap aplikasi eksternal (backend/microservice) wajib menggunakan token JWT bertanda tangan digital untuk memanggil endpoint pengiriman OTP. Token ini memuat ID pengembang, hak akses eksplisit, dan tanggal kedaluwarsa.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Client / Developer Identifier (sub)
            </label>
            <input
              type="text"
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              placeholder="e.g. app_ecommerce_backend"
              required
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nama Aplikasi / Developer (name)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. E-Commerce Core Auth Service"
              required
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Masa Berlaku Token
            </label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="7d">7 Hari</option>
              <option value="30d">30 Hari (Rekomendasi Default)</option>
              <option value="90d">90 Hari</option>
              <option value="365d">1 Tahun (365 Hari)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Izin / Hak Akses (Permissions)
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {['otp:send', 'otp:read', 'status:read'].map((perm) => (
                <button
                  type="button"
                  key={perm}
                  onClick={() => togglePermission(perm)}
                  className={`px-2.5 py-1 text-xs rounded font-mono transition-colors ${
                    permissions.includes(perm)
                      ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border border-slate-800 text-slate-500'
                  }`}
                >
                  {perm} {permissions.includes(perm) ? '✓' : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={loading || permissions.length === 0}
              className="py-2.5 px-4 text-xs font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-2"
            >
              <Key className="h-3.5 w-3.5" />
              <span>{loading ? 'Membuat Token...' : 'Generate Kunci Token JWT Baru'}</span>
            </button>
          </div>
        </form>

        {/* Generated Token Result */}
        {tokenResult && (
          <div className="mt-6 pt-5 border-t border-slate-800 space-y-4">
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Token JWT Pengembang Berhasil Dibuat!</span>
                </span>
                <button
                  onClick={copyToken}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-emerald-900/40 text-emerald-200 hover:bg-emerald-800/40 transition-colors font-mono"
                >
                  {copiedToken ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedToken ? 'Tersalin' : 'Salin Token'}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 break-all select-all">
                {tokenResult.token}
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
                <span>
                  Jenis: <strong className="text-slate-200">Bearer Token</strong>
                </span>
                <span>
                  Berlaku: <strong className="text-slate-200">{tokenResult.expiresIn}</strong>
                </span>
                <span>
                  Developer: <strong className="text-slate-200">{tokenResult.payload.name}</strong>
                </span>
              </div>
            </div>

            {/* Test verify */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Uji Validitas Token di Server (POST /api/v1/auth/verify)</span>
              </button>
            </div>

            {verifyResult && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <span className="text-emerald-400 font-bold block mb-1">
                  ✓ Token Terverifikasi Valid oleh Server:
                </span>
                <pre className="text-slate-300 font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(verifyResult.developer, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
