import { useState } from 'react';
import {
  MessageSquare,
  QrCode,
  ExternalLink,
  Menu,
  X,
  ShoppingBag,
  Send,
  Key,
  FileCode,
  ListOrdered,
  AlertTriangle,
  Terminal,
  BookOpen,
  LayoutDashboard,
  Radio,
} from 'lucide-react';
import { WhatsAppState } from '../types';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  waState: WhatsAppState;
  onOpenPairing: () => void;
}

export function Header({ activeTab, onTabChange, waState, onOpenPairing }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isConnected = waState.status === 'connected';

  const navItems = [
    { id: 'dashboard', label: 'Dasbor', icon: LayoutDashboard },
    { id: 'ecommerce', label: 'E-Commerce', icon: ShoppingBag, badge: 'Baru' },
    { id: 'webhook-sim', label: 'Simulator Webhook', icon: Radio, badge: 'Sim' },
    { id: 'tester', label: 'Kirim OTP', icon: Send },
    { id: 'keys', label: 'Kunci API (JWT)', icon: Key },
    { id: 'template', label: 'Template Pesan', icon: FileCode },
    { id: 'logs', label: 'Log Pengiriman', icon: ListOrdered },
    { id: 'errors', label: 'Debug Error', icon: AlertTriangle },
    { id: 'console', label: 'Konsol Live', icon: Terminal },
    { id: 'developer', label: 'Panduan Dev', icon: BookOpen },
    { id: 'swagger', label: 'Swagger API', icon: ExternalLink },
  ];

  const handleSelectTab = (tabId: string) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 gap-2">
        {/* Left: Brand Logo & Mobile Toggle */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
            aria-label="Buka Menu Navigasi"
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              handleSelectTab('dashboard');
            }}
            className="flex items-center gap-2 text-sm sm:text-base font-bold tracking-tight text-white hover:text-emerald-400 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="hidden xs:inline">WhatsApp OTP Gateway</span>
            <span className="xs:hidden font-mono text-xs">WA Gateway</span>
          </a>
        </div>

        {/* Center: Desktop & Tablet Nav Bar (Horizontal Scrollable on medium screens) */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-none py-1 max-w-2xl lg:max-w-3xl">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-emerald-950 border border-emerald-800 text-emerald-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenPairing}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
              isConnected
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 animate-pulse'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isConnected ? 'WhatsApp Tertaut' : 'Tautkan WhatsApp'}</span>
            <span className="sm:hidden">{isConnected ? 'Tertaut' : 'Tautkan'}</span>
          </button>

          <a
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-md hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span>Swagger</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Mobile Drawer Menu (Visible when hamburger is toggled) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/98 px-3 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-1.5 pb-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`p-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700 font-semibold'
                      : 'text-slate-300 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-emerald-950 border border-emerald-800 text-emerald-300 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>Status WA: {isConnected ? 'Terhubung' : 'Terputus'}</span>
            </span>
            <a
              href="/api/docs"
              target="_blank"
              className="text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Dokumentasi API</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
