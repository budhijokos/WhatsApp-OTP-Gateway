import { CheckCircle2, Clock, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { DeliveryStatus, WhatsAppConnectionStatus } from '../types';

interface DeliveryStatusProps {
  status: DeliveryStatus;
  showIcon?: boolean;
}

export function DeliveryStatusIndicator({ status, showIcon = true }: DeliveryStatusProps) {
  switch (status) {
    case 'delivered':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          {showIcon && <CheckCircle2 className="h-3.5 w-3.5" />}
          <span>Terkirim & Diterima</span>
        </span>
      );
    case 'sent':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-400">
          {showIcon && <CheckCircle2 className="h-3.5 w-3.5" />}
          <span>Terkirim</span>
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
          {showIcon && <Clock className="h-3.5 w-3.5 animate-spin" />}
          <span>Memproses</span>
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400">
          {showIcon && <XCircle className="h-3.5 w-3.5" />}
          <span>Gagal</span>
        </span>
      );
    default:
      return <span className="text-xs text-slate-400">{status}</span>;
  }
}

interface WhatsAppStatusBadgeProps {
  status: WhatsAppConnectionStatus;
}

export function WhatsAppStatusBadge({ status }: WhatsAppStatusBadgeProps) {
  switch (status) {
    case 'connected':
      return (
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-emerald-400">Terhubung</span>
        </div>
      );
    case 'qr_ready':
      return (
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-semibold text-amber-300">Menunggu Scan QR</span>
        </div>
      );
    case 'connecting':
      return (
        <div className="flex items-center gap-2 text-xs">
          <RefreshCw className="h-3 w-3 text-sky-400 animate-spin" />
          <span className="font-semibold text-sky-300">Menyambungkan Socket</span>
        </div>
      );
    case 'disconnected':
    default:
      return (
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          <span className="font-semibold text-rose-400">Terputus</span>
        </div>
      );
  }
}
