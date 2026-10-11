import { useState } from 'react';
import {
  Layers,
  Pause,
  Play,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
  Activity,
  AlertCircle,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { QueueStats } from '../../types';
import { api } from '../../services/api';

interface QueueStatusCardProps {
  queueStats?: QueueStats;
  onRefresh?: () => void;
}

export function QueueStatusCard({ queueStats, onRefresh }: QueueStatusCardProps) {
  const [loading, setLoading] = useState(false);
  const [isPurgingUnused, setIsPurgingUnused] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Fallback defaults if metrics not yet loaded
  const stats: QueueStats = queueStats || {
    size: 0,
    pending: 0,
    isPaused: false,
    concurrency: 1,
    totalQueued: 0,
    totalProcessed: 0,
    totalFailed: 0,
    autoPurgedCount: 0,
    lastAutoPurgedAt: null,
    lastPurgeReason: null,
    memoryPressurePurgeActive: false,
  };

  const handleTogglePause = async () => {
    setLoading(true);
    setFeedbackMessage(null);
    try {
      if (stats.isPaused) {
        await api.resumeQueue();
        setFeedbackMessage('Antrian pengiriman dilanjutkan (Resumed).');
      } else {
        await api.pauseQueue();
        setFeedbackMessage('Antrian pengiriman berhasil dijeda (Paused).');
      }
      onRefresh?.();
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah status antrian';
      setFeedbackMessage(`Error: ${msg}`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleClearQueue = async () => {
    if (stats.size === 0) return;
    setLoading(true);
    setFeedbackMessage(null);
    try {
      await api.clearQueue();
      setFeedbackMessage('Semua antrian yang belum terkirim berhasil dibersihkan.');
      onRefresh?.();
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membersihkan antrian';
      setFeedbackMessage(`Error: ${msg}`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  // Dedicated action to purge unused/stale queue items and test auto-purge
  const handlePurgeUnusedQueue = async () => {
    setIsPurgingUnused(true);
    setFeedbackMessage(null);
    try {
      const res = await api.purgeUnusedQueue();
      setFeedbackMessage(
        res.purgedCount > 0
          ? `Berhasil membatalkan & menghapus ${res.purgedCount} antrian yang tidak digunakan untuk menghemat memori.`
          : 'Pemeriksaan selesai: Tidak ada antrian tak digunakan atau memori dalam batas aman.'
      );
      onRefresh?.();
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengeksekusi purge antrian';
      setFeedbackMessage(`Error: ${msg}`);
      setTimeout(() => setFeedbackMessage(null), 5000);
    } finally {
      setIsPurgingUnused(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                P-Queue: Antrian Pengiriman WhatsApp
              </h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase ${
                  stats.isPaused
                    ? 'bg-amber-950 border border-amber-800 text-amber-300'
                    : stats.pending > 0
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-300 animate-pulse'
                    : 'bg-slate-800 border border-slate-700 text-slate-300'
                }`}
              >
                {stats.isPaused ? 'Dijeda (Paused)' : stats.pending > 0 ? 'Aktif Mengirim' : 'Standby'}
              </span>

              {/* Auto Purge Memory Protection Status Badge */}
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 flex items-center gap-1">
                <Cpu className="h-2.5 w-2.5 text-emerald-400" />
                <span>Auto-Purge Memori Aktif</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Antrian terurut anti-ban: concurrency 1 pekerja dengan jeda simulasi pengetikan 1.1s–2.0s &amp; proteksi otomatis saat kapasitas RAM penuh.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={handleTogglePause}
            disabled={loading}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              stats.isPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            {loading ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : stats.isPaused ? (
              <Play className="h-3 w-3 fill-current" />
            ) : (
              <Pause className="h-3 w-3 fill-current" />
            )}
            <span>{stats.isPaused ? 'Lanjutkan Antrian' : 'Jeda Antrian'}</span>
          </button>

          {/* Purge Unused Queue (Auto / Manual Trigger) */}
          <button
            onClick={handlePurgeUnusedQueue}
            disabled={isPurgingUnused}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/60 text-amber-300 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Hapus antrian yang tidak digunakan atau kadaluarsa untuk membebaskan kapasitas memori"
          >
            {isPurgingUnused ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Zap className="h-3 w-3 text-amber-400" />
            )}
            <span>Hapus Antrian Tak Digunakan</span>
          </button>

          {stats.size > 0 && (
            <button
              onClick={handleClearQueue}
              disabled={loading}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/60 text-rose-300 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Bersihkan semua antrian yang tertunda"
            >
              <Trash2 className="h-3 w-3" />
              <span>Bersihkan ({stats.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Memory Pressure Alert / Notification Pill if Memory Pressure active */}
      {stats.memoryPressurePurgeActive && (
        <div className="p-3 rounded-lg border border-rose-800/70 bg-rose-950/50 text-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>
              <strong>Tekanan Memori Terdeteksi:</strong> RAM mendekati kapasitas penuh. Sistem otomatis membatalkan antrian pesan yang tidak digunakan untuk mencegah crash.
            </span>
          </div>
          <button
            onClick={handlePurgeUnusedQueue}
            disabled={isPurgingUnused}
            className="px-2.5 py-1 text-[11px] font-bold rounded bg-rose-600 hover:bg-rose-500 text-white shrink-0 cursor-pointer"
          >
            Purge Sekarang
          </button>
        </div>
      )}

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Metric 1: Waiting in Queue */}
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Menunggu Antrian</span>
            <Clock className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {stats.size}
            <span className="text-[11px] font-normal text-slate-500 ml-1">pesan</span>
          </div>
          <span className="text-[10px] text-slate-500 block truncate">
            {stats.size > 0 ? 'Sedang dalam buffer giliran' : 'Tidak ada antrian tertunda'}
          </span>
        </div>

        {/* Metric 2: Active Dispatch Worker */}
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Pekerja Aktif</span>
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
            {stats.pending} / {stats.concurrency}
          </div>
          <span className="text-[10px] text-slate-500 block truncate">
            Concurrency terisolasi
          </span>
        </div>

        {/* Metric 3: Total Processed */}
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Diproses</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {stats.totalProcessed}
          </div>
          <span className="text-[10px] text-slate-500 block truncate">
            {stats.totalQueued} dimasukkan antrian
          </span>
        </div>

        {/* Metric 4: Auto-Purged Unused Items */}
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Dihapus Otomatis (Memori)</span>
            <Cpu className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-300 tabular-nums">
            {stats.autoPurgedCount}
            <span className="text-[11px] font-normal text-slate-500 ml-1">item</span>
          </div>
          <span className="text-[10px] text-slate-500 block truncate" title={stats.lastPurgeReason || 'Auto-purge saat memori penuh'}>
            {stats.lastAutoPurgedAt
              ? `Terakhir: ${new Date(stats.lastAutoPurgedAt).toLocaleTimeString('id-ID')}`
              : 'Belum ada antrian dibatalkan'}
          </span>
        </div>
      </div>

      {/* Auto-Purge Policy Summary Card */}
      <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Kebijakan Proteksi Memori:</strong> Jika penggunaan Heap RAM mencapai ambang batas (&ge;180MB/220MB) atau buffer ring log mencapai 85%, antrian yang kadaluarsa atau tidak digunakan otomatis dibatalkan untuk membebaskan memori.
          </span>
        </div>
        {stats.lastPurgeReason && (
          <span className="text-[10px] font-mono text-amber-300/80 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded shrink-0">
            Pemicu: {stats.lastPurgeReason}
          </span>
        )}
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-sky-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}
    </div>
  );
}
