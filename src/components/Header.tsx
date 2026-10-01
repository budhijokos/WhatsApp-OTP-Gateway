import { MessageSquare, QrCode, Terminal, ExternalLink } from 'lucide-react';
import { WhatsAppState } from '../types';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  waState: WhatsAppState;
  onOpenPairing: () => void;
}

export function Header({ activeTab, onTabChange, waState, onOpenPairing }: HeaderProps) {
  const isConnected = waState.status === 'connected';

  const navItems = [
    { id: 'dashboard', label: 'Dasbor' },
    { id: 'tester', label: 'Kirim OTP' },
    { id: 'template', label: 'Template Pesan' },
    { id: 'logs', label: 'Log Pengiriman' },
    { id: 'errors', label: 'Debug Error' },
    { id: 'console', label: 'Konsol Live' },
    { id: 'developer', label: 'Panduan Dev' },
    { id: 'swagger', label: 'Swagger API' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            onTabChange('dashboard');
          }}
          className="flex items-center gap-2 text-base font-bold tracking-tight text-white hover:text-emerald-400 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MessageSquare className="h-4 w-4" />
          </div>
          <span>WhatsApp OTP Gateway</span>
        </a>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenPairing}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
              isConnected
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 animate-pulse'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>{isConnected ? 'WhatsApp Tertaut' : 'Tautkan WhatsApp'}</span>
          </button>

          <a
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span>Swagger Docs</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>
        </div>
      </div>
    </header>
  );
}
