export type WhatsAppConnectionStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected';

export interface WhatsAppState {
  status: WhatsAppConnectionStatus;
  phone: string | null;
  pushName: string | null;
  qrDataUrl: string | null;
  qrRaw: string | null;
  pairingCode: string | null;
  lastDisconnectReason: string | null;
  connectedAt: string | null;
  uptimeSeconds: number;
}
