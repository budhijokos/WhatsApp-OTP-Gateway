import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Key,
  RotateCw,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Activity,
  Terminal,
  AlertTriangle,
  Search,
  CheckCircle2,
  Lock,
  RefreshCw,
  Code,
  X,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { ApiKeyItem, ApiKeyStats, KeyEnvironment } from '../../types';

export function ApiKeysView() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [stats, setStats] = useState<ApiKeyStats>({
    total: 0,
    active: 0,
    rotating: 0,
    revoked: 0,
    totalUsage: 0,
  });
  const [secretPreview, setSecretPreview] = useState<string>('****');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'rotating' | 'revoked'>('all');
  const [envFilter, setEnvFilter] = useState<'all' | KeyEnvironment>('all');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [rotatingKey, setRotatingKey] = useState<ApiKeyItem | null>(null);
  const [revokingKey, setRevokingKey] = useState<ApiKeyItem | null>(null);
  const [codeSampleKey, setCodeSampleKey] = useState<ApiKeyItem | null>(null);
  const [revealedTokens, setRevealedTokens] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // New Key Form State
  const [newName, setNewName] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newEnv, setNewEnv] = useState<KeyEnvironment>('production');
  const [newPermissions, setNewPermissions] = useState<string[]>(['otp:send', 'otp:read', 'status:read']);
  const [newExpiresIn, setNewExpiresIn] = useState('365d');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState<{ key: ApiKeyItem; sampleCurl: string } | null>(null);

  // Rotation Form State
  const [gracePeriodHours, setGracePeriodHours] = useState(24);
  const [rotationExpiresIn, setRotationExpiresIn] = useState('365d');
  const [rotatedResult, setRotatedResult] = useState<{
    key: ApiKeyItem;
    newToken: string;
    previousTokenValidUntil?: string;
    sampleCurl: string;
  } | null>(null);

  // Revoke Reason
  const [revokeReason, setRevokeReason] = useState('Rotasi berkala / Kunci lama dinonaktifkan');

  // Active Code Tab in Snippet Modal
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'node' | 'python' | 'php'>('curl');

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getKeys();
      setKeys(res.keys);
      setStats(res.stats);
      setSecretPreview(res.secretPreview);
    } catch (err: any) {
      console.error('Error fetching API keys:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const toggleRevealToken = (id: string) => {
    setRevealedTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  // Filtered keys
  const filteredKeys = useMemo(() => {
    return keys.filter((k) => {
      const matchSearch =
        k.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.clientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || k.status === statusFilter;
      const matchEnv = envFilter === 'all' || k.environment === envFilter;
      return matchSearch && matchStatus && matchEnv;
    });
  }, [keys, searchQuery, statusFilter, envFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await api.createApiKey({
        clientName: newName.trim(),
        clientId: newClientId.trim() || undefined,
        environment: newEnv,
        permissions: newPermissions,
        expiresIn: newExpiresIn,
      });
      setCreatedResult({ key: res.data, sampleCurl: res.sampleCurl });
      await fetchKeys();
    } catch (err: any) {
      alert(`Gagal membuat kunci API: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRotateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rotatingKey) return;
    setIsSubmitting(true);
    try {
      const res = await api.rotateApiKey(rotatingKey.id, {
        gracePeriodHours,
        newExpiresIn: rotationExpiresIn,
      });
      setRotatedResult({
        key: res.data,
        newToken: res.newToken,
        previousTokenValidUntil: res.previousTokenValidUntil,
        sampleCurl: res.sampleCurl,
      });
      await fetchKeys();
    } catch (err: any) {
      alert(`Gagal merotasi kunci API: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokingKey) return;
    setIsSubmitting(true);
    try {
      await api.revokeApiKey(revokingKey.id, revokeReason);
      setRevokingKey(null);
      await fetchKeys();
    } catch (err: any) {
      alert(`Gagal mencabut kunci API: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (key: ApiKeyItem) => {
    if (!confirm(`Hapus permanen kunci '${key.clientName}' (${key.id}) dari sistem?`)) {
      return;
    }
    try {
      await api.deleteApiKey(key.id);
      await fetchKeys();
    } catch (err: any) {
      alert(`Gagal menghapus kunci API: ${err.message}`);
    }
  };

  const getEnvBadge = (env: KeyEnvironment) => {
    switch (env) {
      case 'production':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            Production
          </span>
        );
      case 'staging':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-sky-950/80 text-sky-400 border border-sky-500/30">
            Staging
          </span>
        );
      case 'development':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-purple-950/80 text-purple-400 border border-purple-500/30">
            Dev
          </span>
        );
    }
  };

  const getStatusBadge = (key: ApiKeyItem) => {
    switch (key.status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Aktif</span>
          </span>
        );
      case 'rotating':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-500/30">
            <RotateCw className="h-3 w-3 animate-spin text-amber-400" />
            <span>Rotasi (Grace Period)</span>
          </span>
        );
      case 'revoked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-950/60 text-rose-300 border border-rose-500/30">
            <ShieldAlert className="h-3 w-3 text-rose-400" />
            <span>Dicabut (Revoked)</span>
          </span>
        );
    }
  };

  const formatRelativeTime = (isoString?: string | null) => {
    if (!isoString) return 'Belum pernah';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Baru saja';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mnt lalu`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
    return `${Math.floor(diffSec / 86400)} hari lalu`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Key className="h-4 w-4" />
              <span>Multi-Client Authentication &amp; Zero-Downtime Key Lifecycle</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Manajemen Kunci API &amp; Rotasi JWT Pengembang
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Kelola kunci autentikasi digital untuk berbagai aplikasi klien (mobile app, web e-commerce, CRM, microservice). Dukung rotasi kunci tanpa henti (*zero-downtime grace period*) dan pencabutan darurat (*instant revocation*).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setCreatedResult(null);
                setNewName('');
                setNewClientId('');
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Daftarkan Klien / Buat Kunci</span>
            </button>
            <button
              onClick={fetchKeys}
              disabled={loading}
              className="p-2 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white transition-colors"
              title="Refresh Kunci"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Security Info Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>Algoritma: <strong className="text-slate-200 font-mono">HMAC-SHA256 (HS256)</strong></span>
            <span className="text-slate-600">·</span>
            <span>Server Secret Preview: <strong className="text-slate-200 font-mono">{secretPreview}</strong></span>
          </div>
          <div className="text-[11px] text-slate-400">
            💡 Kunci tersimpan persisten di server aman (<code className="text-slate-300 font-mono">.api_keys.json</code>).
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Klien</span>
            <Key className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-1">Aplikasi terdaftar</div>
        </div>

        <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/10 p-4">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
            <span>Kunci Aktif</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{stats.active}</div>
          <div className="text-[10px] text-emerald-500/80 mt-1">Siap menerima OTP</div>
        </div>

        <div className="rounded-xl border border-amber-900/30 bg-amber-950/10 p-4">
          <div className="flex items-center justify-between text-amber-400 text-xs mb-1">
            <span>Sedang Rotasi</span>
            <RotateCw className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 tracking-tight">{stats.rotating}</div>
          <div className="text-[10px] text-amber-400/80 mt-1">Grace period transisi</div>
        </div>

        <div className="rounded-xl border border-rose-900/30 bg-rose-950/10 p-4">
          <div className="flex items-center justify-between text-rose-400 text-xs mb-1">
            <span>Dicabut (Revoked)</span>
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight">{stats.revoked}</div>
          <div className="text-[10px] text-rose-400/80 mt-1">Akses dinonaktifkan</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Panggilan API</span>
            <Activity className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{stats.totalUsage.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">Otentikasi berhasil</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama aplikasi, client ID, atau key ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Status Filter */}
          <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs shrink-0">
            {(['all', 'active', 'rotating', 'revoked'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'all' ? 'Semua Status' : st === 'active' ? 'Aktif' : st === 'rotating' ? 'Rotasi' : 'Revoked'}
              </button>
            ))}
          </div>

          {/* Environment Filter */}
          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 shrink-0"
          >
            <option value="all">Semua Lingkungan</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </div>
      </div>

      {/* Keys List / Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
            <span className="text-xs">Memuat daftar kunci API...</span>
          </div>
        ) : filteredKeys.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Key className="h-8 w-8 mx-auto text-slate-600 mb-1" />
            <div className="text-sm font-semibold text-slate-300">Tidak ada kunci yang cocok</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || envFilter !== 'all'
                ? 'Coba ubah kata kunci pencarian atau filter status Anda.'
                : 'Belum ada kunci API yang dibuat. Klik tombol "Daftarkan Klien / Buat Kunci" di atas.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredKeys.map((key) => {
              const isRevealed = !!revealedTokens[key.id];
              const isCopied = copiedKeyId === key.id;

              return (
                <div
                  key={key.id}
                  className={`p-5 transition-colors ${
                    key.status === 'revoked'
                      ? 'bg-rose-950/5 opacity-80'
                      : key.status === 'rotating'
                      ? 'bg-amber-950/10'
                      : 'hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Client Info Block */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-white tracking-tight">{key.clientName}</h3>
                        {getEnvBadge(key.environment)}
                        {getStatusBadge(key)}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                        <span className="text-slate-300">
                          Client ID: <strong className="text-emerald-400">{key.clientId}</strong>
                        </span>
                        <span>·</span>
                        <span>Key ID: <strong className="text-slate-300">{key.id}</strong></span>
                        <span>·</span>
                        <span>Berlaku: <strong className="text-slate-300">{key.expiresIn}</strong></span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setCodeSampleKey(key)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Lihat cURL dan Contoh Kode"
                      >
                        <Code className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Snippet API</span>
                      </button>

                      {key.status !== 'revoked' && (
                        <button
                          onClick={() => {
                            setRotatedResult(null);
                            setRotatingKey(key);
                            setGracePeriodHours(24);
                            setRotationExpiresIn(key.expiresIn);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Rotasi Kunci dengan Zero Downtime"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                          <span>Rotasi Kunci</span>
                        </button>
                      )}

                      {key.status !== 'revoked' ? (
                        <button
                          onClick={() => setRevokingKey(key)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Cabut Kunci Segera"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>Cabut</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteConfirm(key)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/50 text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Hapus dari Registry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Grace Period Alert Banner if in Rotation */}
                  {key.status === 'rotating' && key.rotationInfo && (
                    <div className="mt-3 p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-amber-200">
                        <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                        <div>
                          <strong>Sedang Dalam Masa Tenggang (Grace Period):</strong> Kunci lama masih diterima hingga{' '}
                          <span className="font-mono font-semibold text-amber-300">
                            {new Date(key.rotationInfo.previousTokenExpiresAt || '').toLocaleString('id-ID')}
                          </span>{' '}
                          ({key.rotationInfo.gracePeriodHours} jam).
                        </div>
                      </div>
                      <span className="text-[11px] text-amber-400/90 font-mono">Zero-Downtime Migration</span>
                    </div>
                  )}

                  {/* Revocation notice if revoked */}
                  {key.status === 'revoked' && (
                    <div className="mt-3 p-2.5 rounded-lg border border-rose-500/30 bg-rose-950/20 flex items-center gap-2 text-xs text-rose-300">
                      <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                      <span>
                        Kunci ini telah dicabut pada {new Date(key.revokedAt || '').toLocaleString('id-ID')}.{' '}
                        {key.revocationReason ? `Alasan: ${key.revocationReason}` : ''}
                      </span>
                    </div>
                  )}

                  {/* Token Box with Show/Hide & Copy */}
                  <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="text-[11px] text-slate-400 shrink-0 font-medium">JWT Token:</span>
                      <div className="flex-1 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300 break-all select-all flex items-center justify-between gap-2">
                        <span>{isRevealed ? key.token : key.tokenPreview}</span>
                        <button
                          onClick={() => toggleRevealToken(key.id)}
                          className="text-slate-400 hover:text-slate-200 shrink-0 p-0.5 cursor-pointer"
                          title={isRevealed ? 'Sembunyikan Token' : 'Lihat Token Lengkap'}
                        >
                          {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => copyToClipboard(key.token, key.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors shrink-0 cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{isCopied ? 'Tersalin' : 'Salin Token'}</span>
                    </button>
                  </div>

                  {/* Metadata Footer */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Hak Akses:</span>
                      <div className="flex items-center gap-1">
                        {key.permissions.map((p) => (
                          <span
                            key={p}
                            className="px-1.5 py-0.5 rounded bg-slate-950 font-mono text-[10px] text-slate-300 border border-slate-800"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <span>·</span>
                    <span>Terakhir Digunakan: <strong className="text-slate-300 font-medium">{formatRelativeTime(key.lastUsedAt)}</strong></span>
                    <span>·</span>
                    <span>Total Penggunaan: <strong className="text-emerald-400 font-mono">{key.usageCount}x</strong></span>
                    <span>·</span>
                    <span>Dibuat: <span className="text-slate-400">{new Date(key.createdAt).toLocaleDateString('id-ID')}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW CLIENT KEY */}
      {/* ========================================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <Key className="h-4 w-4" />
                </div>
                <span>Daftarkan Aplikasi Klien Baru</span>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!createdResult ? (
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Nama Aplikasi Klien <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      if (!newClientId) {
                        setNewClientId(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, '_')
                            .replace(/_+/g, '_')
                        );
                      }
                    }}
                    placeholder="Contoh: Mobile Banking iOS & Android"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Nama deskriptif untuk mengidentifikasi aplikasi pengirim di log dan dasbor.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Client ID (sub)
                    </label>
                    <input
                      type="text"
                      value={newClientId}
                      onChange={(e) => setNewClientId(e.target.value)}
                      placeholder="app_mobile_finpay"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Lingkungan (Environment)
                    </label>
                    <select
                      value={newEnv}
                      onChange={(e) => setNewEnv(e.target.value as KeyEnvironment)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="development">Development</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Masa Berlaku Kunci (Expiration)
                  </label>
                  <select
                    value={newExpiresIn}
                    onChange={(e) => setNewExpiresIn(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="30d">30 Hari</option>
                    <option value="90d">90 Hari</option>
                    <option value="180d">180 Hari (6 Bulan)</option>
                    <option value="365d">365 Hari (1 Tahun - Rekomendasi)</option>
                    <option value="730d">2 Tahun</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Hak Akses (Permissions / Scopes)
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['otp:send', 'otp:read', 'status:read'].map((perm) => {
                      const isChecked = newPermissions.includes(perm);
                      return (
                        <button
                          type="button"
                          key={perm}
                          onClick={() => {
                            if (isChecked) {
                              setNewPermissions(newPermissions.filter((p) => p !== perm));
                            } else {
                              setNewPermissions([...newPermissions, perm]);
                            }
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-950 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {perm} {isChecked ? '✓' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || newPermissions.length === 0}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    <span>{isSubmitting ? 'Membuat...' : 'Buat Kunci API'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Success Creation Screen */
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Kunci API Berhasil Dibuat!</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Kunci untuk <strong className="text-white">{createdResult.key.clientName}</strong> siap digunakan. Salin token di bawah ini ke konfigurasi backend Anda:
                  </p>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 break-all select-all">
                    {createdResult.key.token}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => copyToClipboard(createdResult.key.token, 'new_created')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                    >
                      {copiedKeyId === 'new_created' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedKeyId === 'new_created' ? 'Tersalin ke Clipboard' : 'Salin Token'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setIsCreateOpen(false);
                      setCreatedResult(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Selesai &amp; Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ROTATE KEY (ZERO-DOWNTIME GRACE PERIOD) */}
      {/* ========================================================================= */}
      {rotatingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                  <RotateCw className="h-4 w-4" />
                </div>
                <span>Rotasi Kunci API (Zero-Downtime)</span>
              </div>
              <button
                onClick={() => setRotatingKey(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!rotatedResult ? (
              <form onSubmit={handleRotateSubmit} className="space-y-4">
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-2 text-xs text-amber-200">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Bagaimana Cara Kerja Zero-Downtime Key Rotation?</span>
                  </div>
                  <p className="text-amber-200/90 leading-relaxed text-[11px]">
                    Kunci baru akan langsung dibuat dan aktif. Kunci lama akan <strong>tetap diizinkan</strong> selama masa tenggang (*grace period*) yang Anda tentukan, sehingga tim pengembang memiliki waktu memperbarui environment variable tanpa menyebabkan downtime transaksi OTP.
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                  <span className="text-slate-400">Target Aplikasi:</span>
                  <div className="font-bold text-white text-sm">{rotatingKey.clientName}</div>
                  <div className="text-[11px] font-mono text-emerald-400">{rotatingKey.clientId}</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Masa Tenggang Toleransi Kunci Lama (Grace Period)
                  </label>
                  <select
                    value={gracePeriodHours}
                    onChange={(e) => setGracePeriodHours(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={24}>24 Jam (Rekomendasi Standar)</option>
                    <option value={48}>48 Jam (2 Hari)</option>
                    <option value={72}>72 Jam (3 Hari)</option>
                    <option value={168}>7 Hari (1 Minggu - Multi-Server CI/CD)</option>
                    <option value={0}>Segera (0 Jam - Immediate Revocation Kunci Lama)</option>
                  </select>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {gracePeriodHours > 0
                      ? `Kunci lama akan otomatis ditolak setelah ${gracePeriodHours} jam.`
                      : 'Kunci lama akan langsung ditolak saat ini juga (gunakan jika ada kebocoran kunci).'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Masa Berlaku Kunci Baru
                  </label>
                  <select
                    value={rotationExpiresIn}
                    onChange={(e) => setRotationExpiresIn(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="30d">30 Hari</option>
                    <option value="90d">90 Hari</option>
                    <option value="365d">365 Hari (1 Tahun)</option>
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRotatingKey(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCw className="h-3.5 w-3.5" />
                    )}
                    <span>{isSubmitting ? 'Memproses Rotasi...' : 'Mulai Rotasi Kunci'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Success Rotation Screen */
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Rotasi Berhasil Dilakukan!</span>
                  </div>

                  {rotatedResult.previousTokenValidUntil && (
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs text-amber-200">
                      ⏱️ Kunci lama tetap berlaku hingga:{' '}
                      <strong className="text-white font-mono">
                        {new Date(rotatedResult.previousTokenValidUntil).toLocaleString('id-ID')}
                      </strong>
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-semibold text-slate-200 block mb-1">
                      Kunci Baru (Segera perbarui di aplikasi klien):
                    </span>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 break-all select-all">
                      {rotatedResult.newToken}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => copyToClipboard(rotatedResult.newToken, 'rotated_key')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer"
                    >
                      {copiedKeyId === 'rotated_key' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedKeyId === 'rotated_key' ? 'Tersalin!' : 'Salin Kunci Baru'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setRotatingKey(null);
                      setRotatedResult(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REVOKE KEY CONFIRMATION */}
      {/* ========================================================================= */}
      {revokingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-rose-800/60 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <ShieldAlert className="h-5 w-5" />
              <span>Cabut Kunci API (Revoke)</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin mencabut akses kunci untuk{' '}
              <strong className="text-white">{revokingKey.clientName}</strong>? Semua request dari aplikasi ini akan{' '}
              <span className="text-rose-400 font-semibold">segera ditolak dengan kode 401 AUTH_KEY_REVOKED</span>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Alasan Pencabutan (Audit Log):
              </label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Contoh: Kunci diduga bocor di repositori publik"
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRevokingKey(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRevokeConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Mencabut...' : 'Ya, Cabut Kunci Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: INTEGRATION CODE SNIPPET MODAL */}
      {/* ========================================================================= */}
      {codeSampleKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span>Integrasi Klien: {codeSampleKey.clientName}</span>
              </div>
              <button
                onClick={() => setCodeSampleKey(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Gunakan cuplikan kode di bawah ini pada backend aplikasi Anda. Header otentikasi telah diisi otomatis dengan kunci JWT milik <strong className="text-emerald-400">{codeSampleKey.clientName}</strong>:
            </p>

            {/* Language Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-800 pb-2">
              {[
                { id: 'curl', label: 'cURL' },
                { id: 'node', label: 'Node.js (Fetch)' },
                { id: 'python', label: 'Python (Requests)' },
                { id: 'php', label: 'PHP / Laravel' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setCodeLanguage(lang.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    codeLanguage === lang.id
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Code Output */}
            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-72 leading-relaxed">
                {codeLanguage === 'curl' &&
`curl -X POST "https://otp.bacakata.com/api/v1/otp/send" \\
  -H "Authorization: Bearer ${codeSampleKey.token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "081234567890",
    "appName": "${codeSampleKey.clientName}"
  }'`}

                {codeLanguage === 'node' &&
`// Node.js (Fetch API ES Modules / Next.js)
const response = await fetch('https://otp.bacakata.com/api/v1/otp/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${codeSampleKey.token}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: '081234567890',
    appName: '${codeSampleKey.clientName}',
    expiryMinutes: 5,
  }),
});

const data = await response.json();
console.log('OTP Result:', data);`}

                {codeLanguage === 'python' &&
`# Python (Requests)
import requests

url = "https://otp.bacakata.com/api/v1/otp/send"
headers = {
    "Authorization": "Bearer ${codeSampleKey.token}",
    "Content-Type": "application/json"
}
payload = {
    "to": "081234567890",
    "appName": "${codeSampleKey.clientName}",
    "expiryMinutes": 5
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}

                {codeLanguage === 'php' &&
`// PHP / Laravel Http Client
use Illuminate\\Support\\Facades\\Http;

$response = Http::withToken('${codeSampleKey.token}')
    ->post('https://otp.bacakata.com/api/v1/otp/send', [
        'to' => '081234567890',
        'appName' => '${codeSampleKey.clientName}',
        'expiryMinutes' => 5,
    ]);

return $response->json();`}
              </pre>

              <button
                onClick={() => {
                  let text = '';
                  if (codeLanguage === 'curl') {
                    text = `curl -X POST "https://otp.bacakata.com/api/v1/otp/send" \\\n  -H "Authorization: Bearer ${codeSampleKey.token}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"to": "081234567890", "appName": "${codeSampleKey.clientName}"}'`;
                  } else if (codeLanguage === 'node') {
                    text = `const response = await fetch('https://otp.bacakata.com/api/v1/otp/send', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer ${codeSampleKey.token}',\n    'Content-Type': 'application/json',\n  },\n  body: JSON.stringify({ to: '081234567890', appName: '${codeSampleKey.clientName}' }),\n});\nconst data = await response.json();`;
                  } else if (codeLanguage === 'python') {
                    text = `import requests\nresponse = requests.post('https://otp.bacakata.com/api/v1/otp/send', json={'to': '081234567890', 'appName': '${codeSampleKey.clientName}'}, headers={'Authorization': 'Bearer ${codeSampleKey.token}'})\nprint(response.json())`;
                  } else {
                    text = `$response = Http::withToken('${codeSampleKey.token}')->post('https://otp.bacakata.com/api/v1/otp/send', ['to' => '081234567890', 'appName' => '${codeSampleKey.clientName}']);`;
                  }
                  copyToClipboard(text, 'snippet_modal');
                }}
                className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1 border border-slate-700 cursor-pointer"
              >
                {copiedKeyId === 'snippet_modal' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedKeyId === 'snippet_modal' ? 'Tersalin' : 'Salin Kode'}</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setCodeSampleKey(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
