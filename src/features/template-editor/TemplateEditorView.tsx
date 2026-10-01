import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Sparkles,
  Save,
  RotateCcw,
  Check,
  Copy,
  AlertTriangle,
  Info,
  Phone,
  Clock,
  Calendar,
  Shield,
  Layers,
  Send,
  Eye,
  CheckCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { CodeBlock } from '../../components/CodeBlock';

interface TemplatePreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  template: string;
}

interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  sample: string;
}

interface TemplateEditorViewProps {
  onNavigateToTester?: (customTemplate?: string) => void;
}

export function TemplateEditorView({ onNavigateToTester }: TemplateEditorViewProps) {
  const [template, setTemplate] = useState('');
  const [presets, setPresets] = useState<TemplatePreset[]>([]);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('security_standard');

  // Preview dummy parameters
  const [previewAppName, setPreviewAppName] = useState('FinPay Security');
  const [previewOtp, setPreviewOtp] = useState('849201');
  const [previewExpiresIn, setPreviewExpiresIn] = useState('5');
  const [previewPhone, setPreviewPhone] = useState('+6281234567890');

  // Status feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedPreview, setCopiedPreview] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load initial templates and presets from API
  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getTemplate();
        if (res.success) {
          setTemplate(res.activeTemplate);
          setPresets(res.presets);
          setVariables(res.variables);
        }
      } catch (err) {
        console.error('Failed to load template data:', err);
      }
    }
    loadData();
  }, []);

  // Insert variable at cursor position in textarea
  const insertVariable = (varKey: string) => {
    const el = textareaRef.current;
    if (!el) {
      setTemplate((prev) => prev + ' ' + varKey);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentVal = el.value;
    const newVal = currentVal.substring(0, start) + varKey + currentVal.substring(end);
    setTemplate(newVal);

    // Restore cursor position after the inserted variable
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + varKey.length, start + varKey.length);
    }, 50);
  };

  // Select a preset
  const handleSelectPreset = (preset: TemplatePreset) => {
    setSelectedPresetId(preset.id);
    setTemplate(preset.template);
  };

  // Save template as default
  const handleSaveDefault = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await api.updateTemplate(template);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setSaveError(err.message || 'Gagal menyimpan template');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default factory template
  const handleReset = async () => {
    if (!confirm('Apakah Anda yakin ingin mengembalikan template ke standar bawaan sistem?')) {
      return;
    }
    try {
      const res = await api.resetTemplate();
      if (res.success) {
        setTemplate(res.activeTemplate);
        setSelectedPresetId('security_standard');
      }
    } catch (err: any) {
      alert('Gagal reset: ' + err.message);
    }
  };

  // Compile preview text
  const compilePreview = (): string => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';

    return template
      .replace(/{{otp}}/gi, previewOtp || '849201')
      .replace(/{{code}}/gi, previewOtp || '849201')
      .replace(/{{appName}}/gi, previewAppName || 'FinPay Security')
      .replace(/{{app_name}}/gi, previewAppName || 'FinPay Security')
      .replace(/{{expiresIn}}/gi, previewExpiresIn || '5')
      .replace(/{{expires_in}}/gi, previewExpiresIn || '5')
      .replace(/{{phone}}/gi, previewPhone || '+6281234567890')
      .replace(/{{date}}/gi, dateStr)
      .replace(/{{time}}/gi, timeStr);
  };

  const previewText = compilePreview();
  const hasOtpTag = template.includes('{{otp}}') || template.includes('{{code}}');

  // Copy preview
  const copyPreview = async () => {
    await navigator.clipboard.writeText(previewText);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  // Format WhatsApp message to simple HTML for preview bubble
  const renderFormattedPreview = (text: string) => {
    // Process markdown-like formatting for WhatsApp
    return text.split('\n').map((line, idx) => {
      // Bold *text*
      let formatted = line.replace(/\*(.*?)\*/g, '<strong class="font-bold text-white">$1</strong>');
      // Italic _text_
      formatted = formatted.replace(/_(.*?)_/g, '<em class="italic text-slate-200">$1</em>');
      // Strikethrough ~text~
      formatted = formatted.replace(/~(.*?)~/g, '<del class="line-through text-slate-400">$1</del>');
      // Monospace ```text```
      formatted = formatted.replace(/```(.*?)```/g, '<code class="bg-black/40 px-1 py-0.5 rounded font-mono text-emerald-300 text-xs">$1</code>');

      return (
        <span
          key={idx}
          className="block min-h-[1.25rem] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-400" />
            <span>Kustomisasi Template Pesan WhatsApp</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sesuaikan susunan kata pesan OTP, gunakan variabel dinamis, dan lihat simulasi tampilan balon pesan secara instan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Kembalikan ke standar awal"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Standar</span>
          </button>

          <button
            onClick={handleSaveDefault}
            disabled={isSaving || !hasOtpTag}
            className="px-4 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {isSaving ? (
              <span>Menyimpan...</span>
            ) : saveSuccess ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Template Default</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Preset Chooser Cards */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Pilihan Preset Template Cepat
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer select-none flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/50'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-white">{preset.name}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
                <div className="text-[10px] text-emerald-400 font-mono font-medium flex items-center gap-1">
                  <span>{isSelected ? '● Sedang Aktif' : 'Pilih Preset'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Split Grid: Editor & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor & Variables Toolbar (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
            {/* Variable Insertion Chips */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>Sisipkan Tag Variabel Dinamis</span>
                </span>
                <span className="text-[10px] text-slate-500">Klik tag untuk menyisipkan ke kursor</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {variables.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 hover:bg-slate-800 hover:border-emerald-500/50 hover:text-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title={`${v.label}: ${v.description} (Contoh: ${v.sample})`}
                  >
                    <span>+ {v.key}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Template Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Isi Template Pesan
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {template.length} karakter
                </span>
              </div>
              <textarea
                ref={textareaRef}
                rows={9}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                placeholder="Tuliskan format template pesan di sini..."
                className="w-full p-3.5 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 leading-relaxed font-medium resize-y"
              />

              {!hasOtpTag && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>
                    <strong>Peringatan:</strong> Template wajib menyertakan tag <code className="bg-black/40 px-1 py-0.5 rounded text-amber-200">{"{{otp}}"}</code> agar kode verifikasi dapat disisipkan ke pesan penerima.
                  </span>
                </div>
              )}
            </div>

            {/* WhatsApp Formatting Guide */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
              <span className="font-semibold text-slate-300 block">Panduan Format Teks WhatsApp:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
                <div>
                  <span className="text-emerald-400">*tebal*</span> ➔ <strong>Tebal</strong>
                </div>
                <div>
                  <span className="text-emerald-400">_miring_</span> ➔ <em>Miring</em>
                </div>
                <div>
                  <span className="text-emerald-400">~coret~</span> ➔ <del>Coret</del>
                </div>
                <div>
                  <span className="text-emerald-400">```mono```</span> ➔ <code>Monospace</code>
                </div>
              </div>
            </div>
          </div>

          {/* Test Parameters Sandbox Card */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-sky-400" />
              <span>Parameter Uji Coba Simulasi (Live Preview)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nama Aplikasi / Brand</label>
                <input
                  type="text"
                  value={previewAppName}
                  onChange={(e) => setPreviewAppName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Kode OTP Contoh</label>
                <input
                  type="text"
                  value={previewOtp}
                  onChange={(e) => setPreviewOtp(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold text-emerald-400 rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Masa Berlaku (Menit)</label>
                <input
                  type="number"
                  value={previewExpiresIn}
                  onChange={(e) => setPreviewExpiresIn(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nomor Penerima</label>
                <input
                  type="text"
                  value={previewPhone}
                  onChange={(e) => setPreviewPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Ultra-Realistic WhatsApp Mobile Chat Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-[#0b141a] overflow-hidden shadow-2xl">
            {/* WhatsApp App Mobile Header */}
            <div className="bg-[#1f2c34] px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                  {previewAppName.charAt(0) || 'G'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white leading-none">
                      {previewAppName || 'WhatsApp Gateway'}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-none">Akun Bisnis Resmi</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyPreview}
                  className="px-2.5 py-1 text-[11px] rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                  title="Salin isi pesan preview"
                >
                  {copiedPreview ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedPreview ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Chat Body Wallpaper */}
            <div
              className="p-4 min-h-[380px] flex flex-col justify-end"
              style={{
                backgroundColor: '#0b141a',
                backgroundImage: `radial-gradient(#1f2c34 1px, transparent 1px)`,
                backgroundSize: '16px 16px',
              }}
            >
              {/* Security Pill Info */}
              <div className="mx-auto mb-4 px-3 py-1 rounded-md bg-[#182229] border border-slate-800 text-[10px] text-amber-200/80 text-center max-w-[280px]">
                🔒 Pesan ini dienkripsi secara end-to-end langsung dari server gateway.
              </div>

              {/* Chat Bubble Incoming */}
              <div className="max-w-[92%] relative rounded-xl rounded-tl-none bg-[#005c4b] text-white p-3.5 shadow-md border border-[#02735e]/40 space-y-2">
                {/* Bubble Tail */}
                <div
                  className="absolute -top-[1px] -left-2 w-0 h-0"
                  style={{
                    borderTop: '9px solid #005c4b',
                    borderLeft: '9px solid transparent',
                  }}
                />

                {/* Content */}
                <div className="text-xs font-sans text-slate-100 whitespace-pre-wrap select-text">
                  {renderFormattedPreview(previewText)}
                </div>

                {/* Footer Timestamp & Read Ticks */}
                <div className="flex items-center justify-end gap-1 pt-1 text-[10px] text-slate-300 font-mono">
                  <span>14:30 WIB</span>
                  <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                </div>
              </div>
            </div>

            {/* WhatsApp Fake Input Footer */}
            <div className="bg-[#1f2c34] px-4 py-2.5 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
              <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-1.5 text-[11px] text-slate-500">
                Penerima tidak dapat membalas pesan transaksional ini...
              </div>
            </div>
          </div>

          {/* Quick Navigate to Tester Button */}
          {onNavigateToTester && (
            <button
              onClick={() => onNavigateToTester(template)}
              className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Gunakan Template Ini pada Menu Uji Kirim OTP →</span>
            </button>
          )}
        </div>
      </div>

      {/* Code Snippet Reference for Developers */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Penggunaan Template Kustom Melalui REST API
          </h3>
          <p className="text-[11px] text-slate-400">
            Anda dapat menyertakan parameter <code className="text-slate-300 font-mono">message</code> pada panggilan <code className="text-emerald-400 font-mono">POST /api/v1/otp/send</code> dengan tag variabel dinamis untuk mengirim template berbeda secara fleksibel per kasus:
          </p>
        </div>

        <CodeBlock
          language="bash"
          title="cURL Request Example"
          code={`curl -X POST https://your-gateway-url/api/v1/otp/send \\
  -H "Authorization: Bearer <DEVELOPER_JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "081234567890",
    "otp": "849201",
    "appName": "FinPay Security",
    "message": "Halo! Kode rahasia masuk ke *{{appName}}* Anda adalah 👉 *{{otp}}*. Jangan bagikan kepada siapa pun. Berlaku {{expiresIn}} menit."
  }'`}
        />
      </div>
    </div>
  );
}
