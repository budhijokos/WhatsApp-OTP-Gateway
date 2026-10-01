import {
  ConsoleLogEntry,
  DeliveryLog,
  DetailedErrorLog,
  DeveloperTokenResult,
  SystemMetrics,
  WhatsAppState,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const api = {
  async getStatus(): Promise<{ whatsapp: WhatsAppState; metrics: SystemMetrics; auth: { secretPreview: string } }> {
    const res = await fetch(`${API_BASE}/api/v1/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getQr(): Promise<{
    status: WhatsAppState['status'];
    qrDataUrl: string | null;
    qrRaw: string | null;
    pairingCode: string | null;
    phone: string | null;
  }> {
    const res = await fetch(`${API_BASE}/api/v1/qr`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async requestPairCode(phoneNumber: string): Promise<{ success: boolean; pairingCode: string; message: string }> {
    const res = await fetch(`${API_BASE}/api/v1/pair-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal meminta kode pairing');
    return data;
  },

  async reconnect(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/api/v1/reconnect`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async resetSession(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/api/v1/reset-session`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getTemplate(): Promise<{
    success: boolean;
    activeTemplate: string;
    presets: { id: string; name: string; badge: string; description: string; template: string }[];
    variables: { key: string; label: string; description: string; sample: string }[];
  }> {
    const res = await fetch(`${API_BASE}/api/v1/otp/template`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async updateTemplate(template: string): Promise<{ success: boolean; message: string; activeTemplate: string }> {
    const res = await fetch(`${API_BASE}/api/v1/otp/template`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal menyimpan template');
    return data;
  },

  async resetTemplate(): Promise<{ success: boolean; message: string; activeTemplate: string }> {
    const res = await fetch(`${API_BASE}/api/v1/otp/template/reset`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async previewTemplate(payload: {
    template: string;
    otp?: string;
    appName?: string;
    expiresInMinutes?: number;
    phone?: string;
  }): Promise<{ success: boolean; preview: string }> {
    const res = await fetch(`${API_BASE}/api/v1/otp/template/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async generateToken(params: {
    sub?: string;
    name?: string;
    permissions?: string[];
    expiresIn?: string;
  }): Promise<DeveloperTokenResult> {
    const res = await fetch(`${API_BASE}/api/v1/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal membuat token');
    return data;
  },

  async verifyToken(token: string): Promise<{ valid: boolean; developer?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/api/v1/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return res.json();
  },

  async sendOtp(
    payload: {
      to: string;
      otp: string;
      appName?: string;
      expiresInMinutes?: number;
      message?: string;
      webhookUrl?: string;
      bypassRateLimit?: boolean;
    },
    token: string
  ): Promise<{ success: boolean; message?: string; data?: any; error?: string; code?: string; suggestedAction?: string }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }
    if (payload.bypassRateLimit) {
      headers['X-Bypass-Rate-Limit'] = 'true';
    }

    const res = await fetch(`${API_BASE}/api/v1/otp/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw {
        status: res.status,
        ...data,
      };
    }
    return data;
  },

  async verifyOtp(
    payload: { to: string; otp: string },
    token: string
  ): Promise<{ success: boolean; verified: boolean; message: string; attemptsRemaining?: number; appName?: string; error?: string }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    const res = await fetch(`${API_BASE}/api/v1/otp/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw {
        status: res.status,
        ...data,
      };
    }
    return data;
  },

  async getDeliveryLogs(limit = 100, status?: string): Promise<{ logs: DeliveryLog[] }> {
    const base = API_BASE ? API_BASE : window.location.origin;
    const url = new URL(`${base}/api/v1/otp/logs`);
    url.searchParams.set('limit', String(limit));
    if (status) url.searchParams.set('status', status);
    const res = await fetch(url.toString());
    return res.json();
  },

  async clearDeliveryLogs(): Promise<void> {
    await fetch(`${API_BASE}/api/v1/otp/logs`, { method: 'DELETE' });
  },

  async getErrorLogs(limit = 100): Promise<{ errors: DetailedErrorLog[] }> {
    const res = await fetch(`${API_BASE}/api/v1/logs/errors?limit=${limit}`);
    return res.json();
  },

  async clearErrorLogs(): Promise<void> {
    await fetch(`${API_BASE}/api/v1/logs/errors`, { method: 'DELETE' });
  },

  async getConsoleLogs(limit = 200, source?: string, level?: string): Promise<{ logs: ConsoleLogEntry[] }> {
    const base = API_BASE ? API_BASE : window.location.origin;
    const url = new URL(`${base}/api/v1/logs/console`);
    url.searchParams.set('limit', String(limit));
    if (source) url.searchParams.set('source', source);
    if (level) url.searchParams.set('level', level);
    const res = await fetch(url.toString());
    return res.json();
  },

  async clearConsoleLogs(): Promise<void> {
    await fetch(`${API_BASE}/api/v1/logs/console`, { method: 'DELETE' });
  },

  subscribeLiveLogs(handlers: {
    onInit?: (data: {
      waState: WhatsAppState;
      metrics: SystemMetrics;
      recentLogs: DeliveryLog[];
      recentConsole: ConsoleLogEntry[];
      recentErrors: DetailedErrorLog[];
    }) => void;
    onWhatsAppState?: (state: WhatsAppState) => void;
    onDeliveryLog?: (log: DeliveryLog) => void;
    onDeliveryUpdate?: (log: DeliveryLog) => void;
    onConsoleLog?: (entry: ConsoleLogEntry) => void;
    onErrorLog?: (error: DetailedErrorLog) => void;
    onDeliveryCleared?: () => void;
    onErrorsCleared?: () => void;
    onConsoleCleared?: () => void;
  }): () => void {
    let eventSource: EventSource | null = null;
    let isClosed = false;

    function connect() {
      if (isClosed) return;
      const sseUrl = `${API_BASE}/api/v1/logs/live`;
      eventSource = new EventSource(sseUrl);

      eventSource.addEventListener('init', (e) => {
        try {
          handlers.onInit?.(JSON.parse(e.data));
        } catch (err) {
          console.error('SSE parse init error', err);
        }
      });

      eventSource.addEventListener('wa_state', (e) => {
        try {
          handlers.onWhatsAppState?.(JSON.parse(e.data));
        } catch (err) {
          console.error('SSE parse wa_state error', err);
        }
      });

      eventSource.addEventListener('delivery_log', (e) => {
        try {
          handlers.onDeliveryLog?.(JSON.parse(e.data));
        } catch (err) {
          console.error('SSE parse delivery_log error', err);
        }
      });

      eventSource.addEventListener('delivery_update', (e) => {
        try {
          handlers.onDeliveryUpdate?.(JSON.parse(e.data));
        } catch (err) {
          console.error('SSE parse delivery_update error', err);
        }
      });

      eventSource.addEventListener('console_log', (e) => {
        try {
          handlers.onConsoleLog?.(JSON.parse(e.data));
        } catch (err) {
          console.error('SSE parse console_log error', err);
        }
      });

      eventSource.addEventListener('error_log', (e) => {
        try {
          handlers.onErrorLog?.(JSON.parse(e.data));
        } catch (err) {
          console.error('SSE parse error_log error', err);
        }
      });

      eventSource.addEventListener('delivery_cleared', () => {
        handlers.onDeliveryCleared?.();
      });

      eventSource.addEventListener('errors_cleared', () => {
        handlers.onErrorsCleared?.();
      });

      eventSource.addEventListener('console_cleared', () => {
        handlers.onConsoleCleared?.();
      });

      eventSource.onerror = () => {
        eventSource?.close();
        if (!isClosed) {
          setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      isClosed = true;
      if (eventSource) {
        eventSource.close();
      }
    };
  },
};
