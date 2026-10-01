import { useState } from 'react';
import { AlertCircle, Trash2, RefreshCw, ChevronDown, ChevronRight, HelpCircle, ShieldAlert, WifiOff, FileWarning, Clock } from 'lucide-react';
import { DetailedErrorLog, ErrorCategory } from '../../types';
import { api } from '../../services/api';
import { CodeBlock } from '../../components/CodeBlock';

interface ErrorLogsViewProps {
  errors: DetailedErrorLog[];
  onRefresh: () => void;
}

export function ErrorLogsView({ errors, onRefresh }: ErrorLogsViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isClearing, setIsClearing] = useState(false);

  const filteredErrors = errors.filter((err) => {
    return categoryFilter === 'all' || err.category === categoryFilter;
  });

  const handleClearErrors = async () => {
    if (!confirm('Hapus semua log error debug saat ini?')) return;
    setIsClearing(true);
    try {
      await api.clearErrorLogs();
      onRefresh();
    } finally {
      setIsClearing(false);
    }
  };

  const getCategoryIcon = (category: ErrorCategory) => {
    switch (category) {
      case 'auth':
        return <ShieldAlert className="h-4 w-4 text-amber-400" />;
      case 'socket':
        return <WifiOff className="h-4 w-4 text-rose-400" />;
      case 'validation':
        return <FileWarning className="h-4 w-4 text-sky-400" />;
      case 'ratelimit':
        return <Clock className="h-4 w-4 text-amber-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-rose-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Log Error Rinci &amp; Debugging</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Analisis kegagalan socket Baileys, error otentikasi JWT, validasi nomor, dan solusi perbaikan langsung.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Segarkan</span>
          </button>
          <button
            onClick={handleClearErrors}
            disabled={isClearing || errors.length === 0}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-rose-950/40 border border-rose-800/40 text-rose-300 hover:bg-rose-900/40 disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="h-3 w-3" />
            <span>Bersihkan Error</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            categoryFilter === 'all'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Semua Kategori ({errors.length})
        </button>
        <button
          onClick={() => setCategoryFilter('socket')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            categoryFilter === 'socket'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          WhatsApp Socket ({errors.filter((e) => e.category === 'socket').length})
        </button>
        <button
          onClick={() => setCategoryFilter('auth')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            categoryFilter === 'auth'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          JWT / Auth ({errors.filter((e) => e.category === 'auth').length})
        </button>
        <button
          onClick={() => setCategoryFilter('validation')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            categoryFilter === 'validation'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Validasi Request ({errors.filter((e) => e.category === 'validation').length})
        </button>
        <button
          onClick={() => setCategoryFilter('delivery')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            categoryFilter === 'delivery'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Pengiriman ({errors.filter((e) => e.category === 'delivery').length})
        </button>
        <button
          onClick={() => setCategoryFilter('ratelimit')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
            categoryFilter === 'ratelimit'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Rate Limit ({errors.filter((e) => e.category === 'ratelimit').length})
        </button>
      </div>

      {/* Error List */}
      <div className="space-y-3">
        {filteredErrors.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-500">
            Tidak ada error terdeteksi pada kategori ini. Sistem bekerja normal.
          </div>
        ) : (
          filteredErrors.map((err) => {
            const isExpanded = expandedId === err.id;
            return (
              <div
                key={err.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-all"
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : err.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                      {getCategoryIcon(err.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-400">
                          {err.code}
                        </span>
                        <span className="text-[11px] text-slate-500">·</span>
                        <span className="text-xs text-slate-400 uppercase tracking-wider text-[10px]">
                          {err.category}
                        </span>
                      </div>
                      <h3 className="text-xs font-semibold text-white mt-0.5">{err.title}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono text-[11px] tabular-nums whitespace-nowrap">
                      {new Date(err.timestamp).toLocaleTimeString('id-ID')}
                    </span>
                    <button className="text-slate-400">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/70 bg-slate-950/40 space-y-3 text-xs">
                    {/* Suggested Action Box */}
                    <div className="p-3 rounded-lg border border-sky-500/20 bg-sky-950/20 text-sky-200">
                      <div className="flex items-center gap-1.5 font-semibold text-sky-300 mb-1">
                        <HelpCircle className="h-3.5 w-3.5" />
                        <span>Saran Tindakan Perbaikan</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-300">
                        {err.suggestedAction}
                      </p>
                    </div>

                    {/* Technical details */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Rincian Teknis / Stack Trace:
                      </span>
                      <CodeBlock
                        code={err.details}
                        language="json"
                        title="Debugging Payload"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
