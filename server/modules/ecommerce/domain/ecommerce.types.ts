export type EcommerceEventType =
  | 'order_created'
  | 'payment_received'
  | 'order_processing'
  | 'shipping_dispatched'
  | 'order_delivered'
  | 'cod_confirmation'
  | 'abandoned_cart';

export interface EcommerceEventData {
  customerName?: string;
  orderId?: string;
  storeName?: string;
  itemsSummary?: string;
  totalAmount?: string;
  paymentMethod?: string;
  paymentInstruction?: string;
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  deliveryAddress?: string;
  checkoutUrl?: string;
  discountPromo?: string;
  estimateDays?: string;
  customData?: Record<string, string | number>;
  [key: string]: unknown;
}

export interface EcommerceEventTriggerDto {
  event: EcommerceEventType;
  to: string;
  data: EcommerceEventData;
  customMessage?: string;
  bypassRateLimit?: boolean;
  webhookUrl?: string;
}

export interface EcommerceEventTemplate {
  id: EcommerceEventType;
  title: string;
  badge: string;
  description: string;
  icon: string;
  enabled: boolean;
  template: string;
  sampleData: EcommerceEventData;
}

export interface EcommerceTriggerResult {
  success: boolean;
  message: string;
  data: {
    messageId: string;
    event: EcommerceEventType;
    recipient: string;
    maskedRecipient: string;
    storeName: string;
    orderId?: string;
    compiledMessage: string;
    sentAt: string;
    latencyMs: number;
    simulatedTypingMs: number;
  };
}
