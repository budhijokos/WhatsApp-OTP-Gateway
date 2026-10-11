import { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Database,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Server,
  Zap,
  Activity,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Cpu,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  DeliveryLog,
  DetailedErrorLog,
  SystemMetrics,
  WhatsAppState,
} from '../../types';
import { api } from '../../services/api';

interface SystemHealthAlertBannerProps {
  metrics: SystemMetrics;
  recentLogs: DeliveryLog[];
  recentErrors: DetailedErrorLog[];
  waState: WhatsAppState;
  onNavigate: (tab: string) => void;
  onOpenPairing: () => void;
  onRefreshMetrics?: () => void;
}

export function SystemHealthAlertBanner({
  metrics,
  recentLogs,
  recentErrors,
  waState,
  onNavigate,
  onOpenPairing,
  onRefreshMetrics,
}: SystemHealthAlertBannerProps) {
  const [isPurging, setIsPurging] = useState(false);
  const [purgeNotice, setPurgeNotice] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Simulation mode for developer testing/demo
  const [simMode, setSimMode] = useState<'none' | 'memory' | 'failures' | 'both'>('none');

  // 1. Analyze In-Memory Buffer Saturation
  const memory = metrics.memory;
  const realBufferPercent = memory?.bufferUsagePercent ?? 0;
  const realHeapUsedMb = memory?.heapUsedMb ?? 0;
  const realBufferCount = memory?.currentBufferCount ?? 0;
  const maxCapacity = memory?.maxBufferCapacity ?? 700;

  // Evaluate simulation override
  const effectiveBufferPercent =
    simMode === 'memory' || simMode === 'both' ? 88 : realBufferPercent;
  const effectiveHeapUsedMb =
    simMode === 'memory' || simMode === 'both' ? 215 : realHeapUsedMb;
  const effectiveBufferCount =
    simMode === 'memory' || simMode === 'both' ? Math.round(maxCapacity * 0.88) : realBufferCount;

  const isMemorySaturated =
    effectiveBufferPercent >= 80 ||
    effectiveHeapUsedMb >= 190 ||
    (memory?.status && memory.status !== 'optimal') ||
    simMode === 'memory' ||
    simMode === 'both';

  const isMemoryCritical =
    effectiveBufferPercent >= 88 ||
    effectiveHeapUsedMb >= 210 ||
    memory?.status === 'critical';

  // 2. Analyze High Frequency of Failed OTP Requests
  const totalRequests = metrics.total;
  const failedRequests = metrics.failed;
  const realFailureRate =
    totalRequests > 0 ? Math.round((failedRequests / totalRequests) * 100) : 0;

  // Window sample of the last 10 requests
  const sampleWindow = recentLogs.slice(0, 10);
  const recentFailures = sampleWindow.filter((l) => l.status === 'failed').length;
  const recentFailRate =
    sampleWindow.length >= 3 ? Math.round((recentFailures / sampleWindow.length) * 100) : 0;

  const effectiveFailureRate =
    simMode === 'failures' || simMode === 'both' ? 52 : realFailureRate;
  const effectiveFailedCount =
    simMode === 'failures' || simMode === 'both' ? Math.max(failedRequests, 6) : failedRequests;
  const effectiveTotalCount =
    simMode === 'failures' || simMode === 'both' ? Math.max(totalRequests, 12) : totalRequests;

  const hasHighFailureFrequency =
    simMode === 'failures' ||
    simMode === 'both' ||
    effectiveFailedCount >= 3 ||
    (effectiveTotalCount >= 4 && effectiveFailureRate >= 25) ||
    (sampleWindow.length >= 3 && recentFailRate >= 30);

  const isFailureCritical =
    effectiveFailureRate >= 40 ||
    recentFailRate >= 45 ||
    (waState.status !== 'connected' && effectiveFailedCount >= 2) ||
    simMode === 'failures' ||
    simMode === 'both';

  // If neither condition is met, render nothing
  if (!isMemorySaturated && !hasHighFailureFrequency) {
    return (
      <div className="flex items-center justify-end">
        <button
          onClick={() => setSimMode('both')}
          className="text-[11px] text-slate-500 hover:text-slate-300 underline transition-colors cursor-pointer flex items-center gap-1 opacity-70 hover:opacity-100"
          title="Uji simulasi banner peringatan untuk pengembang"
        >
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>Simulasikan Peringatan Sistem (Dev Test)</span>
        </button>
      </div>
    );
  }

  // Trigger auto-purge mitigation directly from banner
  const handleExecutePurge = async () => {
    setIsPurging(true);
    setPurgeNotice(null);
    try {
      const [resLog, resQueue] = await Promise.all([
        api.triggerAutoPurge(),
        api.purgeUnusedQueue().catch(() => ({ success: false, purgedCount: 0 })),
      ]);
      const prunedLogs = resLog.success && resLog.result ? resLog.result.totalPruned || 0 : 0;
      const prunedQueue = resQueue.success ? resQueue.purgedCount || 0 : 0;
      
      const parts = [];
      if (prunedLogs > 0) parts.push(`${prunedLogs} entri buffer log`);
      if (prunedQueue > 0) parts.push(`${prunedQueue} antrian tak digunakan dibatalkan`);
      
      if (parts.length > 0) {
        setPurgeNotice(`Berhasil membebaskan memori: ${parts.join(', ')}.`);
      } else {
        setPurgeNotice('Pembersihan memori dan antrian selesai dieksekusi.');
      }

      if (simMode !== 'none') {
        setSimMode('none');
      }
      onRefreshMetrics?.();
      setTimeout(() => setPurgeNotice(null), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengeksekusi purge buffer';
      setPurgeNotice(`Gagal: ${msg}`);
      setTimeout(() => setPurgeNotice(null), 6000);
    } finally {
      setIsPurging(false);
    }
  };

  const isOverallCritical = isMemoryCritical || isFailureCritical;

  // Minimized single-line bar
  if (isMinimized) {
    return (
      <div
        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs shadow-md transition-all ${
          isOverallCritical
            ? 'bg-rose-950/80 border-rose-800 text-rose-200'
            : 'bg-amber-950/80 border-amber-800 text-amber-200'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOverallCritical ? 'bg-rose-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isOverallCritical ? 'bg-rose-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="font-bold truncate">
            {isOverallCritical ? 'PERINGATAN KRITIS SISTEM' : 'PERINGATAN SISTEM'}:
          </span>
          <span className="truncate text-slate-300">
            {isMemorySaturated && hasHighFailureFrequency
              ? `Buffer Memori ${effectiveBufferPercent}% & Kegagalan OTP ${effectiveFailureRate}%`
              : isMemorySaturated
              ? `Saturasi Buffer In-Memory (${effectiveBufferPercent}% kapasitas terpakai)`
              : `Frekuensi Kegagalan OTP Tinggi (${effectiveFailedCount} gagal / ${effectiveFailureRate}%)`}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isMemorySaturated && (
            <button
              onClick={handleExecutePurge}
              disabled={isPurging}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              <span>{isPurging ? 'Purging...' : 'Purge Buffer'}</span>
            </button>
          )}
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 rounded hover:bg-slate-800/60 text-slate-300 transition-colors cursor-pointer"
            title="Buka detail peringatan"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 sm:p-5 shadow-lg transition-all animate-in fade-in duration-200 ${
        isOverallCritical
          ? 'border-rose-700/80 bg-linear-to-b from-rose-950/70 via-slate-900/95 to-slate-950 text-slate-200'
          : 'border-amber-700/80 bg-linear-to-b from-amber-950/60 via-slate-900/95 to-slate-950 text-slate-200'
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              isOverallCritical
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-mono ${
                  isOverallCritical
                    ? 'bg-rose-950 border border-rose-800 text-rose-300'
                    : 'bg-amber-950 border border-amber-800 text-amber-300'
                }`}
              >
                {isOverallCritical ? 'STATUS KRITIS' : 'PERHATIAN SISTEM'}
              </span>

              {simMode !== 'none' && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-950 border border-purple-800 text-purple-300 font-mono">
                  [Simulasi Aktif: {simMode}]
                </span>
              )}
            </div>

            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
              {isMemorySaturated && hasHighFailureFrequency
                ? 'Saturasi Buffer Memori & Tingkat Kegagalan OTP Tinggi Terdeteksi'
                : isMemorySaturated
                ? 'Saturasi Buffer Memori In-Memory Mendekati Kapasitas Penuh'
                : 'Anomali Lonjakan Frekuensi Kegagalan Permintaan OTP'}
            </h2>
          </div>
        </div>

        {/* Right Controls: Minimize & Simulation Switch */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {/* Test simulation switcher dropdown for developers */}
          <div className="relative inline-flex items-center">
            <select
              value={simMode}
              onChange={(e) => setSimMode(e.target.value as any)}
              className="text-[11px] bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-300 outline-none hover:border-slate-500 cursor-pointer"
              title="Ganti mode pengujian simulasi"
            >
              <option value="none">Data Live Sistem</option>
              <option value="memory">Uji: Buffer Memori 88%</option>
              <option value="failures">Uji: Gagal OTP 52%</option>
              <option value="both">Uji: Keduanya (Dual Alert)</option>
            </select>
          </div>

          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Kecilkan banner"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Diagnostic Telemetry Grid */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: In-Memory Buffer Saturation Telemetry */}
        {isMemorySaturated ? (
          <div className="p-3.5 sm:p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-white">
                  Kapasitas Buffer Ring-Memori
                </span>
              </div>
              <span
                className={`font-mono text-xs font-bold ${
                  isMemoryCritical ? 'text-rose-400' : 'text-amber-400'
                }`}
              >
                {effectiveBufferPercent}% Terpakai
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  isMemoryCritical
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, effectiveBufferPercent)}%` }}
              />
            </div>

            {/* Detailed Metrics List */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-slate-900/90 border border-slate-800/80">
                <span className="text-slate-400 block text-[10px] font-sans">
                  Total Entri Buffer:
                </span>
                <span className="text-white font-semibold">
                  {effectiveBufferCount} / {maxCapacity} log
                </span>
              </div>

              <div className="p-2 rounded bg-slate-900/90 border border-slate-800/80">
                <span className="text-slate-400 block text-[10px] font-sans">
                  Heap RAM Terpakai:
                </span>
                <span
                  className={
                    effectiveHeapUsedMb >= 200 ? 'text-rose-300' : 'text-amber-300'
                  }
                >
                  {effectiveHeapUsedMb} MB
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong>Proteksi Kapasitas Memori:</strong> Buffer log tanpa database di RAM mendekati ambang batas tinggi (*high-watermark*). Sistem secara proaktif memotong riwayat buffer dan <strong>otomatis membatalkan antrian pesan yang tidak digunakan</strong> (*auto-purge unused queue*) untuk membebaskan alokasi RAM seketika serta mencegah *out-of-memory crash*.
            </p>

            {/* Action Bar for Memory */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleExecutePurge}
                disabled={isPurging}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPurging ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>
                  {isPurging ? 'Membersihkan Buffer...' : 'Purge Buffer Sekarang'}
                </span>
              </button>

              <button
                onClick={() => onNavigate('console')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Server className="h-3.5 w-3.5 text-slate-400" />
                <span>Buka Konsol Live</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3.5 sm:p-4 rounded-xl border border-slate-800/60 bg-slate-950/40 flex items-center gap-3 text-xs text-slate-400">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Buffer Memori Optimal</span>
              <span>
                Kapasitas in-memory berada pada level sehat ({effectiveBufferPercent}%,{' '}
                {effectiveBufferCount} / {maxCapacity} entri).
              </span>
            </div>
          </div>
        )}

        {/* Card 2: High Frequency of Failed Requests Telemetry */}
        {hasHighFailureFrequency ? (
          <div className="p-3.5 sm:p-4 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span className="text-xs font-bold text-white">
                  Tingkat Kegagalan Pengiriman OTP
                </span>
              </div>
              <span
                className={`font-mono text-xs font-bold ${
                  isFailureCritical ? 'text-rose-400' : 'text-amber-400'
                }`}
              >
                {effectiveFailureRate}% Gagal
              </span>
            </div>

            {/* Visual Failure Bar */}
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-500"
                style={{ width: `${Math.min(100, effectiveFailureRate)}%` }}
              />
            </div>

            {/* Detailed Failure Metrics */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-slate-900/90 border border-slate-800/80">
                <span className="text-slate-400 block text-[10px] font-sans">
                  Total Gagal / Terkirim:
                </span>
                <span className="text-rose-300 font-semibold">
                  {effectiveFailedCount} gagal / {effectiveTotalCount} total
                </span>
              </div>

              <div className="p-2 rounded bg-slate-900/90 border border-slate-800/80">
                <span className="text-slate-400 block text-[10px] font-sans">
                  Status Socket WhatsApp:
                </span>
                <span
                  className={
                    waState.status === 'connected' ? 'text-emerald-400' : 'text-rose-400'
                  }
                >
                  {waState.status === 'connected' ? 'Online' : 'Terputus / Offline'}
                </span>
              </div>
            </div>

            {/* Smart Root-Cause Diagnostic Text */}
            <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/50 text-[11px] text-rose-200/90 leading-relaxed">
              <strong>Diagnostik Utama: </strong>
              {waState.status !== 'connected'
                ? 'Socket Baileys WhatsApp sedang offline atau belum dipindai QR code. Semua panggilan REST API OTP akan gagal dengan kode WA_NOT_CONNECTED.'
                : recentErrors.some((e) => e.code.includes('RATE_LIMIT'))
                ? 'Terdeteksi banyak permintaan ke nomor ponsel yang sama sebelum masa cooldown 60 detik anti-spam berakhir (HTTP 429).'
                : recentErrors.some((e) => e.code.includes('AUTH'))
                ? 'Terdeteksi kegagalan otentikasi JWT: token kedaluwarsa, dicabut (AUTH_KEY_REVOKED), atau izin otp:send tidak lengkap.'
                : 'Penerima mungkin menggunakan format nomor tidak valid, atau WhatsApp memblokir pengiriman karena akun dicurigai spam.'}
            </div>

            {/* Action Bar for Failures */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => onNavigate('errors')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Investigasi Error Log</span>
              </button>

              {waState.status !== 'connected' ? (
                <button
                  onClick={onOpenPairing}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Tautkan Ulang WhatsApp</span>
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('tester')}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5 text-sky-400" />
                  <span>Uji Kirim Manual (Sandbox)</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3.5 sm:p-4 rounded-xl border border-slate-800/60 bg-slate-950/40 flex items-center gap-3 text-xs text-slate-400">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">
                Tingkat Keberhasilan Optimal ({metrics.successRate}%)
              </span>
              <span>
                Tidak ada lonjakan kegagalan OTP yang terdeteksi ({failedRequests} gagal dari{' '}
                {totalRequests} transaksi).
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Success Notice Toast */}
      {purgeNotice && (
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{purgeNotice}</span>
        </div>
      )}
    </div>
  );
}
