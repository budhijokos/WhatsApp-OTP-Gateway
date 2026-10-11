import { useState } from 'react';
import { CodeBlock } from '../../components/CodeBlock';

export function CodeSamples() {
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python' | 'php' | 'go' | 'json'>('curl');
  const baseUrl = window.location.origin;

  const samples = {
    curl: `# =========================================================================
# 1. PENGIRIMAN OTP WHATSAPP (POST /api/v1/otp/send)
# =========================================================================
curl -X POST "${baseUrl}/api/v1/otp/send" \\
  -H "Authorization: Bearer <YOUR_DEVELOPER_JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "081234567890",
    "otp": "849201",
    "appName": "FinPay Security",
    "expiresInMinutes": 5,
    "webhookUrl": "https://api.yourdomain.com/webhooks/whatsapp"
  }'

# =========================================================================
# 2. VERIFIKASI KODE OTP (POST /api/v1/otp/verify)
# =========================================================================
curl -X POST "${baseUrl}/api/v1/otp/verify" \\
  -H "Authorization: Bearer <YOUR_DEVELOPER_JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "081234567890",
    "otp": "849201"
  }'

# =========================================================================
# 3. NOTIFIKASI EVENT E-COMMERCE & TOKO ONLINE (POST /api/v1/ecommerce/events)
# =========================================================================
curl -X POST "${baseUrl}/api/v1/ecommerce/events" \\
  -H "Authorization: Bearer <YOUR_DEVELOPER_JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "shipping_dispatched",
    "to": "081234567890",
    "data": {
      "customerName": "Budi Santoso",
      "orderId": "INV-202610-098",
      "storeName": "Toko Keren Official",
      "courier": "J&T Express",
      "trackingNumber": "JT9823481230ID",
      "trackingUrl": "https://cekresi.com/?no=JT9823481230ID",
      "totalAmount": "Rp 275.000"
    }
  }'`,

    json: `// 1. Request Body Kirim OTP (POST /api/v1/otp/send)
{
  "to": "081234567890",
  "otp": "849201",
  "appName": "FinPay Security",
  "expiresInMinutes": 5,
  "webhookUrl": "https://api.yourdomain.com/webhooks/whatsapp"
}

// 2. Request Body Verifikasi OTP (POST /api/v1/otp/verify)
{
  "to": "081234567890",
  "otp": "849201"
}

// 3. Request Body Event E-Commerce (POST /api/v1/ecommerce/events)
{
  "event": "shipping_dispatched",
  "to": "081234567890",
  "data": {
    "customerName": "Budi Santoso",
    "orderId": "INV-202610-098",
    "storeName": "Toko Keren Official",
    "courier": "J&T Express",
    "trackingNumber": "JT9823481230ID",
    "trackingUrl": "https://cekresi.com/?no=JT9823481230ID",
    "totalAmount": "Rp 275.000"
  }
}

// 4. Response Berhasil Notifikasi E-Commerce (HTTP 200 OK)
{
  "success": true,
  "message": "Notifikasi Paket Dikirim & Resi Tersedia berhasil dikirim ke WhatsApp pelanggan.",
  "data": {
    "messageId": "3EB09F71B81029C",
    "event": "shipping_dispatched",
    "recipient": "+6281234567890",
    "maskedRecipient": "+6281****890",
    "storeName": "Toko Keren Official",
    "orderId": "INV-202610-098",
    "latencyMs": 1320,
    "simulatedTypingMs": 1150
  }
}`,

    node: `// Node.js (fetch API standar ES6+)
const API_BASE = '${baseUrl}';
const JWT_TOKEN = process.env.WHATSAPP_GATEWAY_JWT;

// 1. Fungsi Kirim OTP
async function sendWhatsAppOtp(phone, otpCode) {
  const res = await fetch(\`\${API_BASE}/api/v1/otp/send\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${JWT_TOKEN}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: phone,
      otp: otpCode,
      appName: 'Toko Keren Security',
      expiresInMinutes: 5
    })
  });
  return res.json();
}

// 2. Fungsi Notifikasi Event E-Commerce (Resi / Pesanan / COD)
async function sendEcommerceNotification(phone, eventType, orderData) {
  const res = await fetch(\`\${API_BASE}/api/v1/ecommerce/events\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${JWT_TOKEN}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event: eventType, // e.g: 'shipping_dispatched', 'order_created', 'payment_received'
      to: phone,
      data: orderData
    })
  });
  return res.json();
}

// Contoh Kirim Resi Ekspedisi:
sendEcommerceNotification('081234567890', 'shipping_dispatched', {
  customerName: 'Budi Santoso',
  orderId: 'INV-202610-098',
  storeName: 'Toko Keren Official',
  courier: 'J&T Express',
  trackingNumber: 'JT9823481230ID',
  trackingUrl: 'https://cekresi.com/?no=JT9823481230ID',
  totalAmount: 'Rp 275.000'
}).then(res => console.log('Sukses:', res));`,

    python: `# Python 3 (requests)
import os
import requests

API_BASE = "${baseUrl}"
JWT_TOKEN = os.getenv("WHATSAPP_GATEWAY_JWT", "YOUR_JWT_TOKEN_HERE")
HEADERS = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

# 1. Kirim OTP
def send_otp(phone: str, otp_code: str):
    payload = {
        "to": phone,
        "otp": otp_code,
        "appName": "Toko Keren Security",
        "expiresInMinutes": 5
    }
    res = requests.post(f"{API_BASE}/api/v1/otp/send", json=payload, headers=HEADERS)
    return res.json()

# 2. Kirim Notifikasi E-Commerce (Event-Driven)
def trigger_ecommerce_event(phone: str, event_type: str, data: dict):
    payload = {
        "event": event_type,
        "to": phone,
        "data": data
    }
    res = requests.post(f"{API_BASE}/api/v1/ecommerce/events", json=payload, headers=HEADERS)
    return res.json()

# Contoh Eksekusi Resi Ekspedisi
trigger_ecommerce_event("081234567890", "shipping_dispatched", {
    "customerName": "Budi Santoso",
    "orderId": "INV-202610-098",
    "storeName": "Toko Keren Official",
    "courier": "J&T Express",
    "trackingNumber": "JT9823481230ID",
    "trackingUrl": "https://cekresi.com/?no=JT9823481230ID",
    "totalAmount": "Rp 275.000"
})`,

    php: `<?php
// PHP / Laravel Http Client
use Illuminate\\Support\\Facades\\Http;

$token = env('WHATSAPP_GATEWAY_JWT');
$baseUrl = '${baseUrl}';

// 1. Kirim OTP
function sendWhatsAppOtp($phone, $otpCode) {
    global $token, $baseUrl;
    return Http::withToken($token)
        ->post("$baseUrl/api/v1/otp/send", [
            'to' => $phone,
            'otp' => $otpCode,
            'appName' => 'Toko Keren',
            'expiresInMinutes' => 5
        ])->json();
}

// 2. Kirim Notifikasi Pesanan E-Commerce
function sendOrderDispatched($phone, $order) {
    global $token, $baseUrl;
    return Http::withToken($token)
        ->post("$baseUrl/api/v1/ecommerce/events", [
            'event' => 'shipping_dispatched',
            'to' => $phone,
            'data' => [
                'customerName'   => $order['customer_name'],
                'orderId'        => $order['invoice_no'],
                'storeName'      => 'Toko Keren Official',
                'courier'        => $order['courier_name'],
                'trackingNumber' => $order['tracking_number'],
                'trackingUrl'    => 'https://cekresi.com/?no=' . $order['tracking_number'],
                'totalAmount'    => $order['total_amount']
            ]
        ])->json();
}`,

    go: `// Go (net/http)
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

const BaseURL = "${baseUrl}"
const JWTToken = "YOUR_JWT_TOKEN"

type EcommerceEventRequest struct {
	Event string                 \`json:"event"\`
	To    string                 \`json:"to"\`
	Data  map[string]interface{} \`json:"data"\`
}

func TriggerEcommerceEvent(to, eventType string, data map[string]interface{}) error {
	reqBody, _ := json.Marshal(EcommerceEventRequest{
		Event: eventType,
		To:    to,
		Data:  data,
	})

	req, _ := http.NewRequest("POST", BaseURL+"/api/v1/ecommerce/events", bytes.NewBuffer(reqBody))
	req.Header.Set("Authorization", "Bearer "+JWTToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	fmt.Println("Status pengiriman WhatsApp:", resp.Status)
	return nil
}`,
  };

  return (
    <div className="space-y-4">
      {/* Language Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveLang('curl')}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer shrink-0 ${
            activeLang === 'curl' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          cURL
        </button>
        <button
          onClick={() => setActiveLang('json')}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer shrink-0 ${
            activeLang === 'json' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          JSON Payload
        </button>
        <button
          onClick={() => setActiveLang('node')}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer shrink-0 ${
            activeLang === 'node' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Node.js (Fetch)
        </button>
        <button
          onClick={() => setActiveLang('python')}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer shrink-0 ${
            activeLang === 'python' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Python 3 (Requests)
        </button>
        <button
          onClick={() => setActiveLang('php')}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer shrink-0 ${
            activeLang === 'php' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          PHP / Laravel
        </button>
        <button
          onClick={() => setActiveLang('go')}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer shrink-0 ${
            activeLang === 'go' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Go (net/http)
        </button>
      </div>

      {/* Code Display */}
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <CodeBlock
          language={activeLang === 'curl' ? 'bash' : activeLang === 'node' ? 'typescript' : activeLang}
          code={samples[activeLang]}
        />
      </div>
    </div>
  );
}
