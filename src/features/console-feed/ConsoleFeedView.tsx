import { useState, useRef, useEffect } from 'react';
import { Terminal, Trash2, ArrowDown, Filter, RefreshCw } from 'lucide-react';
import { ConsoleLogEntry, LogLevel, LogSource } from '../../types';
import { api } from '../../services/api';

interface ConsoleFeedViewProps {
  logs: ConsoleLogEntry[];
  onRefresh: () => void;
}

export function ConsoleFeedView({ logs, onRefresh }: ConsoleFeedViewProps) {
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter((l) => {
    const matchesSource = sourceFilter === 'all' || l.source === sourceFilter;
    const matchesLevel = levelFilter === 'all' || l.level === levelFilter;
    return matchesSource && matchesLevel;
  });

  // Reverse so oldest at top, newest at bottom inside terminal view
  const displayLogs = [...filteredLogs].reverse();

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayLogs.length, autoScroll]);

  const handleClear = async () => {
    if (!confirm('Bersihkan riwayat konsol server?')) return;
    setIsClearing(true);
    try {
      await api.clearConsoleLogs();
      onRefresh();
    } finally {
      setIsClearing(false);
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return 'text-rose-400 font-semibold';
      case 'warn':
        return 'text-amber-400 font-medium';
      case 'success':
        return 'text-emerald-400 font-medium';
      case 'info':
      default:
        return 'text-sky-300';
    }
  };

  const getSourceBadge = (source: LogSource) => {
    switch (source) {
      case 'whatsapp':
        return 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40';
      case 'hono-api':
        return 'text-indigo-400 bg-indigo-950/60 border border-indigo-800/40';
      case 'auth':
        return 'text-amber-400 bg-amber-950/60 border border-amber-800/40';
      case 'system':
      default:
        return 'text-slate-400 bg-slate-900 border border-slate-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <span>Konsol Live Server (Real-Time Feed)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Log interaktif aktivitas server Hono, pertukaran pesan Baileys, dan siklus otentikasi JWT secara langsung.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 ${
              autoScroll
                ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <ArrowDown className="h-3 w-3" />
            <span>Auto Scroll ({autoScroll ? 'ON' : 'OFF'})</span>
          </button>
          <button
            onClick={handleClear}
            disabled={isClearing || logs.length === 0}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-rose-950/40 border border-rose-800/40 text-rose-300 hover:bg-rose-900/40 disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="h-3 w-3" />
            <span>Bersihkan</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Sumber:</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Sumber ({logs.length})</option>
            <option value="whatsapp">WhatsApp Baileys</option>
            <option value="hono-api">Hono API Routes</option>
            <option value="auth">JWT Auth Middleware</option>
            <option value="system">Sistem</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Tingkat:</span>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Level</option>
            <option value="info">INFO</option>
            <option value="success">SUCCESS</option>
            <option value="warn">WARNING</option>
            <option value="error">ERROR</option>
          </select>
        </div>
      </div>

      {/* Terminal View Container */}
      <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4 font-mono text-xs shadow-2xl h-[560px] overflow-y-auto">
        <div className="space-y-1.5">
          {displayLogs.length === 0 ? (
            <div className="py-20 text-center text-slate-600">
              Tidak ada log konsol yang cocok dengan kriteria filter.
            </div>
          ) : (
            displayLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 hover:bg-slate-900/40 p-1 rounded transition-colors leading-relaxed">
                <span className="text-slate-500 text-[10px] tabular-nums select-none shrink-0 pt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour12: false })}
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-sans font-semibold shrink-0 uppercase ${getSourceBadge(log.source)}`}>
                  {log.source}
                </span>
                <span className={`text-[10px] font-bold uppercase shrink-0 ${getLevelColor(log.level)}`}>
                  [{log.level}]
                </span>
                <span className="text-slate-300 break-all flex-1">
                  {log.message}
                  {log.meta && Object.keys(log.meta).length > 0 && (
                    <span className="ml-2 text-slate-500 text-[10px]">
                      {JSON.stringify(log.meta)}
                    </span>
                  )}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
