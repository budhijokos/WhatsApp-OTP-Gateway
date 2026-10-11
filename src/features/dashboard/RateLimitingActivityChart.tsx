import { useState, useEffect, useCallback } from 'react';
import {
  Gauge,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Zap,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { RateLimitAccountStat, RateLimitSummary } from '../../types';
import { api } from '../../services/api';

interface RateLimitingActivityChartProps {
  onNavigate?: (tab: string) => void;
}

export function RateLimitingActivityChart({ onNavigate }: RateLimitingActivityChartProps) {
  const [data, setData] = useState<RateLimitAccountStat[]>([]);
  const [summary, setSummary] = useState<RateLimitSummary>({
    totalRequests: 0,
    totalSuccessful: 0,
    totalThrottled: 0,
    overallThrottledRate: 0,
    activeKeysCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [viewMode, setViewMode] = useState<'grouped' | 'stacked'>('grouped');
  const [selectedKeyId, setSelectedKeyId] = useState<string | 'all'>('all');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getRateLimitActivity();
      if (res && res.success) {
        setData(res.data || []);
        setSummary(
          res.summary || {
            totalRequests: 0,
            totalSuccessful: 0,
            totalThrottled: 0,
            overallThrottledRate: 0,
            activeKeysCount: 0,
          }
        );
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.warn('Gagal memuat aktivitas rate-limit:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleSimulate = async (clientId: string) => {
    setIsSimulating(true);
    try {
      await api.simulateRateLimitTraffic({
        clientId,
        successAdd: 6,
        throttledAdd: 3,
      });
      await fetchStats();
    } catch (err: any) {
      alert(`Gagal mensimulasikan lalu lintas: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset semua metrik pembatasan laju (rate-limiting) per kunci API ke nilai awal?')) {
      return;
    }
    try {
      await api.resetRateLimitStats();
      await fetchStats();
    } catch (err: any) {
      alert(`Gagal mereset metrik: ${err.message}`);
    }
  };

  const filteredData =
    selectedKeyId === 'all'
      ? data
      : data.filter((item) => item.keyId === selectedKeyId || item.clientId === selectedKeyId);

  // Calculate highest request count to scale the bars dynamically
  const maxBarValue = Math.max(
    1,
    ...filteredData.map((d) => (viewMode === 'grouped' ? Math.max(d.successfulRequests, d.throttledRequests) : d.totalRequests))
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <Gauge className="h-4 w-4" />
            <span>Aktivitas Pembatasan Laju (Rate Limiting)</span>
            <span className="text-slate-500 font-normal">·</span>
            <span className="text-slate-400 font-mono text-[11px]">Batas: 60 req/menit</span>
          </div>
          <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
            Perbandingan Permintaan Sukses vs Throttled per Kunci API
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
            Visualisasi real-time permintaan yang lolos ke gateway versus permintaan yang diblokir oleh middleware dengan kode HTTP 429 (*Rate Limit Exceeded*).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Berdampingan
            </button>
            <button
              onClick={() => setViewMode('stacked')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                viewMode === 'stacked'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bertumpuk (%)
            </button>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Reset Metrik Rate Limit"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Metric Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
          <span className="text-[11px] font-medium text-slate-400 block">Total Permintaan Masuk</span>
          <div className="mt-1 text-xl font-bold font-mono text-white tabular-nums">
            {summary.totalRequests.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Semua akun pengembang</span>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-900/30 bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-emerald-300">Permintaan Sukses</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-400 tabular-nums">
            {summary.totalSuccessful.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-emerald-400/80 block mt-0.5">
            {summary.totalRequests > 0
              ? `${(((summary.totalSuccessful) / summary.totalRequests) * 100).toFixed(1)}% berhasil`
              : '100%'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-rose-900/30 bg-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-rose-300">Dibatasi (Throttled)</span>
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-rose-400 tabular-nums">
            {summary.totalThrottled.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-rose-400/80 block mt-0.5">
            {summary.overallThrottledRate}% tingkat blokir (HTTP 429)
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Akun Klien Terpantau</span>
            <TrendingUp className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-sky-400 tabular-nums">
            {summary.activeKeysCount}
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('keys')}
              className="text-[10px] text-sky-400 hover:underline block mt-0.5 cursor-pointer"
            >
              Lihat Kunci API →
            </button>
          )}
        </div>
      </div>

      {/* Chart Legend & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-emerald-500 shadow-xs shadow-emerald-500/30" />
            <span className="text-slate-300 font-medium">Permintaan Sukses (HTTP 200)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-rose-500 shadow-xs shadow-rose-500/30" />
            <span className="text-slate-300 font-medium">Dibatasi / Throttled (HTTP 429)</span>
          </div>
        </div>

        {/* Filter by Client Key */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px]">Filter Klien:</span>
          <select
            value={selectedKeyId}
            onChange={(e) => setSelectedKeyId(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-800 bg-slate-950 text-slate-300 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">Semua Klien ({data.length})</option>
            {data.map((item) => (
              <option key={item.keyId || item.clientId} value={item.clientId}>
                {item.clientName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Bar Chart Section */}
      <div className="space-y-4 pt-1">
        {filteredData.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
            Belum ada data aktivitas rate limit. Lakukan panggilan API ke <code>/api/v1/otp/send</code> atau klik tombol &quot;Simulasi Beban&quot;.
          </div>
        ) : (
          filteredData.map((item) => {
            const successRatio = item.totalRequests > 0 ? (item.successfulRequests / item.totalRequests) * 100 : 100;
            const throttledRatio = item.totalRequests > 0 ? (item.throttledRequests / item.totalRequests) * 100 : 0;

            const successBarWidth =
              viewMode === 'grouped'
                ? Math.max(3, (item.successfulRequests / maxBarValue) * 100)
                : successRatio;

            const throttledBarWidth =
              viewMode === 'grouped'
                ? item.throttledRequests > 0
                  ? Math.max(3, (item.throttledRequests / maxBarValue) * 100)
                  : 0
                : throttledRatio;

            return (
              <div
                key={item.keyId || item.clientId}
                className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/60 hover:border-slate-700/80 transition-all space-y-3 group"
              >
                {/* Item Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-xs tracking-tight">
                      {item.clientName}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {item.clientId}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    {item.throttledRequests > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/40 border border-rose-800/40 text-rose-300 font-mono text-[10px]">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{item.throttledPercentage}% Throttled</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 font-mono text-[10px]">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>100% Bersih</span>
                      </span>
                    )}

                    {/* Quick simulate traffic button for this key */}
                    <button
                      onClick={() => handleSimulate(item.clientId)}
                      disabled={isSimulating}
                      className="px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                      title="Simulasikan traffic burst untuk akun ini"
                    >
                      <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                      <span>Uji Beban +6</span>
                    </button>
                  </div>
                </div>

                {/* BARS VISUALIZATION */}
                {viewMode === 'grouped' ? (
                  /* GROUPED BARS: Independent bars for Success and Throttled */
                  <div className="space-y-2">
                    {/* Success Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-xs bg-emerald-500 inline-block" />
                          <span>Permintaan Sukses</span>
                        </span>
                        <span className="font-mono text-emerald-400 font-bold tabular-nums">
                          {item.successfulRequests} req
                        </span>
                      </div>
                      <div className="h-3.5 w-full rounded-md bg-slate-900 border border-slate-800/80 overflow-hidden relative">
                        <div
                          className="h-full bg-linear-to-r from-emerald-600 to-emerald-400 rounded-xs transition-all duration-500 shadow-xs shadow-emerald-500/20"
                          style={{ width: `${successBarWidth}%` }}
                        />
                      </div>
                    </div>

                    {/* Throttled Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-xs bg-rose-500 inline-block" />
                          <span>Dibatasi Rate Limit (HTTP 429)</span>
                        </span>
                        <span
                          className={`font-mono font-bold tabular-nums ${
                            item.throttledRequests > 0 ? 'text-rose-400' : 'text-slate-500'
                          }`}
                        >
                          {item.throttledRequests} req
                        </span>
                      </div>
                      <div className="h-3.5 w-full rounded-md bg-slate-900 border border-slate-800/80 overflow-hidden relative">
                        {item.throttledRequests > 0 ? (
                          <div
                            className="h-full bg-linear-to-r from-rose-600 to-rose-400 rounded-xs transition-all duration-500 shadow-xs shadow-rose-500/20"
                            style={{ width: `${throttledBarWidth}%` }}
                          />
                        ) : (
                          <div className="h-full w-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* STACKED 100% BAR: Combined bar showing percentage ratio */
                  <div className="space-y-1.5">
                    <div className="h-5 w-full rounded-md bg-slate-900 border border-slate-800 overflow-hidden flex">
                      <div
                        className="h-full bg-linear-to-r from-emerald-600 to-emerald-500 transition-all duration-500 flex items-center justify-center text-[10px] font-mono text-white font-bold px-1"
                        style={{ width: `${successRatio}%` }}
                        title={`Sukses: ${item.successfulRequests} (${successRatio.toFixed(1)}%)`}
                      >
                        {successRatio > 12 && `${successRatio.toFixed(0)}% Sukses`}
                      </div>
                      {throttledRatio > 0 && (
                        <div
                          className="h-full bg-linear-to-r from-rose-600 to-rose-500 transition-all duration-500 flex items-center justify-center text-[10px] font-mono text-white font-bold px-1"
                          style={{ width: `${throttledRatio}%` }}
                          title={`Throttled: ${item.throttledRequests} (${throttledRatio.toFixed(1)}%)`}
                        >
                          {throttledRatio > 8 && `${throttledRatio.toFixed(0)}% Blocked`}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span>
                        Sukses: <strong className="text-emerald-400">{item.successfulRequests}</strong>
                      </span>
                      <span>
                        Throttled: <strong className="text-rose-400">{item.throttledRequests}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer Metadata */}
                <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                  <div className="flex items-center gap-3">
                    <span>
                      Jendela 60s: <strong className="text-slate-300 font-mono">{item.currentWindowCount}/60 req</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Sisa Kuota: <strong className="text-emerald-400 font-mono">{item.remainingInWindow} req</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px]">
                    {item.lastThrottledAt && (
                      <span className="text-rose-400/90 font-mono">
                        Terakhir throttled: {new Date(item.lastThrottledAt).toLocaleTimeString('id-ID')}
                      </span>
                    )}
                    {item.lastSuccessAt && (
                      <span className="text-slate-400 font-mono">
                        Aktivitas: {new Date(item.lastSuccessAt).toLocaleTimeString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Info notice */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 flex items-start gap-2.5 text-xs text-slate-400">
        <Zap className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="text-slate-300 font-semibold">Tentang Proteksi Rate Limiting: </span>
          Middleware memeriksa frekuensi permintaan di boundary HTTP sebelum menjadwalkan koneksi soket Baileys. Jika akun klien melampaui 60 request/menit, server segera mengembalikan respon <code className="text-rose-300 font-mono">HTTP 429 Too Many Requests</code> beserta header <code className="text-slate-300 font-mono">Retry-After</code> untuk mencegah akun WhatsApp terkena ban akibat flooding.
        </div>
      </div>
    </div>
  );
}
