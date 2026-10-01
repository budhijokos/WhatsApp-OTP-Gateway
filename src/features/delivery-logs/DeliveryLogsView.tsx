import { useState } from 'react';
import { Search, Trash2, RefreshCw, Eye, Download, FileText, CheckCircle2, XCircle, Clock, Filter } from 'lucide-react';
import { DeliveryLog } from '../../types';
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
  const [selectedLog, setSelectedLog] = useState<DeliveryLog | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.otp.includes(searchTerm) ||
      log.appName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.developerId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const handleExportCsv = () => {
    if (logs.length === 0) {
      alert('Tidak ada log untuk diekspor');
      return;
    }

    const headers = ['ID', 'Waktu', 'Nomor Penerima', 'Kode OTP', 'Aplikasi', 'Status', 'Latensi (ms)', 'Developer ID', 'Error'];
    const rows = logs.map((l) => [
      l.id,
      `"${new Date(l.sentAt).toISOString()}"`,
      `"${l.recipient}"`,
      `"${l.otp}"`,
      `"${l.appName.replace(/"/g, '""')}"`,
      l.status,
      l.latencyMs,
      `"${l.developerId}"`,
      `"${(l.errorMessage || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `whatsapp_otp_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    if (logs.length === 0) {
      alert('Tidak ada log untuk diekspor');
      return;
    }

    const jsonContent = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `whatsapp_otp_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusCounts = {
    all: logs.length,
    sent: logs.filter((l) => l.status === 'sent' || l.status === 'delivered').length,
    failed: logs.filter((l) => l.status === 'failed').length,
    pending: logs.filter((l) => l.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
            disabled={logs.length === 0}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1.5"
            title="Unduh file format CSV"
          >
            <Download className="h-3 w-3 text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handleExportJson}
            disabled={logs.length === 0}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1.5"
            title="Unduh file format JSON"
          >
            <FileText className="h-3 w-3 text-sky-400" />
            <span>Ekspor JSON</span>
          </button>
          <button
            onClick={onRefresh}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Segarkan</span>
          </button>
          <button
            onClick={handleClearLogs}
            disabled={isClearing || logs.length === 0}
            className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-rose-950/40 border border-rose-800/40 text-rose-300 hover:bg-rose-900/40 disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="h-3 w-3" />
            <span>Bersihkan Log</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Segmented Status Filters */}
        <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua ({statusCounts.all})
          </button>
          <button
            onClick={() => setStatusFilter('sent')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'sent'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Terkirim ({statusCounts.sent})
          </button>
          <button
            onClick={() => setStatusFilter('failed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'failed'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gagal ({statusCounts.failed})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending ({statusCounts.pending})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor, OTP, aplikasi..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            {logs.length === 0
              ? 'Belum ada catatan pengiriman OTP pada sistem.'
              : 'Tidak ada log yang sesuai dengan filter pencarian.'}
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
                  <th className="py-3 px-4">Pengembang / Client</th>
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
                      {log.maskedRecipient}
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
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] truncate max-w-[150px]">
                      {log.developerName || log.developerId}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400 tabular-nums whitespace-nowrap">
                      {log.latencyMs}ms
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
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
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Tutup
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono">
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
                  <span className="text-slate-500 block text-[10px]">MESSAGE ID</span>
                  <span className="text-slate-300 truncate block">{selectedLog.messageId || '-'}</span>
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
