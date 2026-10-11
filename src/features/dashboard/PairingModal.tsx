import { useState } from 'react';
import {
  X,
  QrCode,
  Phone,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { WhatsAppState } from '../../types';
import { api } from '../../services/api';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  waState: WhatsAppState;
  onRefresh: () => void;
}

export function PairingModal({ isOpen, onClose, waState, onRefresh }: PairingModalProps) {
  const [tab, setTab] = useState<'qr' | 'code'>('qr');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  if (!isOpen) return null;

  const isConnected = waState.status === 'connected';

  const handleGetPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await api.requestPairCode(phoneNumber);
      setPairingCode(res.pairingCode);
      setActionMessage('Kode berhasil dibuat! Masukkan pada aplikasi WhatsApp ponsel.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat kode pairing';
      setActionMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      await api.reconnect();
      setActionMessage('Perintah rekoneksi socket WhatsApp berhasil dipicu...');
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal rekoneksi';
      setActionMessage(`Gagal rekoneksi: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // Direct reset execution without window.confirm (works inside iframes & mobile)
  const executeResetSession = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      await api.resetSession();
      setPairingCode(null);
      setIsConfirmingReset(false);
      setActionMessage('Sesi WhatsApp berhasil dibersihkan! Sedang memuat QR Code baru...');
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal reset sesi';
      setActionMessage(`Gagal reset sesi: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      {/* Modal Dialog (Flex-Column with max-height and internal scroll for Mobile viewport) */}
      <div className="relative w-full max-w-lg my-auto max-h-[92dvh] flex flex-col rounded-2xl sm:rounded-xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-200 overflow-hidden">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-800 shrink-0 bg-slate-900">
          <div className="min-w-0 pr-2">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              Tautkan Perangkat WhatsApp
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
              WhiskeySockets Baileys Connector
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Tutup modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-3.5 sm:space-y-4 flex-1 overscroll-contain">
          {/* Status Banner */}
          <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {isConnected ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : waState.status === 'qr_ready' ? (
                <QrCode className="h-4 w-4 text-amber-400 shrink-0" />
              ) : (
                <RefreshCw className="h-4 w-4 text-sky-400 animate-spin shrink-0" />
              )}
              <div className="text-xs min-w-0">
                <span className="font-semibold text-white">Status: </span>
                <span
                  className={`truncate block sm:inline ${
                    isConnected ? 'text-emerald-400 font-medium' : 'text-amber-300 font-medium'
                  }`}
                >
                  {isConnected
                    ? `Terhubung (+${waState.phone || 'Nomor'} - ${waState.pushName || 'WhatsApp'})`
                    : waState.status === 'qr_ready'
                    ? 'Menunggu Pindai QR Code'
                    : 'Menyambungkan Socket Baileys...'}
                </span>
              </div>
            </div>

            <button
              onClick={handleReconnect}
              disabled={loading}
              className="text-xs px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto shrink-0 w-full sm:w-auto"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>
          </div>

          {/* Inline Reset Confirmation Dialog (Responsive on Mobile) */}
          {isConfirmingReset && (
            <div className="p-3.5 sm:p-4 rounded-xl border border-rose-800/60 bg-rose-950/40 space-y-2.5 sm:space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white">
                    Konfirmasi Keluar &amp; Reset Sesi WhatsApp
                  </h4>
                  <p className="text-[11px] text-rose-200/80 mt-1 leading-relaxed">
                    Tindakan ini akan memutus socket Baileys dan menghapus folder kredensial lokal (
                    <code className="font-mono text-rose-300">.baileys_auth</code>). Anda harus
                    memindai QR code baru untuk menghubungkan kembali WhatsApp.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(false)}
                  disabled={loading}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors text-center cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeResetSession}
                  disabled={loading}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {loading ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  <span>{loading ? 'Mereset Sesi...' : 'Ya, Keluar & Reset Sekarang'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab Controls (Segmented Control - Mobile friendly) */}
          {!isConnected && !isConfirmingReset && (
            <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800 gap-1">
              <button
                onClick={() => setTab('qr')}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                  tab === 'qr'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <QrCode className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Pindai QR Code</span>
              </button>
              <button
                onClick={() => setTab('code')}
                className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                  tab === 'code'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Kode 8 Karakter</span>
              </button>
            </div>
          )}

          {/* Tab Content Body */}
          {!isConfirmingReset && (
            <div>
              {isConnected ? (
                <div className="text-center py-4 sm:py-5 space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">WhatsApp Siap Digunakan</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Nomor <span className="font-mono text-emerald-300">+{waState.phone}</span> aktif
                      dan siap mengirim OTP serta notifikasi e-commerce.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingReset(true)}
                      disabled={loading}
                      className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-rose-300 bg-rose-950/50 border border-rose-800/60 rounded-lg hover:bg-rose-900/60 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Keluarkan &amp; Reset Sesi</span>
                    </button>
                  </div>
                </div>
              ) : tab === 'qr' ? (
                <div className="flex flex-col items-center justify-center py-1 sm:py-2">
                  {waState.qrDataUrl ? (
                    <div className="p-2.5 sm:p-3 bg-white rounded-xl shadow-lg border-2 border-slate-700 w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center shrink-0">
                      <img
                        src={waState.qrDataUrl}
                        alt="WhatsApp QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center p-4 text-center shrink-0">
                      <RefreshCw className="h-7 w-7 text-sky-400 animate-spin mb-2" />
                      <p className="text-xs text-slate-400">
                        Sedang mengenerate QR Code dari Baileys socket...
                      </p>
                    </div>
                  )}

                  <ol className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-slate-400 space-y-1.5 max-w-sm text-left list-decimal list-inside leading-relaxed">
                    <li>Buka aplikasi WhatsApp di ponsel Anda.</li>
                    <li>
                      Buka <strong className="text-slate-200">Pengaturan / Menu (⋮)</strong> &gt;{' '}
                      <strong className="text-slate-200">Perangkat Tertaut</strong>.
                    </li>
                    <li>
                      Ketuk <strong className="text-slate-200">Tautkan Perangkat</strong> dan arahkan
                      kamera ke QR Code di atas.
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="py-1 sm:py-2 space-y-3">
                  <form onSubmit={handleGetPairingCode} className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Nomor WhatsApp Ponsel Pengirim
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="081234567890 atau 6281234567890"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1 min-w-0 w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="submit"
                          disabled={loading || !phoneNumber}
                          className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              <span>Meminta...</span>
                            </>
                          ) : (
                            <span>Minta Kode</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>

                  {pairingCode && (
                    <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-center animate-in fade-in">
                      <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-emerald-400 font-semibold block mb-1">
                        Kode Pairing Anda
                      </span>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-white">
                          {pairingCode}
                        </span>
                        <button
                          onClick={copyCodeToClipboard}
                          className="p-1.5 rounded hover:bg-emerald-900/50 text-emerald-300 transition-colors cursor-pointer"
                          title="Salin Kode"
                          aria-label="Salin Kode Pairing"
                        >
                          {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                        Buka WhatsApp &gt; Perangkat Tertaut &gt; Tautkan Perangkat &gt;{' '}
                        <em>Tautkan dengan nomor telepon saja</em> &gt; Masukkan kode di atas.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {actionMessage && (
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-sky-400 shrink-0" />
              <span className="min-w-0 break-words">{actionMessage}</span>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0 bg-slate-900">
          <div className="min-w-0 pr-2">
            {!isConnected && !isConfirmingReset && (
              <button
                type="button"
                onClick={() => setIsConfirmingReset(true)}
                className="text-[11px] sm:text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer truncate"
              >
                <Trash2 className="h-3 w-3 shrink-0" />
                <span className="truncate">Bersihkan Kredensial Sesi</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
