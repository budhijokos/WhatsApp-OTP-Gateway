# WhatsApp OTP Security Gateway

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Baileys](https://img.shields.io/badge/Baileys-Multi--Device-25D366?logo=whatsapp)](https://github.com/WhiskeySockets/Baileys)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Solusi *self-hosted* **WhatsApp OTP Gateway** independen yang dirancang untuk pengembang dan pemilik aplikasi yang membutuhkan pengiriman kode verifikasi OTP (One-Time Password) secara instan, aman, dan hemat biaya tanpa biaya langganan per pesan WhatsApp Business API resmi.

Dibangun di atas **Baileys Multi-Device**, sistem ini dilengkapi proteksi *anti-ban* (simulasi mengetik manusia 1.1s – 2.0s), pembatas laju pengiriman (*cooldown rate limiter* 60 detik per nomor), mesin kustomisasi template pesan dengan variabel dinamis, serta mekanisme verifikasi kode mandiri (*built-in verification store*).

---

## Daftar Isi
1. [Fitur Unggulan](#fitur-unggulan)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Prasyarat Sistem](#prasyarat-sistem)
4. [Instalasi & Menjalankan Lokal](#instalasi--menjalankan-lokal)
5. [Variabel Lingkungan (.env)](#variabel-lingkungan-env)
6. [Panduan Penautan Nomor WhatsApp](#panduan-penautan-nomor-whatsapp)
7. [Dokumentasi REST API](#dokumentasi-rest-api)
   - [Autentikasi Pengembang (JWT)](#1-buat-token-jwt-pengembang)
   - [Kirim OTP (Auto / Custom)](#2-kirim-kode-otp)
   - [Verifikasi Kode OTP](#3-verifikasi-kode-otp)
   - [Kustomisasi Template Pesan](#4-manajemen-template-pesan)
   - [Cek Status & Metrik Gateway](#5-cek-koneksi--metrik-sistem)
8. [Panduan Deployment ke Cloud Run (24/7 Anti-Sleep)](#panduan-deployment-ke-google-cloud-run-247)
9. [Struktur Direktori](#struktur-direktori)
10. [Praktik Terbaik Keamanan](#praktik-terbaik-keamanan)

---

## Fitur Unggulan

* **Bebas Biaya Per Pesan:** Menggunakan nomor WhatsApp reguler / WhatsApp Business Anda sendiri via protokol WebSocket Baileys MD.
* **Proteksi Anti-Ban Teruji:**
  * **Simulasi Mengetik Alami (*Human Presence Typing*):** Server mengirim status `composing` (mengetik) selama 1.1 hingga 2.0 detik sebelum pesan terkirim guna menghindari deteksi bot otomatis Meta.
  * **Cooldown Rate Limiting Otomatis:** Jeda 60 detik per nomor tujuan untuk mencegah spamming dan penyalahgunaan.
* **2 Mode Pengiriman OTP Fleksibel:**
  * **Mode Acak Otomatis (*Gateway Auto-Generate*):** Cukup kirim nomor tujuan, server otomatis mengacak kode 6 digit kriptografis dan menyimpannya ke session store.
  * **Mode Kustom (*Developer-Supplied OTP*):** Jika backend Anda sudah memiliki generator OTP sendiri (misal dari database Laravel/Node.js/Django), cukup sertakan field `otp`.
* **Built-in Session Verification Store:**
  * Verifikasi kode langsung di gateway (`POST /api/v1/otp/verify`).
  * Proteksi *Brute-Force*: Batas maksimal 3 kali salah tebak per sesi.
  * *Auto-Invalidation*: Sesi otomatis terhapus saat sudah diverifikasi atau waktu habis (default 5 menit).
* **Kustomisasi Pesan WhatsApp Tingkat Lanjut:**
  * Editor template interaktif di dasbor dengan variabel dinamis: `{{otp}}`, `{{appName}}`, `{{expiresIn}}`, `{{phone}}`, `{{date}}`, `{{time}}`.
  * *Live WhatsApp Chat Bubble Preview* yang mensimulasikan tampilan persis aplikasi WhatsApp ponsel.
  * Preset siap pakai: Standar Keamanan, Minimalis & Cepat Salin, Ramah & E-Commerce, serta Finansial/Perbankan.
* **Dasbor Monitoring Lengkap:**
  * Metrik latensi pengiriman rata-rata (*delivery latency ms*).
  * Log pengiriman dengan masking nomor penerima (`+6281****890`).
  * Live Console Feed via Server-Sent Events (SSE).
  * Error Diagnostic Explorer dengan kode galat terstandarisasi dan saran perbaikan.
  * Dokumentasi Swagger / OpenAPI 3.0 terintegrasi (*Try-It-Out*).

---

## Arsitektur Sistem

```
[ Developer / App Backend ] 
            │ (HTTP POST / Bearer JWT)
            ▼
┌────────────────────────────────────────────────────────┐
│             WhatsApp OTP Security Gateway              │
│                                                        │
│  ┌───────────────────┐    ┌─────────────────────────┐  │
│  │  Auth & JWT Guard │    │ Cooldown Rate Limiter   │  │
│  └─────────┬─────────┘    └────────────┬────────────┘  │
│            ▼                           ▼               │
│  ┌───────────────────┐    ┌─────────────────────────┐  │
│  │  Template Engine  │    │  Verification Store     │  │
│  │ (Dynamic Compiler)│    │  (Max 3 Attempts/Expiry)│  │
│  └─────────┬─────────┘    └─────────────────────────┘  │
│            ▼                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Baileys Service (Multi-Device Socket Engine)    │  │
│  │  - Human Typing Simulation (1100ms - 2000ms)     │  │
│  │  - Keep-Alive Heartbeat 24/7                     │  │
│  │  - QR & Pairing Code Generator                   │  │
│  └─────────────────────────┬────────────────────────┘  │
└────────────────────────────┼───────────────────────────┘
                             │ (TLS Encrypted WebSocket)
                             ▼
                   [ Meta WhatsApp Servers ]
                             │
                             ▼
                   [ WhatsApp Penerima ]
```

---

## Prasyarat Sistem

* **Node.js:** Versi `>= 20.x` (Direkomendasikan Node.js 22 LTS).
* **NPM:** Versi `>= 10.x`.
* **Ponsel WhatsApp:** Nomor WhatsApp aktif yang akan ditautkan sebagai gateway pengirim.

---

## Instalasi & Menjalankan Lokal

1. **Clone repositori:**
   ```bash
   git clone <URL_REPOSITORI_ANDA>
   cd whatsapp-otp-gateway
   ```

2. **Pasang dependensi:**
   ```bash
   npm install
   ```

3. **Salin berkas konfigurasi lingkungan:**
   ```bash
   cp .env.example .env
   ```

4. **Jalankan server dalam mode pengembangan (Development):**
   ```bash
   npm run dev
   ```

5. Buka peramban Anda di:
   ```
   http://localhost:3000
   ```

---

## Variabel Lingkungan (.env)

Konfigurasikan nilai berikut pada berkas `.env`:

```env
# Port aplikasi server
PORT=3000

# Lingkungan (development | production)
NODE_ENV=development

# Kunci rahasia untuk menandatangani token JWT API Pengembang
JWT_SECRET=rahasia_jwt_sangat_aman_dan_panjang_minimal_32_karakter

# Default nama aplikasi pengirim pada pesan OTP
DEFAULT_APP_NAME="FinPay Security"

# Default durasi kedaluwarsa OTP dalam menit
DEFAULT_EXPIRY_MINUTES=5

# Durasi jeda anti-spam antar pengiriman ke nomor yang sama (dalam detik)
COOLDOWN_SECONDS=60
```

---

## Panduan Penautan Nomor WhatsApp

Terdapat dua metode praktis untuk menautkan nomor WhatsApp Anda ke gateway melalui modal **Tautkan WhatsApp**:

### Metode 1: Scan QR Code (Paling Cepat)
1. Buka dasbor pada tab mana saja, lalu klik tombol **Tautkan WhatsApp** di pojok kanan atas.
2. Pada tab **Scan QR Code**, sistem akan menampilkan kode QR dinamis.
3. Buka WhatsApp di ponsel pengirim Anda:
   * **Android:** Titik tiga di kanan atas > **Perangkat tertaut** > **Tautkan perangkat**.
   * **iPhone:** Menu **Pengaturan** > **Perangkat tertaut** > **Tautkan perangkat**.
4. Arahkan kamera ponsel ke QR Code pada layar hingga status berubah menjadi **Tersambung (Connected)**.

### Metode 2: Pairing Code 8-Digit (Tanpa Kamera)
1. Buka modal **Tautkan WhatsApp** dan pilih tab **Pairing Code**.
2. Masukkan nomor WhatsApp Anda (contoh: `081234567890` atau `6281234567890`).
3. Klik tombol **Dapatkan Kode Pairing**.
4. Sistem akan menampilkan kode 8 karakter (misal: `ABC1-XYZ2`).
5. Pada ponsel WhatsApp Anda, buka notifikasi penautan perangkat atau ketuk **Tautkan dengan nomor telepon**, lalu masukkan kode tersebut.

> **Catatan Persistensi:** Informasi login WhatsApp disimpan secara terenkripsi di folder `.baileys_auth/`. Jangan menghapus folder ini kecuali Anda ingin *logout* atau mengganti nomor WhatsApp.

---

## Dokumentasi REST API

Semua endpoint API diproteksi menggunakan **Bearer Token JWT** (dibuat melalui menu *Panduan Dev* di dasbor atau endpoint `/api/v1/auth/token`).

### 1. Buat Token JWT Pengembang
Endpoint untuk menghasilkan token otorisasi API pengembang.

* **Method:** `POST`
* **Path:** `/api/v1/auth/token`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "sub": "client_app_01",
    "name": "Backend Billing Service",
    "permissions": ["otp:send", "otp:read"],
    "expiresIn": "365d"
  }
  ```
* **Contoh Respons:**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "365d"
  }
  ```

---

### 2. Kirim Kode OTP
Mengirimkan pesan OTP ke nomor penerima dengan simulasi mengetik manusia (1.1s – 2.0s) dan jeda cooldown.

* **Method:** `POST`
* **Path:** `/api/v1/otp/send`
* **Headers:**
  * `Authorization: Bearer <JWT_TOKEN>`
  * `Content-Type: application/json`

#### Contoh A: Mode Acak Otomatis (Server Generate OTP)
```bash
curl -X POST http://localhost:3000/api/v1/otp/send \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "081234567890",
    "appName": "TokoKeren",
    "expiresInMinutes": 5
  }'
```

#### Contoh B: Mode Kode Manual (Kode Ditentukan Backend Anda)
```bash
curl -X POST http://localhost:3000/api/v1/otp/send \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "081234567890",
    "otp": "940218",
    "appName": "TokoKeren",
    "expiresInMinutes": 5
  }'
```

#### Contoh C: Menggunakan Template Pesan Khusus
```bash
curl -X POST http://localhost:3000/api/v1/otp/send \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "081234567890",
    "appName": "FinPay",
    "message": "Halo kak! Kode rahasia masuk *{{appName}}* Anda adalah 👉 *{{otp}}*. Berlaku {{expiresIn}} menit. Jangan dibagikan!"
  }'
```

#### Respons Berhasil (`200 OK`):
```json
{
  "success": true,
  "message": "OTP berhasil dikirim ke nomor WhatsApp penerima",
  "data": {
    "messageId": "3EB0C8921817502B",
    "recipient": "+6281234567890",
    "maskedRecipient": "+6281****890",
    "otp": "940218",
    "isAutoGenerated": false,
    "appName": "TokoKeren",
    "sentAt": "2026-10-01T09:40:00.000Z",
    "latencyMs": 1420,
    "simulatedTypingMs": 1250,
    "verificationExpiryMinutes": 5
  }
}
```

---

### 3. Verifikasi Kode OTP
Memvalidasi kode yang dimasukkan oleh pengguna akhir pada aplikasi Anda.

* **Method:** `POST`
* **Path:** `/api/v1/otp/verify`
* **Headers:**
  * `Authorization: Bearer <JWT_TOKEN>`
  * `Content-Type: application/json`
* **Body:**
  ```json
  {
    "to": "081234567890",
    "otp": "940218"
  }
  ```
* **Respons Sukses:**
  ```json
  {
    "success": true,
    "verified": true,
    "message": "Verifikasi OTP berhasil untuk nomor +6281****890.",
    "appName": "TokoKeren"
  }
  ```
* **Respons Salah Kode (Tersisa Percobaan):**
  ```json
  {
    "success": false,
    "verified": false,
    "message": "Kode OTP tidak cocok. Sisa 2 percobaan.",
    "attemptsRemaining": 2
  }
  ```

---

### 4. Manajemen Template Pesan
* `GET /api/v1/otp/template` ➔ Mengambil template aktif, daftar preset, dan variabel dinamis.
* `PUT /api/v1/otp/template` ➔ Memperbarui susunan template default (wajib ada tag `{{otp}}`).
* `POST /api/v1/otp/template/reset` ➔ Mengembalikan template ke standar bawaan sistem.
* `POST /api/v1/otp/template/preview` ➔ Menguji output kompilasi teks pesan dengan data dummy.

---

### 5. Cek Koneksi & Metrik Sistem
* `GET /api/v1/status` ➔ Status koneksi WhatsApp Baileys (`connected`, `connecting`, `qr_ready`, `disconnected`), info perangkat, dan metrik total pengiriman.
* `GET /api/v1/logs` ➔ Mengambil daftar riwayat log pengiriman OTP terbaru.
* `GET /api/v1/errors` ➔ Mengambil riwayat log diagnostik galat.

---

## Panduan Deployment ke Google Cloud Run (24/7)

Secara default, Google Cloud Run memberlakukan *CPU throttling* dan *Scale-to-Zero* ketika kontainer sedang tidak melayani request HTTP. Agar WhatsApp Baileys dapat mempertahankan koneksi WebSocket nonstop 24 jam tanpa terputus, gunakan konfigurasi berikut:

### Konfigurasi Wajib:
1. **CPU Allocation:** Ubah menjadi **"CPU is always allocated"** (`--no-cpu-throttling`).
2. **Min Instances:** Set ke `1` (`--min-instances=1`) untuk mencegah server mati/mengalami *cold start*.
3. **Max Instances:** Set ke `1` (`--max-instances=1`) karena 1 nomor WhatsApp **tidak boleh** membuka sesi bersamaan dari 2 server berbeda.

### Perintah Deploy dengan `gcloud` CLI:
```bash
gcloud run deploy whatsapp-otp-gateway \
  --image gcr.io/<PROJECT_ID>/whatsapp-otp-gateway:latest \
  --platform managed \
  --region asia-southeast1 \
  --cpu 1 \
  --memory 512Mi \
  --min-instances 1 \
  --max-instances 1 \
  --no-cpu-throttling \
  --set-env-vars "NODE_ENV=production,JWT_SECRET=isi_kunci_rahasia_panjang_anda"
```

### Rekomendasi Persistensi Login di Cloud:
Karena disk kontainer Cloud Run bersifat *ephemeral*, mount bucket **Google Cloud Storage (GCS)** ke folder `.baileys_auth` menggunakan fitur **Cloud Storage FUSE Volume Mount**. Dengan demikian, Anda dapat men-deploy versi baru aplikasi berkali-kali tanpa harus memindai ulang QR Code.

---

## Struktur Direktori

```
├── .baileys_auth/               # Sesi login terenkripsi Baileys (Multi-Device credentials)
├── public/                      # Aset statis & logo
├── server/                      # Arsitektur backend modular
│   ├── core/                   # Event bus, error handling, phone formatter
│   └── modules/
│       ├── auth/               # JWT token generator & middleware guard
│       ├── docs/               # OpenAPI 3.0 specification generator
│       ├── monitoring/         # Real-time console, latency metrics, error tracking
│       ├── otp/                # OTP Service, Verification Store, Rate Limiter, Template Engine
│       └── whatsapp/           # Baileys Socket Engine, QR & Pairing Handler
├── src/                         # Antarmuka frontend (React 19 + Tailwind v4 + Vite)
│   ├── components/             # Header, CodeBlock, Status Badges
│   ├── features/
│   │   ├── dashboard/          # Ringkasan analitik, metrik, pairing modal
│   │   ├── otp-tester/         # Sandbox uji coba kirim & verifikasi OTP
│   │   ├── template-editor/    # Kustomisasi template & WhatsApp Chat Preview
│   │   ├── delivery-logs/      # Riwayat log pengiriman detail
│   │   ├── error-logs/         # Debugging galat & saran resolusi
│   │   ├── console-feed/       # Live console terminal feed (SSE)
│   │   ├── developer-docs/     # Panduan integrasi kode (cURL, JS, Python, PHP, Golang)
│   │   └── swagger-viewer/     # OpenAPI interactive explorer
│   ├── services/               # API client library & SSE subscriptions
│   └── types/                  # TypeScript interface definitions
├── server.ts                   # Entry point server full-stack Express + Vite
├── package.json                # Dependensi proyek
└── vite.config.ts              # Konfigurasi bundler Vite
```

---

## Praktik Terbaik Keamanan

1. **Jaga Kerahasiaan `JWT_SECRET`:** Selalu gunakan string acak yang kuat (minimal 32 karakter acak) pada environment produksi.
2. **Jangan Publikasikan `.baileys_auth`:** Folder `.baileys_auth` berisi kredensial kriptografi penaut akun WhatsApp Anda. Pastikan folder ini selalu terdaftar di `.gitignore`.
3. **Penyimpanan Kode OTP:** Gateway otomatis menghapus sesi OTP setelah berhasil diverifikasi atau saat masa kedaluwarsa habis untuk mencegah serangan *replay attack*.
4. **Proteksi Anti-Spam:** Jangan menonaktifkan fitur rate limiter (`bypassRateLimit`) pada *production*, kecuali untuk pengujian otomatis di lingkungan *staging*.

---

## Lisensi

Proyek ini dirilis di bawah lisensi **MIT**. Silakan gunakan, modifikasi, dan integrasikan ke dalam aplikasi bisnis atau personal Anda secara bebas.
