import {
  ApiKeyItem,
  ApiKeyStats,
  ConsoleLogEntry,
  DeliveryLog,
  DetailedErrorLog,
  DeveloperTokenResult,
  EcommerceEventData,
  EcommerceEventTemplate,
  EcommerceEventTriggerDto,
  EcommerceEventType,
  EcommerceTriggerResult,
  MemoryHealthInfo,
  QueueStats,
  RateLimitActivityResponse,
  RateLimitAccountStat,
  SystemMetrics,
  WebhookSimulationPreset,
  WebhookSimulationRequest,
  WebhookSimulationResponse,
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

  async getKeys(): Promise<{ success: boolean; keys: ApiKeyItem[]; stats: ApiKeyStats; secretPreview: string }> {
    const res = await fetch(`${API_BASE}/api/v1/keys`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async getRateLimitActivity(): Promise<RateLimitActivityResponse> {
    const res = await fetch(`${API_BASE}/api/v1/keys/rate-limit-activity`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async simulateRateLimitTraffic(payload: {
    clientId: string;
    successAdd?: number;
    throttledAdd?: number;
  }): Promise<{ success: boolean; message: string; data: RateLimitAccountStat }> {
    const res = await fetch(`${API_BASE}/api/v1/keys/rate-limit-activity/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal mensimulasikan lalu lintas');
    return data;
  },

  async resetRateLimitStats(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/api/v1/keys/rate-limit-activity/reset`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal mereset metrik');
    return data;
  },

  async createApiKey(payload: {
    clientName: string;
    clientId?: string;
    environment?: 'production' | 'staging' | 'development';
    permissions?: string[];
    expiresIn?: string;
  }): Promise<{ success: boolean; message: string; data: ApiKeyItem; sampleCurl: string }> {
    const res = await fetch(`${API_BASE}/api/v1/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal membuat kunci API');
    return data;
  },

  async rotateApiKey(
    id: string,
    payload: {
      gracePeriodHours?: number;
      newExpiresIn?: string;
      newPermissions?: string[];
    }
  ): Promise<{
    success: boolean;
    message: string;
    data: ApiKeyItem;
    newToken: string;
    previousTokenValidUntil?: string;
    sampleCurl: string;
  }> {
    const res = await fetch(`${API_BASE}/api/v1/keys/${id}/rotate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal merotasi kunci API');
    return data;
  },

  async revokeApiKey(
    id: string,
    reason?: string
  ): Promise<{ success: boolean; message: string; data: ApiKeyItem }> {
    const res = await fetch(`${API_BASE}/api/v1/keys/${id}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal mencabut kunci API');
    return data;
  },

  async deleteApiKey(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/api/v1/keys/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal menghapus kunci API');
    return data;
  },

  async getKeyDetails(id: string): Promise<{ success: boolean; data: ApiKeyItem; sampleCurl: string }> {
    const res = await fetch(`${API_BASE}/api/v1/keys/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
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

  async getMemoryHealth(): Promise<{ success: boolean; memory: MemoryHealthInfo }> {
    const res = await fetch(`${API_BASE}/api/v1/monitoring/memory`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async triggerAutoPurge(): Promise<{ success: boolean; result: any }> {
    const res = await fetch(`${API_BASE}/api/v1/monitoring/auto-purge`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async toggleAutoPurge(enabled: boolean): Promise<{ success: boolean; memory: MemoryHealthInfo }> {
    const res = await fetch(`${API_BASE}/api/v1/monitoring/auto-purge/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  // --- P-Queue Message Queue Methods ---
  async getQueueStats(): Promise<{ success: boolean; stats: QueueStats }> {
    const res = await fetch(`${API_BASE}/api/v1/queue/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async pauseQueue(): Promise<{ success: boolean; message: string; stats: QueueStats }> {
    const res = await fetch(`${API_BASE}/api/v1/queue/pause`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async resumeQueue(): Promise<{ success: boolean; message: string; stats: QueueStats }> {
    const res = await fetch(`${API_BASE}/api/v1/queue/resume`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async clearQueue(): Promise<{ success: boolean; message: string; stats: QueueStats }> {
    const res = await fetch(`${API_BASE}/api/v1/queue/clear`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async purgeUnusedQueue(): Promise<{
    success: boolean;
    purgedCount: number;
    message: string;
    stats: QueueStats;
    memory: MemoryHealthInfo;
  }> {
    const res = await fetch(`${API_BASE}/api/v1/queue/purge-unused`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
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

  // --- E-Commerce Notifier Methods ---
  async getEcommerceTemplates(): Promise<{ success: boolean; count: number; templates: EcommerceEventTemplate[] }> {
    const res = await fetch(`${API_BASE}/api/v1/ecommerce/templates`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async updateEcommerceTemplate(
    id: EcommerceEventType,
    payload: { template?: string; enabled?: boolean }
  ): Promise<{ success: boolean; message: string; template: EcommerceEventTemplate }> {
    const res = await fetch(`${API_BASE}/api/v1/ecommerce/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal memperbarui template event e-commerce');
    return data;
  },

  async resetEcommerceTemplates(): Promise<{ success: boolean; message: string; templates: EcommerceEventTemplate[] }> {
    const res = await fetch(`${API_BASE}/api/v1/ecommerce/templates/reset`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async previewEcommerceTemplate(payload: {
    event: EcommerceEventType;
    template?: string;
    data?: EcommerceEventData;
  }): Promise<{ success: boolean; event: string; preview: string }> {
    const res = await fetch(`${API_BASE}/api/v1/ecommerce/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal mempratinjau template');
    return data;
  },

  async simulateEcommerceEvent(payload: EcommerceEventTriggerDto): Promise<EcommerceTriggerResult> {
    const res = await fetch(`${API_BASE}/api/v1/ecommerce/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  // --- Webhook Simulator API ---
  async getWebhookPresets(): Promise<{ success: boolean; count: number; presets: WebhookSimulationPreset[] }> {
    const res = await fetch(`${API_BASE}/api/v1/ecommerce/webhook-simulator/presets`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  async sendWebhookSimulation(payload: WebhookSimulationRequest): Promise<{ success: boolean; data: WebhookSimulationResponse }> {
    const res = await fetch(`${API_BASE}/api/v1/ecommerce/webhook-simulator/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal mengirim simulasi webhook');
    }
    return data;
  },

  async triggerEcommerceEvent(
    payload: EcommerceEventTriggerDto,
    token: string
  ): Promise<EcommerceTriggerResult> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }
    const res = await fetch(`${API_BASE}/api/v1/ecommerce/events`, {
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
