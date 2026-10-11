import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Radio,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Key,
  Copy,
  Check,
  Code,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Zap,
  Terminal,
  Server,
  Layers,
  ShoppingBag,
  PackageCheck,
  Truck,
  CreditCard,
  ShoppingCart,
  FileJson,
  X,
  History,
  Trash2,
  Play,
  Search,
  Filter,
  ArrowRight,
  Maximize2,
  CheckCheck,
} from 'lucide-react';
import {
  WebhookSimulationPreset,
  WebhookSimulationRequest,
  WebhookSimulationResponse,
} from '../../types';
import { api } from '../../services/api';

export interface WebhookHistoryItem {
  id: string;
  timestamp: string;
  createdAt: number;
  event: string;
  targetUrl: string;
  payload: Record<string, unknown>;
  payloadString: string;
  signatureSecret?: string;
  enableSignature: boolean;
  customHeaderKey?: string;
  customHeaderVal?: string;
  timeoutSeconds: number;
  orderId?: string;
  customerName?: string;
  amountSummary?: string;
  statusCode?: number;
  statusText?: string;
  latencyMs?: number;
  success?: boolean;
}

const STORAGE_KEY = 'wa_webhook_simulator_history_v1';

// Initial pre-seeded history so developers have ready-to-test examples immediately
const INITIAL_SEED_HISTORY: WebhookHistoryItem[] = [
  {
    id: 'seed_order_paid_01',
    timestamp: 'Baru saja',
    createdAt: Date.now() - 45000,
    event: 'order_paid',
    targetUrl: 'https://webhook.site/demo-whatsapp-webhook',
    payload: {
      event: 'order_paid',
      eventId: 'evt_paid_881923',
      timestamp: new Date().toISOString(),
      data: {
        orderId: 'INV-20261010-891',
        customer: {
          name: 'Budi Pratama',
          phone: '+6281234567890',
          email: 'budi.pratama@example.com',
        },
        store: {
          name: 'Toko Berkah Mandiri',
          storeId: 'store_jkt_01',
        },
        payment: {
          method: 'QRIS BCA',
          amount: 285000,
          currency: 'IDR',
          status: 'PAID',
          transactionReference: 'TRX-QRIS-9921471',
        },
        items: [
          { sku: 'KB-WL-01', name: 'Keyboard Wireless RGB Ergonomis', quantity: 1, price: 250000 },
          { sku: 'MP-XL-02', name: 'Mousepad XL Waterproof', quantity: 1, price: 35000 },
        ],
        shipping: {
          recipientName: 'Budi Pratama',
          address: 'Jl. Sudirman No. 45, Kebayoran Baru, Jakarta Selatan',
          courier: 'J&T Express Regular',
        },
      },
    },
    payloadString: JSON.stringify(
      {
        event: 'order_paid',
        eventId: 'evt_paid_881923',
        timestamp: new Date().toISOString(),
        data: {
          orderId: 'INV-20261010-891',
          customer: {
            name: 'Budi Pratama',
            phone: '+6281234567890',
            email: 'budi.pratama@example.com',
          },
          store: {
            name: 'Toko Berkah Mandiri',
            storeId: 'store_jkt_01',
          },
          payment: {
            method: 'QRIS BCA',
            amount: 285000,
            currency: 'IDR',
            status: 'PAID',
            transactionReference: 'TRX-QRIS-9921471',
          },
          items: [
            { sku: 'KB-WL-01', name: 'Keyboard Wireless RGB Ergonomis', quantity: 1, price: 250000 },
            { sku: 'MP-XL-02', name: 'Mousepad XL Waterproof', quantity: 1, price: 35000 },
          ],
          shipping: {
            recipientName: 'Budi Pratama',
            address: 'Jl. Sudirman No. 45, Kebayoran Baru, Jakarta Selatan',
            courier: 'J&T Express Regular',
          },
        },
      },
      null,
      2
    ),
    signatureSecret: 'whsec_my_ecommerce_store_secret_2026',
    enableSignature: true,
    customHeaderKey: 'X-Store-ID',
    customHeaderVal: 'store_indonesia_01',
    timeoutSeconds: 8,
    orderId: 'INV-20261010-891',
    customerName: 'Budi Pratama',
    amountSummary: 'Rp 285.000',
    statusCode: 200,
    statusText: 'OK',
    latencyMs: 142,
    success: true,
  },
  {
    id: 'seed_order_shipped_02',
    timestamp: '5 menit lalu',
    createdAt: Date.now() - 300000,
    event: 'order_shipped',
    targetUrl: 'https://webhook.site/demo-whatsapp-webhook',
    payload: {
      event: 'order_shipped',
      eventId: 'evt_ship_471920',
      timestamp: new Date().toISOString(),
      data: {
        orderId: 'INV-20261010-772',
        customer: {
          name: 'Siti Rahma',
          phone: '+6285712345678',
        },
        store: {
          name: 'Fashion Store ID',
        },
        shipping: {
          courier: 'J&T Express',
          service: 'EZ Regular',
          trackingNumber: 'JT9823419082ID',
          trackingUrl: 'https://jet.co.id/track?awb=JT9823419082ID',
          estimateDays: '2-3 Hari Kerja',
          deliveryAddress: 'Jl. Thamrin No. 12, Menteng, Jakarta Pusat',
        },
        itemsSummary: '2x Kemeja Flanel Oversize (Sage Green, Navy)',
      },
    },
    payloadString: JSON.stringify(
      {
        event: 'order_shipped',
        eventId: 'evt_ship_471920',
        timestamp: new Date().toISOString(),
        data: {
          orderId: 'INV-20261010-772',
          customer: {
            name: 'Siti Rahma',
            phone: '+6285712345678',
          },
          store: {
            name: 'Fashion Store ID',
          },
          shipping: {
            courier: 'J&T Express',
            service: 'EZ Regular',
            trackingNumber: 'JT9823419082ID',
            trackingUrl: 'https://jet.co.id/track?awb=JT9823419082ID',
            estimateDays: '2-3 Hari Kerja',
            deliveryAddress: 'Jl. Thamrin No. 12, Menteng, Jakarta Pusat',
          },
          itemsSummary: '2x Kemeja Flanel Oversize (Sage Green, Navy)',
        },
      },
      null,
      2
    ),
    signatureSecret: 'whsec_my_ecommerce_store_secret_2026',
    enableSignature: true,
    customHeaderKey: 'X-Store-ID',
    customHeaderVal: 'store_indonesia_01',
    timeoutSeconds: 8,
    orderId: 'INV-20261010-772',
    customerName: 'Siti Rahma',
    amountSummary: 'J&T #JT9823419082ID',
    statusCode: 200,
    statusText: 'OK',
    latencyMs: 98,
    success: true,
  },
];

function extractPayloadSummary(payload: any) {
  const d = payload?.data || payload;
  const orderId = d?.orderId || d?.id || payload?.orderId || '-';
  const customerName = d?.customer?.name || d?.customerName || d?.name || '-';
  const amountSummary =
    d?.payment?.amount
      ? `Rp ${Number(d.payment.amount).toLocaleString('id-ID')}`
      : d?.shipping?.trackingNumber
      ? `${d?.shipping?.courier || 'Resi'}: ${d?.shipping?.trackingNumber}`
      : d?.totalAmount || d?.cartTotal || '';
  return { orderId, customerName, amountSummary };
}

interface WebhookSimulatorViewProps {
  onNavigateToEcommerce?: () => void;
}

export function WebhookSimulatorView({ onNavigateToEcommerce }: WebhookSimulatorViewProps) {
  const [presets, setPresets] = useState<WebhookSimulationPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('order_paid');
  const [targetUrl, setTargetUrl] = useState<string>('https://webhook.site/demo-whatsapp-webhook');
  const [payloadText, setPayloadText] = useState<string>('');
  const [signatureSecret, setSignatureSecret] = useState<string>('whsec_my_ecommerce_store_secret_2026');
  const [enableSignature, setEnableSignature] = useState<boolean>(true);
  const [customHeaderKey, setCustomHeaderKey] = useState<string>('X-Store-ID');
  const [customHeaderVal, setCustomHeaderVal] = useState<string>('store_indonesia_01');
  const [timeoutSeconds, setTimeoutSeconds] = useState<number>(8);

  // Local State History with LocalStorage Persistence
  const [historyItems, setHistoryItems] = useState<WebhookHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage:', e);
    }
    return INITIAL_SEED_HISTORY;
  });

  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyEventFilter, setHistoryEventFilter] = useState<string>('all');
  const [isResendingId, setIsResendingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Execution state
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<WebhookSimulationResponse | null>(null);
  const [activeTabInspector, setActiveTabInspector] = useState<'response' | 'headers' | 'request' | 'curl'>('response');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Save history updates to localStorage
  const updateHistory = (newItems: WebhookHistoryItem[]) => {
    setHistoryItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems.slice(0, 30)));
    } catch (e) {
      console.warn('Failed to persist webhook history to localStorage:', e);
    }
  };

  // Load presets from backend
  useEffect(() => {
    async function loadPresets() {
      try {
        const res = await api.getWebhookPresets();
        if (res.success && res.presets.length > 0) {
          setPresets(res.presets);
          const initial = res.presets.find((p) => p.id === 'order_paid') || res.presets[0];
          setSelectedPresetId(initial.id);
          setPayloadText(JSON.stringify(initial.defaultPayload, null, 2));
        }
      } catch (err) {
        console.warn('Failed to load webhook simulator presets:', err);
      }
    }
    loadPresets();
  }, []);

  // When changing preset, update the payload
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setActiveHistoryId(null);
    const found = presets.find((p) => p.id === presetId);
    if (found) {
      setPayloadText(JSON.stringify(found.defaultPayload, null, 2));
      setJsonError(null);
    }
  };

  // Prettify JSON
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(payloadText);
      setPayloadText(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON';
      setJsonError(msg);
    }
  };

  // Show transient toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. RE-SELECT: Load saved history item into form without sending
  const handleSelectHistoryItem = (item: WebhookHistoryItem) => {
    setSelectedPresetId(item.event);
    setTargetUrl(item.targetUrl);
    setPayloadText(item.payloadString);
    setEnableSignature(item.enableSignature);
    setSignatureSecret(item.signatureSecret || 'whsec_my_ecommerce_store_secret_2026');
    setCustomHeaderKey(item.customHeaderKey || 'X-Store-ID');
    setCustomHeaderVal(item.customHeaderVal || 'store_indonesia_01');
    setTimeoutSeconds(item.timeoutSeconds || 8);
    setActiveHistoryId(item.id);
    setJsonError(null);

    showToast(`Payload [${item.event}] ${item.orderId ? `(${item.orderId})` : ''} berhasil dimuat ke editor!`);
  };

  // Execute internal dispatch
  const executeSimulation = async (
    target: string,
    event: string,
    payloadObj: Record<string, unknown>,
    secSecret?: string,
    sigEnabled?: boolean,
    hKey?: string,
    hVal?: string,
    timeoutSec?: number,
    historyItemIdToUpdate?: string
  ): Promise<WebhookSimulationResponse | null> => {
    const customHeaders: Record<string, string> = {};
    if (hKey && hVal) {
      customHeaders[hKey] = hVal;
    }

    const req: WebhookSimulationRequest = {
      targetUrl: target,
      event,
      payload: payloadObj,
      customHeaders: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
      signatureSecret: sigEnabled ? secSecret : undefined,
      timeoutMs: (timeoutSec || 8) * 1000,
    };

    const res = await api.sendWebhookSimulation(req);
    if (!res.data) return null;

    const data = res.data;
    setLastResult(data);

    const { orderId, customerName, amountSummary } = extractPayloadSummary(payloadObj);
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (historyItemIdToUpdate) {
      // Update existing item in place and move to front
      const updated = historyItems.map((h) => {
        if (h.id === historyItemIdToUpdate) {
          return {
            ...h,
            timestamp: nowTime,
            createdAt: Date.now(),
            statusCode: data.statusCode,
            statusText: data.statusText,
            latencyMs: data.latencyMs,
            success: data.success,
          };
        }
        return h;
      });
      // Bring updated item to top
      const targetItem = updated.find((h) => h.id === historyItemIdToUpdate);
      const rest = updated.filter((h) => h.id !== historyItemIdToUpdate);
      if (targetItem) {
        updateHistory([targetItem, ...rest]);
      } else {
        updateHistory(updated);
      }
    } else {
      // Prepend new history record
      const newRecord: WebhookHistoryItem = {
        id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        timestamp: nowTime,
        createdAt: Date.now(),
        event,
        targetUrl: target,
        payload: payloadObj,
        payloadString: JSON.stringify(payloadObj, null, 2),
        signatureSecret: secSecret,
        enableSignature: !!sigEnabled,
        customHeaderKey: hKey,
        customHeaderVal: hVal,
        timeoutSeconds: timeoutSec || 8,
        orderId,
        customerName,
        amountSummary,
        statusCode: data.statusCode,
        statusText: data.statusText,
        latencyMs: data.latencyMs,
        success: data.success,
      };
      updateHistory([newRecord, ...historyItems.slice(0, 24)]);
      setActiveHistoryId(newRecord.id);
    }

    return data;
  };

  // 2. RE-SEND: Instant 1-click re-send directly from history card without re-typing
  const handleResendHistoryItem = async (item: WebhookHistoryItem) => {
    // Sync editor form to match
    handleSelectHistoryItem(item);

    setIsResendingId(item.id);
    setIsSending(true);
    setJsonError(null);
    try {
      const result = await executeSimulation(
        item.targetUrl,
        item.event,
        item.payload,
        item.signatureSecret,
        item.enableSignature,
        item.customHeaderKey,
        item.customHeaderVal,
        item.timeoutSeconds,
        item.id
      );

      if (result) {
        showToast(
          result.success
            ? `Kirim ulang sukses! HTTP ${result.statusCode} (${result.latencyMs}ms)`
            : `Kirim ulang selesai dengan respons HTTP ${result.statusCode} (${result.statusText})`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim ulang';
      setJsonError(`Gagal mengirim ulang: ${msg}`);
      showToast(`Gagal mengirim ulang: ${msg}`);
    } finally {
      setIsResendingId(null);
      setIsSending(false);
    }
  };

  // Dispatch Webhook Simulation from Main Form Button
  const handleSendWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl) return;

    let parsedPayload: Record<string, unknown>;
    try {
      parsedPayload = JSON.parse(payloadText);
      setJsonError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON';
      setJsonError(`Format JSON tidak valid: ${msg}`);
      return;
    }

    setIsSending(true);
    try {
      const result = await executeSimulation(
        targetUrl,
        selectedPresetId,
        parsedPayload,
        signatureSecret,
        enableSignature,
        customHeaderKey,
        customHeaderVal,
        timeoutSeconds
      );

      if (result) {
        showToast(
          result.success
            ? `Berhasil terkirim! HTTP ${result.statusCode} (${result.latencyMs}ms)`
            : `Selesai: HTTP ${result.statusCode} ${result.statusText}`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim simulasi';
      setJsonError(`Gagal menghubungi simulator server: ${msg}`);
      showToast(`Gagal: ${msg}`);
    } finally {
      setIsSending(false);
    }
  };

  // Delete single history item
  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = historyItems.filter((h) => h.id !== id);
    updateHistory(updated);
    if (activeHistoryId === id) {
      setActiveHistoryId(null);
    }
    showToast('Item riwayat dihapus.');
  };

  // Clear all history
  const handleClearAllHistory = () => {
    updateHistory([]);
    setActiveHistoryId(null);
    showToast('Semua riwayat pengujian berhasil dibersihkan.');
  };

  // Filtered history list
  const filteredHistory = useMemo(() => {
    return historyItems.filter((item) => {
      const matchesEvent = historyEventFilter === 'all' || item.event === historyEventFilter;
      if (!matchesEvent) return false;

      if (!historySearchQuery.trim()) return true;
      const q = historySearchQuery.toLowerCase();
      const matchOrder = item.orderId?.toLowerCase().includes(q);
      const matchCust = item.customerName?.toLowerCase().includes(q);
      const matchUrl = item.targetUrl.toLowerCase().includes(q);
      const matchEvt = item.event.toLowerCase().includes(q);
      return matchOrder || matchCust || matchUrl || matchEvt;
    });
  }, [historyItems, historySearchQuery, historyEventFilter]);

  // Generate equivalent cURL
  const generateCurl = (): string => {
    let curl = `curl -X POST "${targetUrl}" \\\n  -H "Content-Type: application/json" \\\n  -H "User-Agent: WhatsApp-OTP-Gateway-Webhook-Simulator/2.0" \\\n  -H "X-Event: ${selectedPresetId}" \\\n  -H "X-Delivery-ID: sim_${Date.now()}"`;

    if (customHeaderKey && customHeaderVal) {
      curl += ` \\\n  -H "${customHeaderKey}: ${customHeaderVal}"`;
    }

    if (enableSignature && lastResult?.signatureHeader) {
      curl += ` \\\n  -H "X-Signature-SHA256: ${lastResult.signatureHeader}"`;
    } else if (enableSignature && signatureSecret) {
      curl += ` \\\n  -H "X-Signature-SHA256: sha256_hmac_here"`;
    }

    const compactJson = payloadText.replace(/"/g, '\\"').replace(/\n/g, '');
    curl += ` \\\n  -d "${compactJson}"`;

    return curl;
  };

  const copyCurlToClipboard = () => {
    navigator.clipboard.writeText(generateCurl());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const copyResponseToClipboard = () => {
    if (!lastResult) return;
    navigator.clipboard.writeText(lastResult.response.body);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const getPresetIcon = (id: string) => {
    switch (id) {
      case 'order_paid':
        return <CreditCard className="h-4 w-4 text-emerald-400" />;
      case 'order_shipped':
        return <Truck className="h-4 w-4 text-sky-400" />;
      case 'order_created':
        return <ShoppingBag className="h-4 w-4 text-amber-400" />;
      case 'order_delivered':
        return <PackageCheck className="h-4 w-4 text-purple-400" />;
      case 'abandoned_cart':
        return <ShoppingCart className="h-4 w-4 text-rose-400" />;
      default:
        return <Radio className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-3 rounded-xl bg-slate-900 border border-emerald-500/50 text-emerald-300 text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-linear-to-r from-slate-900 via-slate-900/90 to-slate-950 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
              <span>Developer Test Harness</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-semibold">E-Commerce Webhook Simulator</span>
              <span aria-hidden="true">·</span>
              <span>Local State History</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Simulator Webhook E-Commerce
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Uji ketahanan endpoint webhook backend Anda dengan mengirimkan contoh payload event transaksi nyata (<code className="text-emerald-300 font-mono">order_paid</code>, <code className="text-sky-300 font-mono">order_shipped</code>, dll.). Gunakan <strong>Riwayat Lokal</strong> di bawah untuk memilih kembali dan mengirim ulang payload tanpa mengetik ulang.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            {onNavigateToEcommerce && (
              <button
                onClick={onNavigateToEcommerce}
                className="px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />
                <span>Template E-Commerce</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LOCAL STATE HISTORY: QUICK RE-SELECT & RE-SEND PANEL */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <History className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                  Riwayat Payload Tersimpan (Local State History)
                </h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                  {historyItems.length} Tersimpan
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Klik kartu untuk memuat ulang ke formulir, atau tekan <strong>Kirim Ulang ⚡</strong> untuk eksekusi instan.
              </p>
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari order ID / url..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-950 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={historyEventFilter}
              onChange={(e) => setHistoryEventFilter(e.target.value)}
              className="text-xs bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-300 focus:outline-none cursor-pointer shrink-0"
            >
              <option value="all">Semua Event</option>
              <option value="order_paid">order_paid</option>
              <option value="order_shipped">order_shipped</option>
              <option value="order_created">order_created</option>
              <option value="order_delivered">order_delivered</option>
              <option value="abandoned_cart">abandoned_cart</option>
            </select>

            {historyItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllHistory}
                className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Hapus semua riwayat tersimpan"
              >
                Bersihkan
              </button>
            )}
          </div>
        </div>

        {/* History Cards - Horizontal scrollable or wrap grid */}
        {filteredHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {filteredHistory.map((item) => {
              const isActive = activeHistoryId === item.id;
              const isResending = isResendingId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectHistoryItem(item)}
                  className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 group ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-950/25 ring-1 ring-emerald-500/50 shadow-xs'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  {/* Top Bar: Event & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {getPresetIcon(item.event)}
                      <span className="font-mono text-xs font-bold text-white truncate">
                        {item.event}
                      </span>
                      {isActive && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-900/90 text-emerald-300 border border-emerald-700 shrink-0">
                          Aktif di Editor
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.statusCode !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-bold ${
                            item.success
                              ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                              : 'bg-rose-950 border border-rose-800 text-rose-300'
                          }`}
                        >
                          HTTP {item.statusCode}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors opacity-60 group-hover:opacity-100"
                        title="Hapus dari riwayat"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Summary Details */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="font-semibold truncate text-white">
                        {item.orderId || item.customerName || 'Test Payload'}
                      </span>
                      {item.amountSummary && (
                        <span className="font-mono text-[11px] text-emerald-400 shrink-0">
                          {item.amountSummary}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span className="truncate max-w-[170px]" title={item.targetUrl}>
                        {item.targetUrl.replace(/^https?:\/\//, '')}
                      </span>
                      <span className="shrink-0">{item.timestamp}</span>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">
                      {isActive ? '✓ Terpilih di formulir' : 'Klik untuk muat'}
                    </span>

                    <button
                      type="button"
                      disabled={isSending}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResendHistoryItem(item);
                      }}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                      title="Kirim ulang payload ini ke endpoint backend"
                    >
                      {isResending ? (
                        <>
                          <Zap className="h-3 w-3 animate-spin" />
                          <span>Mengirim...</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-2.5 w-2.5 fill-current" />
                          <span>Kirim Ulang ⚡</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800/80 text-center text-slate-500 text-xs">
            Tidak ada riwayat pengujian yang cocok dengan kata kunci pencarian.
          </div>
        )}
      </div>

      {/* Preset Event Selector Pills */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 block">
          Pilih Template Event Preset Bawaan:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id && !activeHistoryId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-emerald-500/80 bg-emerald-950/30 text-white shadow-xs'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  {getPresetIcon(preset.id)}
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                      isSelected
                        ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700/60'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {preset.badge}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold truncate text-slate-200">{preset.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                    {preset.event}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Config Form & Right Live Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Payload Editor (7 cols) */}
        <form onSubmit={handleSendWebhook} className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-4">
            {/* Target URL Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Radio className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Target Endpoint Webhook URL Backend Anda</span>
                </label>
                <button
                  type="button"
                  onClick={() => setTargetUrl('https://webhook.site/demo-whatsapp-webhook')}
                  className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                  title="Gunakan URL pengujian public"
                >
                  Gunakan Webhook.site demo
                </button>
              </div>

              <div className="relative">
                <input
                  type="url"
                  required
                  placeholder="https://api.domain-anda.com/api/webhooks/whatsapp"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Server gateway kami akan mengirimkan HTTP POST dengan body JSON ke URL di atas.
              </p>
            </div>

            {/* Payload Editor Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileJson className="h-3.5 w-3.5 text-sky-400" />
                    <span>Payload JSON Event</span>
                  </label>
                  {activeHistoryId && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-1.5 py-0.2 rounded font-mono">
                      (Dimuat dari Riwayat Lokal)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFormatJson}
                    className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3 text-sky-400" />
                    <span>Rapikan (Format)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(selectedPresetId)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset Preset</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={13}
                value={payloadText}
                onChange={(e) => {
                  setPayloadText(e.target.value);
                  setJsonError(null);
                }}
                className="w-full p-3 font-mono text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed selection:bg-emerald-500/30"
              />

              {jsonError && (
                <div className="mt-2 p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}
            </div>

            {/* Advanced Settings: HMAC Signature & Headers */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableSig"
                    checked={enableSignature}
                    onChange={(e) => setEnableSignature(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="enableSig" className="text-xs font-semibold text-slate-300 cursor-pointer flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                    <span>Hitung Signature HMAC SHA-256 (Keamanan Enterprise)</span>
                  </label>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">X-Signature-SHA256</span>
              </div>

              {enableSignature && (
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <label className="text-[11px] font-medium text-slate-400 block">
                    Secret Key Verifikasi Webhook:
                  </label>
                  <input
                    type="text"
                    value={signatureSecret}
                    onChange={(e) => setSignatureSecret(e.target.value)}
                    placeholder="whsec_xxxxxxxxxxxx"
                    className="w-full px-3 py-1.5 text-xs font-mono rounded bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Gateway akan otomatis menghasilkan header <code className="font-mono text-purple-300">X-Signature-SHA256: sha256=...</code> untuk mencegah spoofing request.
                  </p>
                </div>
              )}

              {/* Custom Headers & Timeout */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Header Tambahan (Key):</label>
                  <input
                    type="text"
                    value={customHeaderKey}
                    onChange={(e) => setCustomHeaderKey(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded bg-slate-950 border border-slate-700 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Header Tambahan (Value):</label>
                  <input
                    type="text"
                    value={customHeaderVal}
                    onChange={(e) => setCustomHeaderVal(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded bg-slate-950 border border-slate-700 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Batas Timeout:</label>
                  <select
                    value={timeoutSeconds}
                    onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-slate-950 border border-slate-700 text-slate-200 cursor-pointer"
                  >
                    <option value={5}>5 Detik</option>
                    <option value={8}>8 Detik (Standar)</option>
                    <option value={12}>12 Detik</option>
                    <option value={15}>15 Detik</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Dispatch Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSending || !targetUrl}
                className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Zap className="h-4 w-4 animate-spin" />
                    <span>Memancarkan Webhook ke Endpoint Anda...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Kirim Webhook Sekarang (Simpan ke Riwayat Lokal)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Right Column: Live Response & Diagnostics Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 flex flex-col h-full min-h-[480px]">
            {/* Inspector Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  Hasil Respons Endpoint
                </h3>
              </div>

              {lastResult && (
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                      lastResult.success
                        ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                        : lastResult.statusCode >= 500 || lastResult.statusCode === 0
                        ? 'bg-rose-950 border border-rose-800 text-rose-300'
                        : 'bg-amber-950 border border-amber-800 text-amber-300'
                    }`}
                  >
                    HTTP {lastResult.statusCode} {lastResult.statusText}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {lastResult.latencyMs}ms
                  </span>
                </div>
              )}
            </div>

            {/* Inspector Tabs */}
            {lastResult ? (
              <div className="mt-3 flex-1 flex flex-col space-y-3">
                {/* Diagnostic Banner */}
                <div
                  className={`p-3 rounded-lg border text-xs leading-relaxed ${
                    lastResult.success
                      ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {lastResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold block text-white">Diagnostik Endpoint:</span>
                      <span>{lastResult.diagnosis}</span>
                    </div>
                  </div>
                </div>

                {/* Subtabs: Response / Headers / Request / cURL */}
                <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTabInspector('response')}
                    className={`flex-1 py-1 px-2 rounded font-medium transition-colors cursor-pointer truncate ${
                      activeTabInspector === 'response'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Body Response
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabInspector('headers')}
                    className={`flex-1 py-1 px-2 rounded font-medium transition-colors cursor-pointer truncate ${
                      activeTabInspector === 'headers'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Headers
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabInspector('request')}
                    className={`flex-1 py-1 px-2 rounded font-medium transition-colors cursor-pointer truncate ${
                      activeTabInspector === 'request'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Headers Dikirim
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTabInspector('curl')}
                    className={`flex-1 py-1 px-2 rounded font-medium transition-colors cursor-pointer truncate ${
                      activeTabInspector === 'curl'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    cURL
                  </button>
                </div>

                {/* Tab Content Display */}
                <div className="relative flex-1 min-h-[220px] rounded-lg bg-slate-950 border border-slate-800 p-3 overflow-y-auto font-mono text-xs text-slate-300">
                  {activeTabInspector === 'response' && (
                    <>
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-850 text-[11px] text-slate-500">
                        <span>Format: {lastResult.response.isJson ? 'JSON' : 'Raw Text'}</span>
                        <button
                          type="button"
                          onClick={copyResponseToClipboard}
                          className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {copiedResponse ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedResponse ? 'Tersalin' : 'Salin Body'}</span>
                        </button>
                      </div>
                      <pre className="whitespace-pre-wrap break-all leading-relaxed">
                        {lastResult.response.isJson
                          ? JSON.stringify(lastResult.response.jsonBody, null, 2)
                          : lastResult.response.body || '(Tidak ada body konten yang dikembalikan server)'}
                      </pre>
                    </>
                  )}

                  {activeTabInspector === 'headers' && (
                    <div className="space-y-1">
                      {Object.keys(lastResult.response.headers).length > 0 ? (
                        Object.entries(lastResult.response.headers).map(([key, val]) => (
                          <div key={key} className="flex justify-between gap-2 text-[11px] border-b border-slate-900 pb-1">
                            <span className="text-slate-400">{key}:</span>
                            <span className="text-slate-200 truncate">{val}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 italic text-center py-4">
                          Tidak ada response headers yang tersedia.
                        </p>
                      )}
                    </div>
                  )}

                  {activeTabInspector === 'request' && (
                    <div className="space-y-1">
                      {Object.entries(lastResult.request.headers).map(([key, val]) => (
                        <div key={key} className="flex justify-between gap-2 text-[11px] border-b border-slate-900 pb-1">
                          <span className="text-emerald-400">{key}:</span>
                          <span className="text-slate-200 truncate">{val}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTabInspector === 'curl' && (
                    <div className="space-y-2">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={copyCurlToClipboard}
                          className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCurl ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedCurl ? 'cURL Tersalin!' : 'Salin Perintah cURL'}</span>
                        </button>
                      </div>
                      <pre className="text-[11px] text-slate-300 whitespace-pre-wrap break-all leading-relaxed">
                        {generateCurl()}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                <Radio className="h-10 w-10 text-slate-700 animate-pulse" />
                <h4 className="text-xs font-semibold text-slate-400">Belum Ada Hasil Uji Webhook</h4>
                <p className="text-[11px] max-w-xs leading-relaxed">
                  Pilih salah satu <strong>Riwayat Payload</strong> di atas atau masukkan URL endpoint backend Anda dan klik <strong>"Kirim Webhook Sekarang"</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
