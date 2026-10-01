import { useState } from 'react';
import { X, QrCode, Phone, RefreshCw, Trash2, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
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
    } catch (err: any) {
      setActionMessage(`Error: ${err.message || 'Gagal membuat kode'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    setLoading(true);
    try {
      await api.reconnect();
      setActionMessage('Rekoneksi socket dipicu...');
      onRefresh();
    } catch (err: any) {
      setActionMessage(`Gagal rekoneksi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSession = async () => {
    if (!confirm('Yakin ingin mereset sesi WhatsApp? Kredensial lokal akan dihapus dan Anda perlu memindai QR code baru.')) {
      return;
    }
    setLoading(true);
    try {
      await api.resetSession();
      setPairingCode(null);
      setActionMessage('Sesi berhasil di-reset. Mengambil QR Code baru...');
      onRefresh();
    } catch (err: any) {
      setActionMessage(`Gagal reset sesi: ${err.message}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-6 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Tautkan Perangkat WhatsApp</h2>
            <p className="text-xs text-slate-400 mt-0.5">WhiskeySockets Baileys Device Connector</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status Banner */}
        <div className="mt-4 p-3 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isConnected ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : waState.status === 'qr_ready' ? (
              <QrCode className="h-4 w-4 text-amber-400" />
            ) : (
              <RefreshCw className="h-4 w-4 text-sky-400 animate-spin" />
            )}
            <div className="text-xs">
              <span className="font-semibold text-white">Status: </span>
              <span className={isConnected ? 'text-emerald-400 font-medium' : 'text-amber-300 font-medium'}>
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
            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>

        {/* Tab Controls (Segmented Control) */}
        {!isConnected && (
          <div className="mt-4 flex p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setTab('qr')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                tab === 'qr' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Pindai QR Code</span>
            </button>
            <button
              onClick={() => setTab('code')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                tab === 'code' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Kode Pairing 8 Karakter</span>
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="mt-4">
          {isConnected ? (
            <div className="text-center py-6">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">WhatsApp Siap Digunakan</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Nomor <span className="font-mono text-emerald-300">+{waState.phone}</span> aktif dan siap mengirim OTP melalui endpoint REST API.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <button
                  onClick={handleResetSession}
                  disabled={loading}
                  className="px-3.5 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg hover:bg-rose-900/50 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Keluarkan & Reset Sesi</span>
                </button>
              </div>
            </div>
          ) : tab === 'qr' ? (
            <div className="flex flex-col items-center justify-center py-2">
              {waState.qrDataUrl ? (
                <div className="p-3 bg-white rounded-xl shadow-lg border-2 border-slate-700">
                  <img
                    src={waState.qrDataUrl}
                    alt="WhatsApp QR Code"
                    className="w-56 h-56 object-contain"
                  />
                </div>
              ) : (
                <div className="w-56 h-56 rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
                  <RefreshCw className="h-7 w-7 text-sky-400 animate-spin mb-2" />
                  <p className="text-xs text-slate-400">Sedang mengenerate QR Code dari Baileys socket...</p>
                </div>
              )}

              <ol className="mt-4 text-xs text-slate-400 space-y-1 max-w-sm text-left list-decimal list-inside">
                <li>Buka aplikasi WhatsApp di ponsel Anda.</li>
                <li>Buka <strong className="text-slate-200">Pengaturan / Menu (⋮)</strong> &gt; <strong className="text-slate-200">Perangkat Tertaut</strong>.</li>
                <li>Ketuk <strong className="text-slate-200">Tautkan Perangkat</strong> dan arahkan kamera ke QR Code di atas.</li>
              </ol>
            </div>
          ) : (
            <div className="py-2">
              <form onSubmit={handleGetPairingCode} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nomor WhatsApp Server (Ponsel Pengirim)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="081234567890 atau 6281234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={loading || !phoneNumber}
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {loading ? 'Meminta...' : 'Minta Kode'}
                    </button>
                  </div>
                </div>
              </form>

              {pairingCode && (
                <div className="mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-center">
                  <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold block mb-1">
                    Kode Pairing Anda
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-2xl font-bold tracking-widest text-white">
                      {pairingCode}
                    </span>
                    <button
                      onClick={copyCodeToClipboard}
                      className="p-1.5 rounded hover:bg-emerald-900/50 text-emerald-300 transition-colors"
                      title="Salin Kode"
                    >
                      {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Buka WhatsApp &gt; Perangkat Tertaut &gt; Tautkan Perangkat &gt; <em>Tautkan dengan nomor telepon saja</em> &gt; Masukkan kode di atas.
                  </p>
                </div>
              )}
            </div>
          )}

          {actionMessage && (
            <div className="mt-4 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-sky-400 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>Multi-device Web Socket v2</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
