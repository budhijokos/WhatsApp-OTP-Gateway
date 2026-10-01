import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ code, language = 'bash', title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="relative rounded-lg border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-3.5 py-2">
        <span className="text-slate-400 font-medium text-[11px] tracking-wide">
          {title || language.toUpperCase()}
        </span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors px-2 py-0.5 rounded hover:bg-slate-800"
          title="Salin kode"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Tersalin</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Salin</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 leading-relaxed text-slate-200 selection:bg-emerald-500/30">
        <pre className="tab-size-2">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
