import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingBag,
  Send,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Save,
  Check,
  Code,
  Flame,
  CreditCard,
  Package,
  Gift,
  ShieldAlert,
  Sliders,
  Sparkles,
  Eye,
  ChevronDown,
  Layers,
  Radio,
} from 'lucide-react';
import {
  EcommerceEventData,
  EcommerceEventTemplate,
  EcommerceEventType,
  EcommerceTriggerResult,
  WhatsAppState,
} from '../../types';
import { api } from '../../services/api';
import { CodeBlock } from '../../components/CodeBlock';

interface EcommerceNotifierViewProps {
  waState: WhatsAppState;
  onOpenPairing: () => void;
  onNavigateToLogs?: () => void;
  onNavigateToWebhookSimulator?: () => void;
}

export function EcommerceNotifierView({
  waState,
  onOpenPairing,
  onNavigateToLogs,
  onNavigateToWebhookSimulator,
}: EcommerceNotifierViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'templates' | 'simulator' | 'integration'>('templates');
  const [templates, setTemplates] = useState<EcommerceEventTemplate[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<EcommerceEventType>('shipping_dispatched');
  const [activeTemplateText, setActiveTemplateText] = useState<string>('');
  const [activeEnabled, setActiveEnabled] = useState<boolean>(true);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Simulator state
  const [simEvent, setSimEvent] = useState<EcommerceEventType>('shipping_dispatched');
  const [simPhone, setSimPhone] = useState<string>('081234567890');
  const [simData, setSimData] = useState<EcommerceEventData>({
    customerName: 'Budi Santoso',
    storeName: 'Toko Keren Official',
    orderId: 'INV-202610-098',
    courier: 'J&T Express',
    trackingNumber: 'JT9823481230ID',
    trackingUrl: 'https://cekresi.com/?no=JT9823481230ID',
    totalAmount: 'Rp 275.000',
    itemsSummary: '1x Sepatu Sneakers Leather Classic (Size 42)',
    paymentMethod: 'BCA Virtual Account',
    deliveryAddress: 'Jl. Merdeka No. 45, Tebet, Jakarta Selatan 12810',
    estimateDays: '1-2 Hari Kerja',
    discountPromo: 'DISKONHEMAT10',
    checkoutUrl: 'https://tokokeren.com/checkout?order=INV-202610-098',
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<EcommerceTriggerResult | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // Integration tab state
  const [integrationLang, setIntegrationLang] = useState<'curl' | 'nodejs' | 'php' | 'woocommerce'>('curl');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isConnected = waState.status === 'connected';

  // Load templates
  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const res = await api.getEcommerceTemplates();
      if (res.success && res.templates) {
        setTemplates(res.templates);
        const current = res.templates.find((t) => t.id === selectedEventId) || res.templates[0];
        if (current) {
          setSelectedEventId(current.id);
          setActiveTemplateText(current.template);
          setActiveEnabled(current.enabled);
        }
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedEventId);
  }, [templates, selectedEventId]);

  const handleSelectEvent = (id: EcommerceEventType) => {
    setSelectedEventId(id);
    const found = templates.find((t) => t.id === id);
    if (found) {
      setActiveTemplateText(found.template);
      setActiveEnabled(found.enabled);
    }
  };

  const handleSaveTemplate = async () => {
    setIsSaving(true);
    try {
      const res = await api.updateEcommerceTemplate(selectedEventId, {
        template: activeTemplateText,
        enabled: activeEnabled,
      });
      if (res.success) {
        setSaveSuccessMessage(`Template "${res.template.title}" berhasil disimpan!`);
        setTemplates((prev) =>
          prev.map((t) => (t.id === selectedEventId ? res.template : t))
        );
        setTimeout(() => setSaveSuccessMessage(null), 4000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan template';
      setSaveSuccessMessage(`Error: ${msg}`);
      setTimeout(() => setSaveSuccessMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetTemplates = async () => {
    try {
      const res = await api.resetEcommerceTemplates();
      if (res.success) {
        setTemplates(res.templates);
        const current = res.templates.find((t) => t.id === selectedEventId);
        if (current) {
          setActiveTemplateText(current.template);
          setActiveEnabled(current.enabled);
        }
        setSaveSuccessMessage('Semua template e-commerce berhasil direset ke standar awal bawaan sistem.');
        setTimeout(() => setSaveSuccessMessage(null), 5000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mereset template';
      setSaveSuccessMessage(`Error: ${msg}`);
      setTimeout(() => setSaveSuccessMessage(null), 5000);
    }
  };

  const handleInsertVariable = (variableKey: string) => {
    const tag = `{{${variableKey}}}`;
    const textarea = textareaRef.current;
    if (!textarea) {
      setActiveTemplateText((prev) => prev + ' ' + tag);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText =
      activeTemplateText.substring(0, start) + tag + activeTemplateText.substring(end);
    setActiveTemplateText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  // Compile live preview
  const compiledPreview = useMemo(() => {
    if (!selectedTemplate) return '';
    let text = activeTemplateText;
    const sample = selectedTemplate.sampleData;

    const context: Record<string, string> = {
      customerName: sample.customerName || 'Budi Santoso',
      orderId: sample.orderId || 'INV-202610-098',
      storeName: sample.storeName || 'Toko Keren Official',
      itemsSummary: sample.itemsSummary || '2x Kaos Polos Combed 30s',
      totalAmount: sample.totalAmount || 'Rp 175.000',
      paymentMethod: sample.paymentMethod || 'BCA Virtual Account',
      paymentInstruction:
        sample.paymentInstruction || 'Transfer sebelum 24 jam melalui ATM / m-Banking.',
      courier: sample.courier || 'J&T Express',
      trackingNumber: sample.trackingNumber || 'JT9823481230ID',
      trackingUrl: sample.trackingUrl || 'https://cekresi.com/?no=JT9823481230ID',
      deliveryAddress: sample.deliveryAddress || 'Jl. Merdeka No. 45, Jakarta Selatan',
      checkoutUrl: sample.checkoutUrl || 'https://tokokeren.com/checkout',
      discountPromo: sample.discountPromo || 'HEMAT10',
      estimateDays: sample.estimateDays || '1-2 Hari Kerja',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    for (const [k, v] of Object.entries(context)) {
      const reg = new RegExp(`{{\\s*${k}\\s*}}`, 'gi');
      text = text.replace(reg, v);
    }

    return text.trim();
  }, [activeTemplateText, selectedTemplate]);

  // Simulator live preview
  const compiledSimPreview = useMemo(() => {
    const tpl = templates.find((t) => t.id === simEvent);
    if (!tpl) return '';
    let text = tpl.template;

    const context: Record<string, string> = {
      customerName: simData.customerName || 'Pelanggan',
      orderId: simData.orderId || 'ORD-991',
      storeName: simData.storeName || 'Toko Online Kami',
      itemsSummary: simData.itemsSummary || 'Produk Pesanan',
      totalAmount: simData.totalAmount || 'Rp 0',
      paymentMethod: simData.paymentMethod || 'Transfer Bank',
      paymentInstruction: simData.paymentInstruction || 'Transfer sesuai total tagihan.',
      courier: simData.courier || 'JNE Regular',
      trackingNumber: simData.trackingNumber || 'JNE8899120',
      trackingUrl: simData.trackingUrl || 'https://cekresi.com',
      deliveryAddress: simData.deliveryAddress || 'Alamat Penerima',
      checkoutUrl: simData.checkoutUrl || 'https://toko.com/checkout',
      discountPromo: simData.discountPromo || 'HEMAT10',
      estimateDays: simData.estimateDays || '1-3 Hari Kerja',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    for (const [k, v] of Object.entries(context)) {
      const reg = new RegExp(`{{\\s*${k}\\s*}}`, 'gi');
      text = text.replace(reg, v);
    }
    return text.trim();
  }, [templates, simEvent, simData]);

  // Quick fill dummy data for simulator
  const handleAutoFillDummy = () => {
    const randomInv = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    const randomResi = 'JT' + Math.floor(1000000000 + Math.random() * 9000000000) + 'ID';
    setSimData({
      customerName: 'Budi Santoso',
      storeName: 'Toko Keren Official',
      orderId: randomInv,
      courier: 'J&T Express (NextDay)',
      trackingNumber: randomResi,
      trackingUrl: `https://cekresi.com/?no=${randomResi}`,
      totalAmount: 'Rp 325.000',
      itemsSummary: '1x Kemeja Flanel Slimfit (Navy L) + 1x Topi Beanie',
      paymentMethod: 'BCA Virtual Account (8077708123456789)',
      paymentInstruction: 'Selesaikan transfer sebelum 24 jam ke nomor VA tertera.',
      deliveryAddress: 'Jl. Merdeka No. 45, RT 04/RW 02, Tebet, Jakarta Selatan 12810',
      estimateDays: '1 Hari Kerja',
      discountPromo: 'HEMATSELLER15 (Diskon 15%)',
      checkoutUrl: `https://tokokeren.com/checkout?order=${randomInv}`,
    });
  };

  const handleRunSimulation = async () => {
    if (!isConnected) {
      onOpenPairing();
      return;
    }

    if (!simPhone.trim()) {
      setSimError('Nomor WhatsApp tujuan tidak boleh kosong.');
      return;
    }

    setIsSimulating(true);
    setSimError(null);
    setSimResult(null);

    try {
      const res = await api.simulateEcommerceEvent({
        event: simEvent,
        to: simPhone.trim(),
        data: simData,
      });

      if (res.success) {
        setSimResult(res);
      }
    } catch (err: unknown) {
      const anyErr = err as { message?: string; error?: string };
      setSimError(anyErr.message || anyErr.error || 'Gagal mengirim simulasi event');
    } finally {
      setIsSimulating(false);
    }
  };

  const availableVariables = [
    { key: 'customerName', label: 'Nama Pembeli', desc: 'Contoh: Budi Santoso' },
    { key: 'orderId', label: 'ID Pesanan', desc: 'Contoh: INV-202610-098' },
    { key: 'storeName', label: 'Nama Toko', desc: 'Contoh: Toko Keren Official' },
    { key: 'itemsSummary', label: 'Daftar Barang', desc: 'Contoh: 2x Kaos Polos Combed 30s' },
    { key: 'totalAmount', label: 'Total Belanja', desc: 'Contoh: Rp 175.000' },
    { key: 'paymentMethod', label: 'Metode Bayar', desc: 'Contoh: BCA Virtual Account' },
    { key: 'paymentInstruction', label: 'Instruksi Bayar', desc: 'Panduan transfer pembayaran' },
    { key: 'courier', label: 'Kurir Ekspedisi', desc: 'Contoh: J&T Express / SiCepat' },
    { key: 'trackingNumber', label: 'Nomor Resi', desc: 'Contoh: JT9823481230ID' },
    { key: 'trackingUrl', label: 'Link Lacak Resi', desc: 'URL pelacakan paket' },
    { key: 'deliveryAddress', label: 'Alamat Kirim', desc: 'Alamat lengkap tujuan' },
    { key: 'estimateDays', label: 'Estimasi Kirim', desc: 'Contoh: 1-2 Hari Kerja' },
    { key: 'checkoutUrl', label: 'Link Keranjang', desc: 'Tautan pemulihan checkout' },
    { key: 'discountPromo', label: 'Kode Kupon', desc: 'Contoh: HEMAT15' },
    { key: 'date', label: 'Tanggal', desc: 'Format tanggal lokal' },
    { key: 'time', label: 'Waktu', desc: 'Format jam:menit' },
  ];

  return (
    <div className="space-y-5 max-w-full overflow-hidden">
      {/* Top Header - Fully responsive flex wrap */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Notifikasi E-Commerce & Toko Online
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">
              Event-Driven
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Kirim pesan WhatsApp otomatis terpicu oleh status pesanan (Checkout, Pembayaran Lunas, Resi Ekspedisi, Paket Sampai, COD, dan Abandoned Cart).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!isConnected && (
            <button
              onClick={onOpenPairing}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Hubungkan WhatsApp</span>
            </button>
          )}

          <button
            onClick={handleResetTemplates}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Reset semua template e-commerce ke standar awal"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Reset Bawaan</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs - Touch-friendly Responsive Horizontal Scrolling */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveSubTab('templates')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'templates'
              ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sliders className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Katalog Event & Template</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 border border-slate-700 text-slate-300 font-mono">
            {templates.length || 7}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'simulator'
              ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Send className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span>Simulator Pengujian (Sandbox)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-300">
            Uji Langsung
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('integration')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'integration'
              ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Code className="h-3.5 w-3.5 text-purple-400 shrink-0" />
          <span>Panduan Webhook & Integrasi API</span>
        </button>

        {onNavigateToWebhookSimulator && (
          <button
            onClick={onNavigateToWebhookSimulator}
            className="px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer bg-sky-950/40 border border-sky-800/60 text-sky-300 hover:bg-sky-900/50 hover:text-white"
          >
            <Radio className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span>Simulator Webhook</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-900 border border-sky-700 text-sky-200">
              Live Test
            </span>
          </button>
        )}
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: KATALOG EVENT & EDITOR TEMPLATE */}
      {/* ========================================================================= */}
      {activeSubTab === 'templates' && (
        <div className="space-y-4">
          {/* Mobile-Only Event Selector Dropdown (< lg) */}
          <div className="block lg:hidden p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-400" />
                <span>Pilih Status / Event E-Commerce:</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {templates.filter((t) => t.enabled).length}/{templates.length} Aktif
              </span>
            </label>
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => handleSelectEvent(e.target.value as EcommerceEventType)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2.5 text-xs text-white focus:border-emerald-500 outline-none appearance-none cursor-pointer pr-8"
              >
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.title} ({tpl.enabled ? 'Aktif' : 'Nonaktif'})
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Desktop Left Column: Event Selector Cards (Hidden on mobile for clean UX) */}
            <div className="hidden lg:block lg:col-span-4 space-y-2.5">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Daftar Status Event
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {templates.filter((t) => t.enabled).length}/{templates.length} Aktif
                </span>
              </div>

              {isLoadingTemplates ? (
                <div className="p-6 text-center text-xs text-slate-500">Memuat template...</div>
              ) : (
                templates.map((tpl) => {
                  const isSelected = tpl.id === selectedEventId;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => handleSelectEvent(tpl.id)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'border-emerald-500/60 bg-emerald-950/20 shadow-xs'
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-semibold text-xs text-white tracking-tight truncate">
                            {tpl.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium font-mono ${
                              tpl.enabled
                                ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                                : 'bg-slate-900 border border-slate-700 text-slate-500'
                            }`}
                          >
                            {tpl.enabled ? 'Aktif' : 'Nonaktif'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-400 font-medium">
                            {tpl.badge}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    </button>
                  );
                })
              )}
            </div>

            {/* Right Column: Template Editor & WhatsApp Live Bubble Preview */}
            <div className="lg:col-span-8 space-y-5">
              {selectedTemplate && (
                <div className="p-4 sm:p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-4 shadow-sm">
                  {/* Header of Active Event */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-bold text-white">{selectedTemplate.title}</h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-300">
                          event: {selectedTemplate.id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{selectedTemplate.description}</p>
                    </div>

                    {/* Toggle Active Switch */}
                    <div className="flex items-center gap-2.5 shrink-0 pt-1 sm:pt-0">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={activeEnabled}
                          onChange={(e) => setActiveEnabled(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>Aktifkan Notifikasi</span>
                      </label>
                    </div>
                  </div>

                  {/* Variable Insertion Pills (Touch-friendly & wrapping) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Sisipkan Tag Variabel:
                      </span>
                      <span className="text-[10px] text-slate-500">Klik untuk menyisipkan</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 sm:max-h-none overflow-y-auto sm:overflow-visible p-1 -m-1">
                      {availableVariables.map((v) => (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => handleInsertVariable(v.key)}
                          className="px-2 py-1 rounded-md text-[11px] font-mono bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer shrink-0"
                          title={v.desc}
                        >
                          +{v.key}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea Template Editor */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 block">
                      Susunan Pesan WhatsApp:
                    </label>
                    <textarea
                      ref={textareaRef}
                      rows={8}
                      value={activeTemplateText}
                      onChange={(e) => setActiveTemplateText(e.target.value)}
                      className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 sm:p-3.5 font-mono text-xs text-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none leading-relaxed transition-all"
                      placeholder="Tuliskan format pesan WhatsApp di sini..."
                    />
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
                      <span>
                        Format: <strong>*tebal*</strong>, <em>_miring_</em>, ~coret~, ```monospace```
                      </span>
                      <span>{activeTemplateText.length} karakter</span>
                    </div>
                  </div>

                  {/* WhatsApp Chat Bubble Live Preview */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>Pratinjau Output WhatsApp:</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Data contoh live</span>
                    </div>

                    <div className="p-3 sm:p-4 rounded-xl bg-[#0b141a] border border-slate-800/80 shadow-inner flex flex-col items-start overflow-hidden">
                      <div className="max-w-full sm:max-w-md w-full bg-[#005c4b] text-[#e9edef] rounded-lg p-3 shadow-md relative text-xs leading-relaxed font-sans whitespace-pre-wrap break-words break-all">
                        {compiledPreview}
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-emerald-200/70 font-mono">
                          <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          <Check className="h-3 w-3 text-cyan-300 inline shrink-0" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save and Actions - Fully responsive */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setSimEvent(selectedEventId);
                        setActiveSubTab('simulator');
                      }}
                      className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      <span>Uji Kirim di Simulator</span>
                    </button>

                    <button
                      onClick={handleSaveTemplate}
                      disabled={isSaving}
                      className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5 shrink-0" />
                      <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: SIMULATOR PENGUJIAN (SANDBOX) */}
      {/* ========================================================================= */}
      {activeSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: Parameter Input */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-4 sm:p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
                <div>
                  <h2 className="text-sm font-bold text-white">Simulator Pengujian Notifikasi</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Uji coba kirim pesan WhatsApp langsung ke nomor ponsel Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillDummy}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0 self-start sm:self-auto"
                  title="Isi form dengan data pesanan contoh"
                >
                  <Sparkles className="h-3 w-3 shrink-0" />
                  <span>Isi Data Dummy</span>
                </button>
              </div>

              {/* Event Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  1. Pilih Jenis Event:
                </label>
                <select
                  value={simEvent}
                  onChange={(e) => setSimEvent(e.target.value as EcommerceEventType)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 text-xs text-white focus:border-emerald-500 outline-none cursor-pointer"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.badge})
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  2. Nomor WhatsApp Penerima:
                </label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  placeholder="081234567890 atau 6281234567890"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2.5 font-mono text-xs text-white focus:border-emerald-500 outline-none"
                />
                <p className="text-[11px] text-slate-500">
                  Gunakan format nomor Indonesia lokal (08xxx) atau internasional (628xxx).
                </p>
              </div>

              {/* Order Data Fields - Fully responsive 1-col on mobile, 2-col on sm+ */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  3. Rincian Data Pesanan (Payload):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 block">Nama Pembeli:</label>
                    <input
                      type="text"
                      value={simData.customerName || ''}
                      onChange={(e) => setSimData({ ...simData, customerName: e.target.value })}
                      className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 block">ID Pesanan / Invoice:</label>
                    <input
                      type="text"
                      value={simData.orderId || ''}
                      onChange={(e) => setSimData({ ...simData, orderId: e.target.value })}
                      className="w-full rounded bg-slate-950 border border-slate-800 p-2 font-mono text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 block">Nama Toko:</label>
                    <input
                      type="text"
                      value={simData.storeName || ''}
                      onChange={(e) => setSimData({ ...simData, storeName: e.target.value })}
                      className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 block">Total Tagihan:</label>
                    <input
                      type="text"
                      value={simData.totalAmount || ''}
                      onChange={(e) => setSimData({ ...simData, totalAmount: e.target.value })}
                      className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 block">Kurir Ekspedisi:</label>
                    <input
                      type="text"
                      value={simData.courier || ''}
                      onChange={(e) => setSimData({ ...simData, courier: e.target.value })}
                      className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-400 block">Nomor Resi Pengiriman:</label>
                    <input
                      type="text"
                      value={simData.trackingNumber || ''}
                      onChange={(e) => setSimData({ ...simData, trackingNumber: e.target.value })}
                      className="w-full rounded bg-slate-950 border border-slate-800 p-2 font-mono text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 block">Link Cek Resi / Tracking URL:</label>
                  <input
                    type="text"
                    value={simData.trackingUrl || ''}
                    onChange={(e) => setSimData({ ...simData, trackingUrl: e.target.value })}
                    className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400 block">Ringkasan Barang:</label>
                  <input
                    type="text"
                    value={simData.itemsSummary || ''}
                    onChange={(e) => setSimData({ ...simData, itemsSummary: e.target.value })}
                    className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  <Send className={`h-3.5 w-3.5 shrink-0 ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>{isSimulating ? 'Mengirim Simulasi Pesan...' : 'Kirim Uji Coba ke WhatsApp Sekarang'}</span>
                </button>
              </div>

              {/* Error Box */}
              {simError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span className="break-words">{simError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Chat Bubble & Results */}
          <div className="lg:col-span-6 space-y-4">
            {/* Live Chat Bubble Preview */}
            <div className="p-4 sm:p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-3 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>Pratinjau Output Pesan Pelanggan:</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono truncate max-w-[120px] sm:max-w-none">
                  {simPhone}
                </span>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-[#0b141a] border border-slate-800/80 shadow-inner flex flex-col items-start min-h-[160px] overflow-hidden">
                <div className="max-w-full sm:max-w-md w-full bg-[#005c4b] text-[#e9edef] rounded-lg p-3 shadow-md relative text-xs leading-relaxed font-sans whitespace-pre-wrap break-words break-all">
                  {compiledSimPreview}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-emerald-200/70 font-mono">
                    <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    <Check className="h-3 w-3 text-cyan-300 inline shrink-0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Simulation Result Telemetry Box */}
            {simResult && (
              <div className="p-4 sm:p-5 rounded-xl border border-emerald-800/50 bg-emerald-950/20 space-y-3 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Pesan WhatsApp Berhasil Terkirim!</span>
                  </div>
                  {onNavigateToLogs && (
                    <button
                      onClick={onNavigateToLogs}
                      className="text-[11px] text-emerald-300 hover:text-white underline cursor-pointer"
                    >
                      Buka Log Pengiriman ➔
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Penerima:</span>
                    <span className="font-mono text-white text-[11px] truncate block">{simResult.data.maskedRecipient}</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Latensi Kirim:</span>
                    <span className="font-mono text-emerald-400 text-[11px]">{simResult.data.latencyMs} ms</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Jeda Mengetik:</span>
                    <span className="font-mono text-cyan-400 text-[11px]">{simResult.data.simulatedTypingMs} ms</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Message ID:</span>
                    <span className="font-mono text-slate-300 text-[10px] truncate block" title={simResult.data.messageId}>
                      {simResult.data.messageId}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Notifikasi ini telah otomatis dicatat ke riwayat log pengiriman dan konsol audit server.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: PANDUAN INTEGRASI WEBHOOK & API */}
      {/* ========================================================================= */}
      {activeSubTab === 'integration' && (
        <div className="space-y-6">
          <div className="p-4 sm:p-5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">Panduan Integrasi Webhook E-Commerce</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hubungkan toko online Anda (WooCommerce, Shopify, Midtrans, atau backend custom) ke gateway WhatsApp.
                </p>
              </div>

              {/* Language Switcher - Touch scrollable on mobile */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto scrollbar-none self-start sm:self-auto shrink-0 max-w-full">
                <button
                  onClick={() => setIntegrationLang('curl')}
                  className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap cursor-pointer ${
                    integrationLang === 'curl' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setIntegrationLang('nodejs')}
                  className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap cursor-pointer ${
                    integrationLang === 'nodejs' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Node.js
                </button>
                <button
                  onClick={() => setIntegrationLang('php')}
                  className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap cursor-pointer ${
                    integrationLang === 'php' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  PHP / Laravel
                </button>
                <button
                  onClick={() => setIntegrationLang('woocommerce')}
                  className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap cursor-pointer ${
                    integrationLang === 'woocommerce' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WooCommerce
                </button>
              </div>
            </div>

            {/* API Endpoint Banner - Fully Responsive */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-400 shrink-0">
                  POST
                </span>
                <span className="text-slate-300 break-all text-[11px] sm:text-xs">
                  {window.location.origin}/api/v1/ecommerce/events
                </span>
              </div>
              <span className="text-[11px] text-slate-500 shrink-0 font-sans">
                Header: <code className="text-emerald-400">Authorization: Bearer &lt;TOKEN&gt;</code>
              </span>
            </div>

            {/* Code Snippets */}
            <div className="overflow-hidden rounded-xl border border-slate-800">
              {integrationLang === 'curl' && (
                <CodeBlock
                  language="bash"
                  code={`curl -X POST "${window.location.origin}/api/v1/ecommerce/events" \\
  -H "Authorization: Bearer <KUNCI_API_JWT_ANDA>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "shipping_dispatched",
    "to": "081234567890",
    "data": {
      "customerName": "Budi Santoso",
      "orderId": "INV-202610-098",
      "storeName": "Toko Keren Official",
      "courier": "J&T Express",
      "trackingNumber": "JT9823481230ID",
      "trackingUrl": "https://cekresi.com/?no=JT9823481230ID",
      "totalAmount": "Rp 275.000"
    }
  }'`}
                />
              )}

              {integrationLang === 'nodejs' && (
                <CodeBlock
                  language="typescript"
                  code={`// Integrasi pengiriman notifikasi resi ekspedisi via Node.js
async function sendShippingNotification(customerPhone, orderData) {
  const response = await fetch("${window.location.origin}/api/v1/ecommerce/events", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.WHATSAPP_GATEWAY_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      event: "shipping_dispatched",
      to: customerPhone,
      data: {
        customerName: orderData.customerName,
        orderId: orderData.invoiceNo,
        storeName: "Toko Keren Official",
        courier: orderData.courierName,
        trackingNumber: orderData.waybillNumber,
        trackingUrl: "https://cekresi.com/?no=" + orderData.waybillNumber,
        totalAmount: orderData.formattedTotal
      }
    })
  });

  const result = await response.json();
  console.log("Status notifikasi WhatsApp:", result);
  return result;
}`}
                />
              )}

              {integrationLang === 'php' && (
                <CodeBlock
                  language="php"
                  code={`// Integrasi di Controller Laravel / PHP Native
use Illuminate\\Support\\Facades\\Http;

public function onOrderDispatched($order)
{
    $response = Http::withToken(config('services.whatsapp_gateway.token'))
        ->post('${window.location.origin}/api/v1/ecommerce/events', [
            'event' => 'shipping_dispatched',
            'to' => $order->customer_phone, // contoh: 081234567890
            'data' => [
                'customerName'   => $order->customer_name,
                'orderId'        => $order->invoice_number,
                'storeName'      => config('app.name'),
                'courier'        => $order->courier_name,
                'trackingNumber' => $order->tracking_number,
                'trackingUrl'    => 'https://cekresi.com/?no=' . $order->tracking_number,
                'totalAmount'    => 'Rp ' . number_format($order->total_amount, 0, ',', '.')
            ]
        ]);

    if ($response->successful()) {
        \\Log::info('Notifikasi WhatsApp pesanan berhasil terkirim ke pelanggan: ' . $order->invoice_number);
    }
}`}
                />
              )}

              {integrationLang === 'woocommerce' && (
                <CodeBlock
                  language="php"
                  code={`// Tambahkan hook ini di functions.php tema WordPress WooCommerce Anda
add_action('woocommerce_order_status_completed', 'kirim_notifikasi_wa_order_selesai', 10, 1);

function kirim_notifikasi_wa_order_selesai($order_id) {
    $order = wc_get_order($order_id);
    $phone = $order->get_billing_phone();
    
    $payload = [
        'event' => 'order_delivered',
        'to' => $phone,
        'data' => [
            'customerName' => $order->get_billing_first_name(),
            'orderId'      => (string) $order_id,
            'storeName'    => get_bloginfo('name'),
            'totalAmount'  => wc_price($order->get_total()),
            'trackingUrl'  => $order->get_view_order_url(),
        ]
    ];

    wp_remote_post('${window.location.origin}/api/v1/ecommerce/events', [
        'headers' => [
            'Authorization' => 'Bearer MASUKKAN_TOKEN_JWT_DI_SINI',
            'Content-Type'  => 'application/json'
        ],
        'body'    => json_encode($payload),
        'timeout' => 15
    ]);
}`}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
