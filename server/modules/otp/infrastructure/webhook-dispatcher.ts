import { AppConfig } from '../../../core/config/app.config.js';
import { eventBus } from '../../../core/events/event-bus.js';

export interface WebhookEventPayload {
  event: 'otp.sent' | 'otp.delivered' | 'otp.read' | 'otp.failed';
  timestamp: string;
  data: {
    messageId?: string;
    recipient: string;
    maskedRecipient: string;
    status: string;
    appName: string;
    latencyMs?: number;
    error?: string;
  };
}

export class WebhookDispatcher {
  private messageWebhooks = new Map<string, string>(); // messageId -> webhookUrl

  public registerMessageWebhook(messageId: string, webhookUrl: string): void {
    if (!webhookUrl || !webhookUrl.startsWith('http')) return;
    this.messageWebhooks.set(messageId, webhookUrl);
  }

  public async dispatch(webhookUrl: string, payload: WebhookEventPayload): Promise<boolean> {
    if (!webhookUrl || !webhookUrl.startsWith('http')) return false;

    eventBus.emit('console:log', {
      level: 'info',
      source: 'hono-api',
      message: `Mengirim webhook event '${payload.event}' ke ${webhookUrl}...`,
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AppConfig.webhook.defaultTimeoutMs);

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WhatsApp-OTP-Gateway/1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        eventBus.emit('console:log', {
          level: 'success',
          source: 'hono-api',
          message: `Webhook '${payload.event}' terkirim sukses (HTTP ${res.status})`,
        });
        return true;
      } else {
        eventBus.emit('console:log', {
          level: 'warn',
          source: 'hono-api',
          message: `Webhook endpoint merespons dengan HTTP ${res.status}`,
        });
        return false;
      }
    } catch (err: any) {
      eventBus.emit('console:log', {
        level: 'warn',
        source: 'hono-api',
        message: `Gagal mengirim webhook ke ${webhookUrl}: ${err.message}`,
      });
      return false;
    }
  }

  public async triggerByMessageId(messageId: string, event: WebhookEventPayload['event'], extra: Partial<WebhookEventPayload['data']>): Promise<void> {
    const url = this.messageWebhooks.get(messageId);
    if (!url) return;

    await this.dispatch(url, {
      event,
      timestamp: new Date().toISOString(),
      data: {
        messageId,
        recipient: extra.recipient || '',
        maskedRecipient: extra.maskedRecipient || '',
        status: extra.status || event.replace('otp.', ''),
        appName: extra.appName || '',
        ...extra,
      },
    });

    if (event === 'otp.delivered' || event === 'otp.read' || event === 'otp.failed') {
      this.messageWebhooks.delete(messageId);
    }
  }
}

export const webhookDispatcher = new WebhookDispatcher();
