import { EventEmitter } from 'events';

export type EventMap = {
  'console:log': {
    level: 'info' | 'success' | 'warn' | 'error';
    source: 'whatsapp' | 'hono-api' | 'auth' | 'system';
    message: string;
    meta?: Record<string, unknown>;
  };
  'error:logged': {
    category: 'auth' | 'socket' | 'validation' | 'delivery' | 'system' | 'ratelimit';
    code: string;
    title: string;
    details: unknown;
    suggestedAction: string;
  };
  'delivery:created': {
    id: string;
    recipient: string;
    maskedRecipient: string;
    otp: string;
    appName: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    sentAt: string;
    latencyMs: number;
    developerId: string;
    developerName?: string;
  };
  'delivery:updated': {
    id: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    messageId?: string;
    latencyMs?: number;
    errorMessage?: string;
  };
  'whatsapp:state_updated': unknown;
};

class TypedEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): boolean {
    return this.emitter.emit(event, payload);
  }

  on<K extends keyof EventMap>(event: K, listener: (payload: EventMap[K]) => void): this {
    this.emitter.on(event, listener as (...args: unknown[]) => void);
    return this;
  }

  off<K extends keyof EventMap>(event: K, listener: (payload: EventMap[K]) => void): this {
    this.emitter.off(event, listener as (...args: unknown[]) => void);
    return this;
  }
}

export const eventBus = new TypedEventBus();
