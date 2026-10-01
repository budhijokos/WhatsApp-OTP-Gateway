import { useState } from 'react';
import { CodeBlock } from '../../components/CodeBlock';

export function CodeSamples() {
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python' | 'php' | 'go' | 'json'>('curl');
  const baseUrl = window.location.origin;

  const samples = {
    curl: `# 1. Mengirim OTP WhatsApp dengan Simulasi Anti-Ban & Webhook
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

# 2. Respon Sukses (HTTP 200 OK)
# {
#   "success": true,
#   "message": "OTP berhasil dikirim ke nomor WhatsApp penerima",
#   "data": {
#     "messageId": "3EB0C8921817502B",
#     "recipient": "+6281234567890",
#     "maskedRecipient": "+6281****890",
#     "otp": "849201",
#     "appName": "FinPay Security",
#     "sentAt": "2026-10-01T07:15:00.000Z",
#     "latencyMs": 1420,
#     "simulatedTypingMs": 1280
#   }
# }

# 3. Verifikasi Kode OTP (POST /api/v1/otp/verify)
curl -X POST "${baseUrl}/api/v1/otp/verify" \\
  -H "Authorization: Bearer <YOUR_DEVELOPER_JWT_TOKEN>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "081234567890",
    "otp": "849201"
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

// 3. Response Verifikasi Berhasil (HTTP 200 OK)
{
  "success": true,
  "verified": true,
  "message": "Verifikasi OTP berhasil untuk nomor +6281****890.",
  "appName": "FinPay Security"
}

// 4. Response Terlalu Banyak Permintaan (HTTP 429 Too Many Requests)
{
  "success": false,
  "error": "Terlalu banyak permintaan: Harap tunggu 45 detik lagi sebelum mengirim OTP baru ke nomor ini.",
  "code": "RATE_LIMIT_COOLDOWN",
  "details": {
    "retryAfterSeconds": 45,
    "recipient": "+6281****890"
  }
}

// 5. Webhook Event Payload (Diterima oleh URL Webhook Anda)
{
  "event": "otp.delivered",
  "timestamp": "2026-10-01T07:45:00.000Z",
  "data": {
    "messageId": "3EB09F71B81029C",
    "recipient": "+6281234567890",
    "status": "delivered",
    "appName": "FinPay Security"
  }
}`,

    node: `// Node.js (fetch API standar ES6+)
async function sendWhatsAppOtp(phone, otpCode) {
  const token = process.env.WHATSAPP_GATEWAY_JWT; // Token dari tab Developer Auth
  
  const response = await fetch('${baseUrl}/api/v1/otp/send', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: phone,
      otp: otpCode,
      appName: 'FinPay Indonesia',
      expiresInMinutes: 5
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(\`[WhatsApp Gateway Error \${data.code}]: \${data.error}\`);
  }

  console.log('OTP terkirim via WhatsApp:', data.data.messageId);
  return data;
}

// Contoh pemanggilan:
sendWhatsAppOtp('081234567890', '984120');`,

    python: `# Python 3 (requests)
import os
import requests

GATEWAY_URL = "${baseUrl}/api/v1/otp/send"
JWT_TOKEN = os.getenv("WHATSAPP_GATEWAY_JWT", "YOUR_JWT_TOKEN_HERE")

def send_whatsapp_otp(phone: str, otp_code: str):
    headers = {
        "Authorization": f"Bearer {JWT_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "to": phone,
        "otp": otp_code,
        "appName": "FinPay Indonesia",
        "expiresInMinutes": 5
    }

    response = requests.post(GATEWAY_URL, json=payload, headers=headers)
    result = response.json()

    if response.status_code != 200:
        error_code = result.get("code", "UNKNOWN_ERROR")
        error_msg = result.get("error", "Gagal mengirim OTP")
        raise RuntimeError(f"[{error_code}] {error_msg}")

    print(f"OTP berhasil dikirim ke {result['data']['maskedRecipient']}")
    return result

# Eksekusi
send_whatsapp_otp("081234567890", "591024")`,

    php: `<?php
// PHP / Laravel Http Client
use Illuminate\\Support\\Facades\\Http;

function sendWhatsAppOtp($recipientPhone, $otpCode) {
    $token = env('WHATSAPP_GATEWAY_JWT');
    $url = '${baseUrl}/api/v1/otp/send';

    $response = Http::withToken($token)
        ->timeout(10)
        ->post($url, [
            'to' => $recipientPhone,
            'otp' => $otpCode,
            'appName' => 'FinPay Indonesia',
            'expiresInMinutes' => 5,
        ]);

    if ($response->failed()) {
        $error = $response->json();
        throw new Exception("[{$error['code']}]: {$error['error']}");
    }

    return $response->json();
}

// Pemanggilan:
$result = sendWhatsAppOtp('081234567890', '820491');
echo "ID Pesan: " . $result['data']['messageId'];`,

    go: `// Go (net/http)
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type OtpRequest struct {
	To               string \`json:"to"\`
	Otp              string \`json:"otp"\`
	AppName          string \`json:"appName"\`
	ExpiresInMinutes int    \`json:"expiresInMinutes"\`
}

func SendWhatsAppOtp(phone, otp string) error {
	payload := OtpRequest{
		To:               phone,
		Otp:              otp,
		AppName:          "FinPay Indonesia",
		ExpiresInMinutes: 5,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", "${baseUrl}/api/v1/otp/send", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer <YOUR_DEVELOPER_JWT_TOKEN>")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("gateway returned status: %d", resp.StatusCode)
	}

	fmt.Println("OTP successfully dispatched via WhatsApp")
	return nil
}`,
  };

  const tabs = [
    { id: 'curl', label: 'cURL' },
    { id: 'json', label: 'JSON Schemas' },
    { id: 'node', label: 'Node.js (Fetch)' },
    { id: 'python', label: 'Python' },
    { id: 'php', label: 'PHP / Laravel' },
    { id: 'go', label: 'Go' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">Contoh Integrasi Multi-Bahasa</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Snippet kode siap pakai dengan format header Authorization Bearer JWT.
          </p>
        </div>
      </div>

      <div className="flex items-center p-1 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveLang(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeLang === tab.id
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <CodeBlock
        code={samples[activeLang]}
        language={activeLang === 'json' ? 'json' : activeLang === 'curl' ? 'bash' : activeLang}
        title={`Contoh Implementasi: ${tabs.find((t) => t.id === activeLang)?.label}`}
      />
    </div>
  );
}
