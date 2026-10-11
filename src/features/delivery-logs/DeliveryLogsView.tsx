import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Trash2,
  RefreshCw,
  Eye,
  Download,
  FileText,
  Key,
  X,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  SlidersHorizontal,
  ShieldCheck,
  Zap,
  HardDrive,
  Info,
} from 'lucide-react';
import { ApiKeyItem, DeliveryLog, MemoryHealthInfo } from '../../types';
import { api } from '../../services/api';
import { DeliveryStatusIndicator } from '../../components/StatusIndicator';
import { CodeBlock } from '../../components/CodeBlock';

interface DeliveryLogsViewProps {
  logs: DeliveryLog[];
  onRefresh: () => void;
}

export function DeliveryLogsView({ logs, onRefresh }: DeliveryLogsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [apiKeyFilter, setApiKeyFilter] = useState<string>('all');
  const [registeredKeys, setRegisteredKeys] = useState<ApiKeyItem[]>([]);
  const [selectedLog, setSelectedLog] = useState<DeliveryLog | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [memoryHealth, setMemoryHealth] = useState<MemoryHealthInfo | null>(null);
  const [isPurgingMemory, setIsPurgingMemory] = useState(false);
  const [purgeFeedback, setPurgeFeedback] = useState<string | null>(null);

  const fetchMemoryHealth = useCallback(async () => {
    try {
      const res = await api.getMemoryHealth();
      if (res && res.success && res.memory) {
        setMemoryHealth(res.memory);
      }
    } catch (err) {
      console.warn('Could not fetch memory health:', err);
    }
  }, []);

  useEffect(() => {
    fetchMemoryHealth();
    const interval = setInterval(fetchMemoryHealth, 10000);
    return () => clearInterval(interval);
  }, [fetchMemoryHealth]);

  const handleTriggerAutoPurge = async () => {
    setIsPurgingMemory(true);
    try {
      const res = await api.triggerAutoPurge();
      if (res.success && res.result) {
        setPurgeFeedback(
          res.result.message || `Berhasil memangkas ${res.result.totalPruned || 0} log terlama.`
        );
        await fetchMemoryHealth();
        onRefresh();
        setTimeout(() => setPurgeFeedback(null), 8000);
      }
    } catch (err: any) {
      alert(`Gagal memangkas log memori: ${err.message}`);
    } finally {
      setIsPurgingMemory(false);
    }
  };

  // Fetch registered API keys so the dropdown displays friendly client names
  useEffect(() => {
    let isMounted = true;
    api
      .getKeys()
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.keys)) {
          setRegisteredKeys(res.keys);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch API keys for filter dropdown:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute available API keys / Developer IDs from both registered keys and existing logs
  const availableApiKeys = useMemo(() => {
    const keyMap = new Map<string, string>(); // clientId -> clientName

    // Add registered keys
    for (const k of registeredKeys) {
      if (k.clientId) {
        keyMap.set(k.clientId, k.clientName || k.clientId);
      }
    }

    // Add any unique developerId found in logs
    for (const log of logs) {
      if (log.developerId && !keyMap.has(log.developerId)) {
        keyMap.set(log.developerId, log.developerName || log.developerId);
      }
    }

    return Array.from(keyMap.entries()).map(([clientId, clientName]) => ({
      clientId,
      clientName,
    }));
  }, [registeredKeys, logs]);

  // Normalization helper for phone search
  const normalizeDigits = (val: string) => val.replace(/[\s\-\+\(\)]/g, '');

  const filteredLogs = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase();
    const cleanSearchDigits = normalizeDigits(cleanSearch);

    return logs.filter((log) => {
      // 1. Recipient Phone / General Text Match
      let matchesSearch = true;
      if (cleanSearch) {
        const rawPhone = normalizeDigits(log.recipient || '');
        const maskedPhone = (log.maskedRecipient || '').toLowerCase();
        const otpCode = log.otp || '';
        const appName = (log.appName || '').toLowerCase();
        const devId = (log.developerId || '').toLowerCase();
        const devName = (log.developerName || '').toLowerCase();
        const errMsg = (log.errorMessage || '').toLowerCase();

        // Check if digits match either 08... or 628...
        const matchesPhoneDigits =
          cleanSearchDigits.length > 2 &&
          (rawPhone.includes(cleanSearchDigits) ||
            (cleanSearchDigits.startsWith('0') &&
              rawPhone.includes('62' + cleanSearchDigits.slice(1))) ||
            (cleanSearchDigits.startsWith('62') &&
              rawPhone.includes(cleanSearchDigits)));

        matchesSearch =
          matchesPhoneDigits ||
          rawPhone.includes(cleanSearch) ||
          maskedPhone.includes(cleanSearch) ||
          otpCode.includes(cleanSearch) ||
          appName.includes(cleanSearch) ||
          devId.includes(cleanSearch) ||
          devName.includes(cleanSearch) ||
          errMsg.includes(cleanSearch);
      }

      // 2. Status Match (supports 'all', 'sent' [includes 'delivered'], 'failed', 'pending')
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        if (statusFilter === 'sent') {
          matchesStatus = log.status === 'sent' || log.status === 'delivered';
        } else if (statusFilter === 'failed') {
          matchesStatus = log.status === 'failed';
        } else if (statusFilter === 'pending') {
          matchesStatus = log.status === 'pending';
        } else {
          matchesStatus = log.status === statusFilter;
        }
      }

      // 3. API Key / Developer Account Match
      let matchesApiKey = true;
      if (apiKeyFilter !== 'all') {
        matchesApiKey =
          log.developerId === apiKeyFilter ||
          Boolean(log.developerName && log.developerName.toLowerCase() === apiKeyFilter.toLowerCase());
      }

      return matchesSearch && matchesStatus && matchesApiKey;
    });
  }, [logs, searchTerm, statusFilter, apiKeyFilter]);

  const handleClearLogs = async () => {
    if (!confirm('Yakin ingin membersihkan semua riwayat pengiriman OTP di memori?')) return;
    setIsClearing(true);
    try {
      await api.clearDeliveryLogs();
      onRefresh();
    } finally {
      setIsClearing(false);
    }
  };

  const resetAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setApiKeyFilter('all');
  };

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || apiKeyFilter !== 'all';

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      alert('Tidak ada log untuk diekspor');
      return;
    }

    const headers = [
      'ID',
      'Waktu',
      'Nomor Penerima',
      'Kode OTP',
      'Aplikasi',
      'Status',
      'Latensi (ms)',
      'Developer ID',
      'Developer Name',
      'Error',
    ];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${new Date(l.sentAt).toISOString()}"`,
      `"${l.recipient}"`,
      `"${l.otp}"`,
      `"${l.appName.replace(/"/g, '""')}"`,
      l.status,
      l.latencyMs,
      `"${l.developerId}"`,
      `"${(l.developerName || '').replace(/"/g, '""')}"`,
      `"${(l.errorMessage || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `whatsapp_otp_logs_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    if (filteredLogs.length === 0) {
      alert('Tidak ada log untuk diekspor');
      return;
    }

    const jsonContent = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `whatsapp_otp_logs_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusCounts = useMemo(() => {
    return {
      all: logs.length,
      sent: logs.filter((l) => l.status === 'sent' || l.status === 'delivered').length,
      failed: logs.filter((l) => l.status === 'failed').length,
      pending: logs.filter((l) => l.status === 'pending').length,
    };
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Log Pengiriman WhatsApp OTP</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar pengiriman OTP yang tersimpan dalam ring-buffer memori tanpa database eksternal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Unduh file format CSV"
          >
            <Download className="h-3 w-3 text-emerald-400" />
            <span>Ekspor CSV ({filteredLogs.length})</span>
          </button>
          <button
            onClick={handleExportJson}
            disabled={filteredLogs.length === 0}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Unduh file format JSON"
          >
            <FileText className="h-3 w-3 text-sky-400" />
            <span>Ekspor JSON</span>
          </button>
          <button
            onClick={onRefresh}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Segarkan</span>
          </button>
          <button
            onClick={handleClearLogs}
            disabled={isClearing || logs.length === 0}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-rose-950/40 border border-rose-800/40 text-rose-300 hover:bg-rose-900/40 disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            <span>Bersihkan Log</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert for Auto-Purge execution */}
      {purgeFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-xs flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{purgeFeedback}</span>
          </div>
          <button
            onClick={() => setPurgeFeedback(null)}
            className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* In-Memory Capacity & Auto-Purge Protection Strip */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight">Proteksi In-Memory Auto-Purge:</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Aktif (Ambang Batas 85% / 220 MB)</span>
              </span>
              {memoryHealth?.status === 'warning' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950 border border-amber-800 text-amber-300 font-mono">
                  Siaga
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sistem otomatis memangkas 35% log terlama saat kapasitas memori buffer hampir penuh untuk mencegah <em>Out-of-Memory (OOM)</em> pada VPS server Anda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
          <div className="text-left md:text-right text-xs">
            <div className="text-slate-300 font-medium">
              Buffer: <strong className="text-white font-mono">{memoryHealth?.currentBufferCount ?? logs.length}/{memoryHealth?.maxBufferCapacity ?? 700}</strong>{' '}
              <span className="text-slate-400 font-mono text-[11px]">
                ({memoryHealth?.bufferUsagePercent ?? Math.min(100, Math.round((logs.length / 250) * 100))}%)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Heap: {memoryHealth?.heapUsedMb ?? 0} MB · Dipangkas: {memoryHealth?.purgeCount ?? 0}x
            </div>
          </div>

          <button
            onClick={handleTriggerAutoPurge}
            disabled={isPurgingMemory}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            title="Uji coba proses pemangkasan log otomatis sekarang"
          >
            <Zap className={`h-3.5 w-3.5 text-amber-400 ${isPurgingMemory ? 'animate-spin' : ''}`} />
            <span>{isPurgingMemory ? 'Memangkas...' : 'Uji Auto-Purge'}</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'border-slate-700 bg-slate-800/60 shadow-xs'
              : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900/40'
          }`}
        >
          <span className="text-[11px] font-medium text-slate-400 block">Semua Log</span>
          <div className="mt-1 text-xl font-bold font-mono text-white tabular-nums">
            {statusCounts.all}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('sent')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'sent'
              ? 'border-emerald-600/60 bg-emerald-950/40 shadow-xs'
              : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-emerald-400">Terkirim (Sent)</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-400 tabular-nums">
            {statusCounts.sent}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('failed')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'failed'
              ? 'border-rose-600/60 bg-rose-950/40 shadow-xs'
              : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-rose-400">Gagal (Failed)</span>
            <XCircle className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-rose-400 tabular-nums">
            {statusCounts.failed}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'border-amber-600/60 bg-amber-950/40 shadow-xs'
              : 'border-slate-800 bg-slate-950/60 hover:bg-slate-900/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-amber-400">Pending</span>
            <Clock className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-amber-400 tabular-nums">
            {statusCounts.pending}
          </div>
        </button>
      </div>

      {/* FILTER TOOLBAR: Search Bar & Dropdowns */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* 1. SEARCH BAR (Phone, OTP, App) */}
          <div className="relative md:col-span-6">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor penerima (0812..., 628...), OTP, atau aplikasi..."
              className="w-full pl-10 pr-9 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 p-0.5 rounded-full text-slate-500 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 2. FILTER DROPDOWN: STATUS (Sent, Failed, Pending) */}
          <div className="md:col-span-3">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer transition-colors appearance-none"
              >
                <option value="all">Semua Status ({statusCounts.all})</option>
                <option value="sent">🟢 Terkirim / Sent ({statusCounts.sent})</option>
                <option value="failed">🔴 Gagal / Failed ({statusCounts.failed})</option>
                <option value="pending">🟡 Pending ({statusCounts.pending})</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>

          {/* 3. FILTER DROPDOWN: SPECIFIC API KEY */}
          <div className="md:col-span-3">
            <div className="relative">
              <select
                value={apiKeyFilter}
                onChange={(e) => setApiKeyFilter(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer transition-colors appearance-none"
              >
                <option value="all">Semua Kunci API / Klien ({availableApiKeys.length})</option>
                {availableApiKeys.map((item) => (
                  <option key={item.clientId} value={item.clientId}>
                    🔑 {item.clientName} ({item.clientId})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                <Key className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Filter Tags & Count Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">
              Menampilkan <strong className="text-white font-mono">{filteredLogs.length}</strong> dari{' '}
              <span className="font-mono text-slate-400">{logs.length}</span> log
            </span>

            {/* Active Pills */}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[10px] font-mono border border-slate-700">
                <span>Cari: &quot;{searchTerm}&quot;</span>
                <button
                  onClick={() => setSearchTerm('')}
                  className="hover:text-rose-400 cursor-pointer ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 text-[10px] font-mono border border-emerald-800/50">
                <span>Status: {statusFilter.toUpperCase()}</span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className="hover:text-rose-400 cursor-pointer ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {apiKeyFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-950/60 text-sky-300 text-[10px] font-mono border border-sky-800/50">
                <span>Kunci: {apiKeyFilter}</span>
                <button
                  onClick={() => setApiKeyFilter('all')}
                  className="hover:text-rose-400 cursor-pointer ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>

          {/* Reset All Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer py-0.5"
            >
              <RotateCcw className="h-3 w-3 text-amber-400" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-md">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-2">
            <p>
              {logs.length === 0
                ? 'Belum ada catatan pengiriman OTP pada sistem.'
                : 'Tidak ada log pengiriman yang sesuai dengan kriteria filter Anda.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Hapus Semua Filter</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Nomor Penerima</th>
                  <th className="py-3 px-4">Kode OTP</th>
                  <th className="py-3 px-4">Aplikasi</th>
                  <th className="py-3 px-4">Status Pengiriman</th>
                  <th className="py-3 px-4">Kunci API / Klien</th>
                  <th className="py-3 px-4 text-right">Latensi</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] tabular-nums whitespace-nowrap">
                      {new Date(log.sentAt).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-200 whitespace-nowrap">
                      {log.maskedRecipient || log.recipient}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400 tabular-nums">
                      {log.otp}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {log.appName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <DeliveryStatusIndicator status={log.status} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px]">
                        <Key className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                        <span className="max-w-[140px] truncate" title={log.developerId}>
                          {log.developerName || log.developerId}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400 tabular-nums whitespace-nowrap">
                      {log.latencyMs}ms
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Lihat Detail Log"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">Rincian Log Pengiriman #{selectedLog.id}</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">STATUS</span>
                  <DeliveryStatusIndicator status={selectedLog.status} />
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">KODE OTP</span>
                  <span className="text-emerald-400 font-bold">{selectedLog.otp}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">PENERIMA ASLI</span>
                  <span className="text-slate-200">{selectedLog.recipient}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">KUNCI PENGEMBANG</span>
                  <span className="text-slate-300 truncate block">
                    {selectedLog.developerName || selectedLog.developerId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">MESSAGE ID</span>
                  <span className="text-slate-300 truncate block">{selectedLog.messageId || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">LATENSI PENGIRIMAN</span>
                  <span className="text-slate-300 block">{selectedLog.latencyMs}ms</span>
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300">
                  <span className="font-semibold block mb-0.5">Error Terjadi:</span>
                  <span>{selectedLog.errorMessage}</span>
                </div>
              )}

              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Raw JSON Object:</span>
                <CodeBlock
                  code={JSON.stringify(selectedLog, null, 2)}
                  language="json"
                  title="Delivery Record"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
