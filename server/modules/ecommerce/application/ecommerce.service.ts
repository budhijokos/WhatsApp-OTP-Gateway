import { AppConfig } from '../../../core/config/app.config.js';
import { ErrorCodes } from '../../../core/errors/error-codes.js';
import { ServiceUnavailableError, ValidationError } from '../../../core/errors/app-error.js';
import { eventBus } from '../../../core/events/event-bus.js';
import { whatsAppService } from '../../whatsapp/application/whatsapp.service.js';
import { dispatchQueueService } from '../../../core/queue/dispatch-queue.service.js';
import { PhoneFormatter } from '../../otp/domain/phone-formatter.js';
import { otpRateLimiter } from '../../otp/domain/rate-limiter.js';
import { webhookDispatcher } from '../../otp/infrastructure/webhook-dispatcher.js';
import {
  ecommerceTemplateEngine,
} from '../domain/ecommerce-template.engine.js';
import {
  EcommerceEventData,
  EcommerceEventTemplate,
  EcommerceEventTriggerDto,
  EcommerceEventType,
  EcommerceTriggerResult,
} from '../domain/ecommerce.types.js';

export class EcommerceService {
  public async triggerEvent(
    dto: EcommerceEventTriggerDto,
    developerId: string = 'dev_system',
    developerName?: string
  ): Promise<EcommerceTriggerResult> {
    const startTime = Date.now();
    const waState = whatsAppService.getState();
    const sock = whatsAppService.getActiveSocket();

    if (waState.status !== 'connected' || !sock) {
      throw new ServiceUnavailableError(
        'Gagal mengirim notifikasi: WhatsApp belum terhubung. Buka dasbor dan scan QR Code WhatsApp menggunakan menu "Perangkat Tertaut" pada aplikasi WhatsApp ponsel Anda.',
        ErrorCodes.WA_NOT_CONNECTED
      );
    }

    if (!dto.event) {
      throw new ValidationError('Tipe event e-commerce wajib disertakan (contoh: order_created, shipping_dispatched)');
    }

    const tplConfig = ecommerceTemplateEngine.getById(dto.event);
    if (!tplConfig) {
      throw new ValidationError(`Tipe event "${dto.event}" tidak dikenali oleh sistem.`);
    }

    if (!tplConfig.enabled && !dto.customMessage) {
      throw new ValidationError(
        `Notifikasi untuk event "${tplConfig.title}" sedang dinonaktifkan di pengaturan template. Aktifkan terlebih dahulu untuk mengirimkan pesan.`
      );
    }

    // 1. Normalize & Validate Phone Number
    const cleanNumber = PhoneFormatter.validate(dto.to);
    const maskedPhone = PhoneFormatter.mask(cleanNumber);
    const jid = PhoneFormatter.toJid(cleanNumber);

    // 2. Enforce Rate Limiter & Cooldown
    otpRateLimiter.checkAndRecord(cleanNumber, developerId, dto.bypassRateLimit);

    // 3. Compile Message
    const rawTemplate = dto.customMessage || tplConfig.template;
    const storeName = dto.data?.storeName || AppConfig.otp.defaultAppName;
    const eventData: EcommerceEventData = {
      ...dto.data,
      storeName,
    };

    const compiledMessage = ecommerceTemplateEngine.compile(rawTemplate, eventData);
    const logId = 'ecom_' + Math.random().toString(36).substring(2, 9);
    const sentAt = new Date().toISOString();
    const orderIdTag = dto.data?.orderId ? `[Order #${dto.data.orderId}] ` : '';

    // Record initial pending log to monitoring
    eventBus.emit('delivery:created', {
      id: logId,
      recipient: '+' + cleanNumber,
      maskedRecipient: '+' + maskedPhone,
      otp: dto.data?.orderId ? `Order #${dto.data.orderId}` : tplConfig.badge,
      appName: storeName,
      status: 'pending',
      sentAt,
      latencyMs: 0,
      developerId,
      developerName,
    });

    eventBus.emit('console:log', {
      level: 'info',
      source: 'ecommerce',
      message: `Mempersiapkan pengiriman notifikasi [${tplConfig.title}] ${orderIdTag}ke +${maskedPhone} (Toko: ${storeName})...`,
    });

    // 4. Queue Task via P-Queue with Anti-Ban Presence Simulation
    return await dispatchQueueService.enqueue(
      async () => {
        let typingDelayMs = 0;
        if (AppConfig.simulation.typingPresence) {
          typingDelayMs = Math.floor(
            AppConfig.simulation.minTypingDelayMs +
              Math.random() * (AppConfig.simulation.maxTypingDelayMs - AppConfig.simulation.minTypingDelayMs)
          );

          try {
            await sock.sendPresenceUpdate('composing', jid);
            await new Promise((resolve) => setTimeout(resolve, typingDelayMs));
            await sock.sendPresenceUpdate('paused', jid);
          } catch {
            // Fallback gracefully
          }
        }

        try {
          const result = await sock.sendMessage(jid, { text: compiledMessage });
          const latencyMs = Date.now() - startTime;
          const messageId = result?.key?.id || 'wa_' + Date.now();

          // Trigger Webhook if registered
          if (dto.webhookUrl) {
            webhookDispatcher.registerMessageWebhook(messageId, dto.webhookUrl);
            webhookDispatcher.dispatch(dto.webhookUrl, {
              event: `ecommerce.${dto.event}`,
              timestamp: new Date().toISOString(),
              data: {
                messageId,
                recipient: '+' + cleanNumber,
                maskedRecipient: '+' + maskedPhone,
                status: 'sent',
                appName: storeName,
                orderId: dto.data?.orderId,
                latencyMs,
              },
            }).catch(() => {});
          }

          // Update delivery log to sent
          eventBus.emit('delivery:updated', {
            id: logId,
            status: 'sent',
            messageId,
            latencyMs,
          });

          eventBus.emit('console:log', {
            level: 'info',
            source: 'ecommerce',
            message: `Notifikasi [${tplConfig.title}] ${orderIdTag}berhasil terkirim ke +${maskedPhone} via P-Queue dalam ${latencyMs}ms.`,
          });

          return {
            success: true,
            message: `Notifikasi ${tplConfig.title} berhasil dikirim ke WhatsApp pelanggan.`,
            data: {
              messageId,
              event: dto.event,
              recipient: '+' + cleanNumber,
              maskedRecipient: '+' + maskedPhone,
              storeName,
              orderId: dto.data?.orderId,
              compiledMessage,
              sentAt,
              latencyMs,
              simulatedTypingMs: typingDelayMs,
            },
          };
        } catch (err: unknown) {
          const latencyMs = Date.now() - startTime;
          const errorMessage = err instanceof Error ? err.message : 'Kegagalan socket pengiriman WhatsApp';

          eventBus.emit('delivery:updated', {
            id: logId,
            status: 'failed',
            latencyMs,
            errorMessage,
          });

          eventBus.emit('console:log', {
            level: 'error',
            source: 'ecommerce',
            message: `Gagal mengirim notifikasi [${tplConfig.title}] ke +${maskedPhone}: ${errorMessage}`,
          });

          throw new ServiceUnavailableError(
            `Gagal mengirim notifikasi WhatsApp: ${errorMessage}`,
            ErrorCodes.WA_SEND_FAILED
          );
        }
      },
      { priority: 5, type: 'ecommerce', id: logId }
    );
  }

  public getTemplates(): EcommerceEventTemplate[] {
    return ecommerceTemplateEngine.getAll();
  }

  public getTemplate(id: EcommerceEventType): EcommerceEventTemplate | undefined {
    return ecommerceTemplateEngine.getById(id);
  }

  public updateTemplate(id: EcommerceEventType, template: string, enabled?: boolean): EcommerceEventTemplate {
    const updated = ecommerceTemplateEngine.update(id, template, enabled);
    if (!updated) {
      throw new ValidationError(`Template event "${id}" tidak ditemukan.`);
    }

    eventBus.emit('console:log', {
      level: 'info',
      source: 'ecommerce',
      message: `Template notifikasi e-commerce [${updated.title}] berhasil diperbarui. Status: ${
        updated.enabled ? 'Aktif' : 'Nonaktif'
      }`,
    });

    return updated;
  }

  public resetTemplates(): EcommerceEventTemplate[] {
    const resetList = ecommerceTemplateEngine.resetAll();
    eventBus.emit('console:log', {
      level: 'warn',
      source: 'ecommerce',
      message: 'Seluruh template notifikasi e-commerce telah direset ke bawaan sistem.',
    });
    return resetList;
  }

  public preview(event: EcommerceEventType, customTemplate?: string, customData?: EcommerceEventData): string {
    const tplConfig = ecommerceTemplateEngine.getById(event);
    if (!tplConfig) {
      throw new ValidationError(`Tipe event "${event}" tidak ditemukan.`);
    }
    const templateToCompile = customTemplate || tplConfig.template;
    const dataToCompile = customData || tplConfig.sampleData;
    return ecommerceTemplateEngine.compile(templateToCompile, dataToCompile);
  }
}

export const ecommerceService = new EcommerceService();
