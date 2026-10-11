import { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Send,
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  Zap,
  Server,
  Activity,
  Volume2,
  VolumeX,
  Bell,
  Key,
  ShoppingBag,
  ArrowRight,
  LogOut,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import { DeliveryLog, DetailedErrorLog, SystemMetrics, WhatsAppState } from '../../types';
import { DeliveryStatusIndicator, WhatsAppStatusBadge } from '../../components/StatusIndicator';
import { DeveloperIntegrationQuickstart } from './DeveloperIntegrationQuickstart';
import { RateLimitingActivityChart } from './RateLimitingActivityChart';
import { SystemHealthAlertBanner } from './SystemHealthAlertBanner';
import { QueueStatusCard } from './QueueStatusCard';
import { api } from '../../services/api';

interface DashboardOverviewProps {
  waState: WhatsAppState;
  metrics: SystemMetrics;
  recentLogs: DeliveryLog[];
  recentErrors: DetailedErrorLog[];
  onOpenPairing: () => void;
  onNavigate: (tab: string) => void;
  onRefreshMetrics?: () => void;
}

export function DashboardOverview({
  waState,
  metrics,
  recentLogs,
  recentErrors,
  onOpenPairing,
  onNavigate,
  onRefreshMetrics,
}: DashboardOverviewProps) {
  const isConnected = waState.status === 'connected';
  const [soundAlerts, setSoundAlerts] = useState<boolean>(() => {
    return localStorage.getItem('wa_sound_alerts') === 'true';
  });

  interface WidgetConfig {
    totalRequests: boolean;
    successRate: boolean;
    avgLatency: boolean;
    errorLogCount: boolean;
    queueStatus: boolean;
    ecommercePromo: boolean;
    rateLimitChart: boolean;
    devQuickstart: boolean;
  }

  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(() => {
    try {
      const saved = localStorage.getItem('wa_dashboard_widget_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      totalRequests: true,
      successRate: true,
      avgLatency: true,
      errorLogCount: true,
      queueStatus: true,
      ecommercePromo: true,
      rateLimitChart: true,
      devQuickstart: true,
    };
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const updateWidgetConfig = (key: keyof WidgetConfig, val: boolean) => {
    const next = { ...widgetConfig, [key]: val };
    setWidgetConfig(next);
    localStorage.setItem('wa_dashboard_widget_config', JSON.stringify(next));
  };

  const handleResetWidgetConfig = () => {
    const defaultCfg: WidgetConfig = {
      totalRequests: true,
      successRate: true,
      avgLatency: true,
      errorLogCount: true,
      queueStatus: true,
      ecommercePromo: true,
      rateLimitChart: true,
      devQuickstart: true,
    };
    setWidgetConfig(defaultCfg);
    localStorage.setItem('wa_dashboard_widget_config', JSON.stringify(defaultCfg));
  };

  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  const prevStatusRef = useRef(waState.status);

  const handleQuickResetSession = async () => {
    setIsResetting(true);
    setResetNotice(null);
    try {
      await api.resetSession();
      setIsConfirmingReset(false);
      setResetNotice('Sesi WhatsApp berhasil dibersihkan! Memuat socket baru...');
      setTimeout(() => setResetNotice(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal reset sesi';
      setResetNotice(`Error: ${msg}`);
    } finally {
      setIsResetting(false);
    }
  };

  // Play audio alert on disconnect or critical error
  useEffect(() => {
    if (!soundAlerts) return;

    if (prevStatusRef.current === 'connected' && waState.status === 'disconnected') {
      playAlertChime('error');
    }
    prevStatusRef.current = waState.status;
  }, [waState.status, soundAlerts]);

  const toggleSound = () => {
    const nextVal = !soundAlerts;
    setSoundAlerts(nextVal);
    localStorage.setItem('wa_sound_alerts', String(nextVal));
    if (nextVal) {
      playAlertChime('success');
    }
  };

  const playAlertChime = (type: 'error' | 'success') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {}
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    if (!seconds) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}j ${mins}m ${secs}d`;
    if (mins > 0) return `${mins}m ${secs}d`;
    return `${secs}d`;
  };

  return (
    <div className="space-y-6">
      {/* Proactive System Health Alert Banner (Memory Buffer Saturation & High Failure Rate) */}
      <SystemHealthAlertBanner
        metrics={metrics}
        recentLogs={recentLogs}
        recentErrors={recentErrors}
        waState={waState}
        onNavigate={onNavigate}
        onOpenPairing={onOpenPairing}
        onRefreshMetrics={onRefreshMetrics}
      />

      {/* Hero / Quick Banner with Architecture Illustration */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-linear-to-r from-slate-900 via-slate-900/90 to-slate-950 p-6">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <span>Hono.js Engine</span>
              <span aria-hidden="true">·</span>
              <span>WhiskeySockets Baileys</span>
              <span aria-hidden="true">·</span>
              <span>In-Memory State</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white text-balance">
              WhatsApp OTP Delivery Gateway
            </h1>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              Kirimkan kode OTP secara aman dan instan langsung ke nomor WhatsApp pelanggan melalui REST API terotentikasi JWT Bearer, lengkap dengan pemantauan pengiriman real-time.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onNavigate('tester')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Uji Kirim OTP Sekarang</span>
              </button>
              <button
                onClick={() => onNavigate('keys')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 cursor-pointer"
              >
                <Key className="h-3.5 w-3.5 text-amber-400" />
                <span>Kunci API &amp; Rotasi JWT</span>
              </button>
              <button
                onClick={() => onNavigate('developer')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 cursor-pointer"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Panduan Dev</span>
              </button>
            </div>
          </div>

          {/* Device Pairing Card Anchor */}
          <div className="shrink-0 w-full md:w-80 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-xs font-semibold text-slate-300">Status Perangkat WA</span>
              <WhatsAppStatusBadge status={waState.status} />
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Nomor Ponsel:</span>
                <span className="font-mono text-slate-200">
                  {waState.phone ? `+${waState.phone}` : 'Belum Ditautkan'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Nama Klien:</span>
                <span className="text-slate-200">{waState.pushName || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Uptime Socket:</span>
                <span className="font-mono text-slate-200 tabular-nums">
                  {formatUptime(waState.uptimeSeconds)}
                </span>
              </div>
            </div>
            {/* Action Buttons */}
            {isConfirmingReset ? (
              <div className="mt-3 p-3 rounded-lg border border-rose-800/60 bg-rose-950/40 space-y-2 animate-in fade-in">
                <div className="flex items-start gap-1.5 text-rose-300 text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                  <span className="leading-tight text-[11px]">
                    Hapus kredensial sesi lokal (<code className="font-mono text-rose-200">.baileys_auth</code>) dan putuskan koneksi?
                  </span>
                </div>
                <div className="flex items-center gap-1.5 justify-end pt-1">
                  <button
                    onClick={() => setIsConfirmingReset(false)}
                    disabled={isResetting}
                    className="px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleQuickResetSession}
                    disabled={isResetting}
                    className="px-2.5 py-1 text-xs font-bold rounded bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isResetting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    <span>{isResetting ? 'Mereset...' : 'Ya, Keluar'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-1.5">
                <button
                  onClick={onOpenPairing}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isConnected
                      ? 'border-slate-700 bg-slate-800/70 hover:bg-slate-800 text-slate-200'
                      : 'border-emerald-500/50 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300'
                  }`}
                >
                  <QrCode className="h-3.5 w-3.5" />
                  <span>{isConnected ? 'Kelola Perangkat (QR / Pairing Code)' : 'Tautkan WhatsApp (QR Code)'}</span>
                </button>

                {isConnected && (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingReset(true)}
                    className="w-full py-1.5 px-3 text-xs font-medium rounded-md border border-rose-900/60 bg-rose-950/20 hover:bg-rose-950/50 text-rose-300 hover:text-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5 text-rose-400" />
                    <span>Keluarkan &amp; Reset Sesi</span>
                  </button>
                )}
              </div>
            )}

            {resetNotice && (
              <div className="mt-2 p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{resetNotice}</span>
              </div>
            )}

            <div className="mt-2.5 flex items-center justify-between pt-2.5 border-t border-slate-800/70 text-[11px]">
              <span className="text-slate-400">Peringatan Audio Diskoneksi:</span>
              <button
                onClick={toggleSound}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                  soundAlerts
                    ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900 border border-slate-800 text-slate-500'
                }`}
                title="Aktifkan/nonaktifkan nada peringatan saat WhatsApp terputus"
              >
                {soundAlerts ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                <span>{soundAlerts ? 'Aktif' : 'Mati'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Header & Widget Configuration Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Ringkasan Metrik &amp; Kinerja Gateway</h2>
          <p className="text-xs text-slate-400">Pantau statistik pengiriman real-time dan sesuaikan tampilan widget sesuai prioritas Anda</p>
        </div>
        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-400" />
          <span>{isConfigOpen ? 'Tutup Pengaturan Widget' : 'Sesuaikan Tampilan Widget'}</span>
        </button>
      </div>

      {/* Widget Configuration Panel / Drawer */}
      {isConfigOpen && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/95 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-white tracking-tight">Kustomisasi Tampilan Widget Dasbor</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Pilih widget metrik dan modul yang ingin ditampilkan atau disembunyikan sesuai prioritas data Anda.</p>
            </div>
            <button
              onClick={handleResetWidgetConfig}
              className="text-[11px] text-slate-400 hover:text-white underline transition-colors cursor-pointer"
            >
              Reset Default
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
              <span className="text-slate-200 font-medium">Total Permintaan OTP</span>
              <input
                type="checkbox"
                checked={widgetConfig.totalRequests}
                onChange={(e) => updateWidgetConfig('totalRequests', e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
              <span className="text-slate-200 font-medium">Tingkat Keberhasilan</span>
              <input
                type="checkbox"
                checked={widgetConfig.successRate}
                onChange={(e) => updateWidgetConfig('successRate', e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
              <span className="text-slate-200 font-medium">Rata-rata Latensi</span>
              <input
                type="checkbox"
                checked={widgetConfig.avgLatency}
                onChange={(e) => updateWidgetConfig('avgLatency', e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
              <span className="text-slate-200 font-medium">Log Error Debug</span>
              <input
                type="checkbox"
                checked={widgetConfig.errorLogCount}
                onChange={(e) => updateWidgetConfig('errorLogCount', e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
              <span className="text-slate-200 font-medium">P-Queue Status Card</span>
              <input
                type="checkbox"
                checked={widgetConfig.queueStatus}
                onChange={(e) => updateWidgetConfig('queueStatus', e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
              <span className="text-slate-200 font-medium">Modul E-Commerce Notifier</span>
              <input
                type="checkbox"
                checked={widgetConfig.ecommercePromo}
                onChange={(e) => updateWidgetConfig('ecommercePromo', e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
              <span className="text-slate-200 font-medium">Grafik Rate Limiting</span>
              <input
                type="checkbox"
                checked={widgetConfig.rateLimitChart}
                onChange={(e) => updateWidgetConfig('rateLimitChart', e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
              <span className="text-slate-200 font-medium">Panduan Quickstart Dev</span>
              <input
                type="checkbox"
                checked={widgetConfig.devQuickstart}
                onChange={(e) => updateWidgetConfig('devQuickstart', e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {/* Metric Cards (Tabular Numerals, High Density) */}
      {(widgetConfig.totalRequests || widgetConfig.successRate || widgetConfig.avgLatency || widgetConfig.errorLogCount) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {widgetConfig.totalRequests && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Total Permintaan OTP</span>
                <Server className="h-4 w-4 text-slate-500" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
                {metrics.total}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">Buffer memori tanpa database</div>
            </div>
          )}

          {widgetConfig.successRate && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tingkat Keberhasilan</span>
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-400 font-mono tabular-nums">
                {metrics.successRate}%
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                <span className="text-emerald-400 font-mono tabular-nums">{metrics.sent}</span> terkirim ·{' '}
                <span className="text-rose-400 font-mono tabular-nums">{metrics.failed}</span> gagal
              </div>
            </div>
          )}

          {widgetConfig.avgLatency && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Rata-rata Latensi</span>
                <Zap className="h-4 w-4 text-sky-400" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
                {metrics.avgLatencyMs}
                <span className="text-xs font-normal text-slate-400 ml-1">ms</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">Dispatched via Baileys socket</div>
            </div>
          )}

          {widgetConfig.errorLogCount && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Log Error Debug</span>
                <AlertCircle className="h-4 w-4 text-rose-400" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-rose-400 font-mono tabular-nums">
                {metrics.errorCount}
              </div>
              <button
                onClick={() => onNavigate('errors')}
                className="mt-1 text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Buka log error</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* P-Queue WhatsApp Message Dispatch Telemetry & Controls */}
      {widgetConfig.queueStatus && (
        <QueueStatusCard queueStats={metrics.queue} onRefresh={onRefreshMetrics} />
      )}

      {/* E-Commerce Notifier Promo Banner */}
      {widgetConfig.ecommercePromo && (
        <div className="p-4 rounded-xl border border-slate-800 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">Modul Notifikasi E-Commerce & Toko Online</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 border border-emerald-800 text-emerald-300">
                  Event-Driven
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Trigger pengiriman otomatis ke WhatsApp pembeli saat pesanan dibuat, pembayaran lunas, resi ekspedisi keluar, konfirmasi COD, dan keranjang belanja ditinggalkan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('webhook-sim')}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Radio className="h-3.5 w-3.5 text-sky-400" />
              <span>Simulator Webhook</span>
            </button>
            <button
              onClick={() => onNavigate('ecommerce')}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Buka E-Commerce</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Rate-Limiting Activity Bar Chart Section */}
      {widgetConfig.rateLimitChart && (
        <RateLimitingActivityChart onNavigate={onNavigate} />
      )}

      {/* Developer Integration Quickstart Guide */}
      {widgetConfig.devQuickstart && (
        <DeveloperIntegrationQuickstart onNavigate={onNavigate} />
      )}

      {/* Split Section: Recent Deliveries & Debug Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Delivery Log Table (2 Cols) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-white">Aktivitas Pengiriman Terkini</h2>
              <p className="text-xs text-slate-400">Streaming real-time dari Hono OTP service</p>
            </div>
            <button
              onClick={() => onNavigate('logs')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>Lihat Semua Log</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>

          <div className="mt-3 overflow-x-auto">
            {recentLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Belum ada aktivitas pengiriman OTP. Uji coba dengan tombol &quot;Kirim OTP&quot; di atas.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 font-medium">
                    <th className="py-2 px-3">Waktu</th>
                    <th className="py-2 px-3">Penerima</th>
                    <th className="py-2 px-3">Aplikasi</th>
                    <th className="py-2 px-3">Kode OTP</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Latensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {recentLogs.slice(0, 5).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] tabular-nums whitespace-nowrap">
                        {new Date(log.sentAt).toLocaleTimeString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-200 whitespace-nowrap">
                        {log.maskedRecipient}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-[120px] truncate">
                        {log.appName}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 tabular-nums">
                        {log.otp}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <DeliveryStatusIndicator status={log.status} />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums whitespace-nowrap">
                        {log.latencyMs}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Live Debug & Error Warnings (1 Col) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">Peringatan & Debugging</h2>
              <button
                onClick={() => onNavigate('errors')}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Detail
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {recentErrors.length === 0 ? (
                <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Sistem Berjalan Normal</span>
                    <span className="text-[11px] text-slate-400">
                      Tidak ada error kritis pada socket WhatsApp maupun otentikasi JWT saat ini.
                    </span>
                  </div>
                </div>
              ) : (
                recentErrors.slice(0, 3).map((err) => (
                  <div
                    key={err.id}
                    className="p-3 rounded-lg border border-rose-900/40 bg-rose-950/20 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold text-rose-400">
                        {err.code}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(err.timestamp).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                    <p className="text-slate-200 font-medium text-[11px] truncate">{err.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      💡 {err.suggestedAction}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Middleware JWT</span>
            <span className="font-mono text-emerald-400">Aktif (HS256)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
