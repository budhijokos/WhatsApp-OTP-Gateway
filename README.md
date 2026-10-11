# WhatsApp OTP Security Gateway

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Baileys](https://img.shields.io/badge/Baileys-Multi--Device-25D366?logo=whatsapp)](https://github.com/WhiskeySockets/Baileys)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Solusi *self-hosted* **WhatsApp OTP Gateway** independen yang dirancang untuk pengembang dan pemilik aplikasi yang membutuhkan pengiriman kode verifikasi OTP (One-Time Password) secara instan, aman, dan hemat biaya tanpa biaya langganan per pesan WhatsApp Business API resmi.

Dibangun di atas **Baileys Multi-Device**, sistem ini dilengkapi proteksi *anti-ban* (simulasi mengetik manusia 1.1s – 2.0s), pembatas laju pengiriman (*cooldown rate limiter* 60 detik per nomor), mesin kustomisasi template pesan dengan variabel dinamis, manajemen kunci API multi-klien (*zero-downtime rotation*), proteksi memori otomatis (*in-memory auto-purge*), serta mekanisme verifikasi kode mandiri (*built-in verification store*).

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
   - [Aktivitas Rate-Limiting & Telemetri Kunci](#6-aktivitas-rate-limiting--telemetri-kunci)
   - [Notifikasi E-Commerce & Toko Online](#7-notifikasi-e-commerce--toko-online)
8. [Panduan Deployment ke VPS Ubuntu (Direkomendasikan)](#panduan-deployment-ke-vps-ubuntu-direkomendasikan)
   - [1. Persiapan VPS & Update Sistem](#langkah-1-persiapan-vps--update-sistem)
   - [2. Pasang Node.js 22 LTS & PM2](#langkah-2-pasang-nodejs-22-lts--pm2)
   - [3. Clone Proyek & Pasang Dependensi](#langkah-3-clone-proyek--pasang-dependensi)
   - [4. Konfigurasi Lingkungan (.env) & Build](#langkah-4-konfigurasi-lingkungan-env--build)
   - [5. Jalankan Service dengan PM2 (24/7 Auto-Restart)](#langkah-5-jalankan-service-dengan-pm2-247-auto-restart)
   - [6. Konfigurasi Nginx Reverse Proxy & WebSocket](#langkah-6-konfigurasi-nginx-reverse-proxy--websocket)
   - [7. Pasang SSL Gratis Let's Encrypt (HTTPS)](#langkah-7-pasang-ssl-gratis-lets-encrypt-https)
   - [8. Pengaturan Firewall (UFW)](#langkah-8-pengaturan-firewall-ufw)
   - [9. Perintah Pemeliharaan & Update Cepat](#langkah-9-perintah-pemeliharaan--update-cepat)
9. [Panduan Deployment ke Google Cloud Run (24/7)](#panduan-deployment-ke-google-cloud-run-247)
10. [Struktur Direktori](#struktur-direktori)
11. [Praktik Terbaik Keamanan & Pemeliharaan](#praktik-terbaik-keamanan--pemeliharaan)

---

## Fitur Unggulan

* **Proaktif System Health Alert Banner:**
  * Deteksi otomatis kejenuhan buffer memori (*in-memory ring-buffer saturation*) dan frekuensi tinggi kegagalan permintaan OTP secara *real-time*.
  * Dilengkapi sakelar mode simulasi pengembang (*Dev Test Simulation Mode*) untuk menguji tampilan peringatan dan tombol mitigasi kapan saja.
* **P-Queue Antrian Pengiriman & Auto-Purge Memori:**
  * Penggunaan pustaka `p-queue` untuk manajemen antrian pengiriman pesan WhatsApp secara berurutan (*concurrency 1*) guna melindungi socket Baileys dan mencegah pemblokiran.
  * **Pembersihan Otomatis Antrian (*Auto-Purge Unused Queue*):** Ketika kapasitas Heap RAM atau buffer log mendekati batas kritis (Heap &ge; 180MB / High-Watermark 85%), sistem otomatis membatalkan dan menghapus antrian pesan yang tidak digunakan untuk mencegah *Out-of-Memory Crash* (`MEMORY_PRESSURE_QUEUE_PURGED`, HTTP 503).
* **Webhook Simulator & Local State History:**
  * Modul pengujian endpoint e-commerce langsung dari dasbor untuk mengirim payload event tiruan (`order_paid`, `order_shipped`, dll.) ke URL backend Anda.
  * Riwayat state lokal (*local state history*) agar pengembang dapat memilih kembali dan mengirim ulang payload uji secara instan tanpa mengetik ulang.
* **Kustomisasi Tampilan Widget Dasbor (*Widget Visibility Configuration*):**
  * Konfigurasi state interaktif di `DashboardOverview` yang memungkinkan pengembang menyembunyikan atau menampilkan widget metrik tertentu (misal: latensi, jumlah kegagalan, status queue) untuk memprioritaskan data yang paling penting.
* **Modal Tautan WhatsApp Responsif Mobile:**
  * Perbaikan dan pengoptimalan layout modal penautan QR Code & pairing code agar pas (*fit*), proporsional, dan nyaman digunakan di semua ukuran layar ponsel.
* **Bebas Biaya Per Pesan:** Menggunakan nomor WhatsApp reguler / WhatsApp Business Anda sendiri via protokol WebSocket Baileys MD tanpa biaya per percakapan Meta.
* **Proteksi Anti-Ban Teruji:**
  * **Simulasi Mengetik Alami (*Human Presence Typing*):** Server mengirim status `composing` (mengetik) selama 1.1 hingga 2.0 detik sebelum pesan terkirim guna menghindari deteksi bot otomatis Meta.
  * **Cooldown Rate Limiting Otomatis:** Jeda 60 detik per nomor tujuan untuk mencegah spamming dan penyalahgunaan.
* **Diagram Batang (*Bar Chart*) Visualisasi Rate-Limiting:**
  * Memantau perbandingan permintaan sukses (*HTTP 200*) vs dibatasi (*HTTP 429 Too Many Requests*) secara real-time per kunci API.
  * Mode tampilan *Berdampingan (Grouped)* dan *Rasio Bertumpuk (Stacked 100%)*.
  * Uji coba beban lalu lintas (*burst traffic simulation*) langsung dari antarmuka dasbor.
* **Pencarian Cerdas & Filter Log Pengiriman:**
  * Cari log pengiriman berdasarkan nomor telepon penerima (`08xxx` / `628xxx`), kode OTP, atau nama aplikasi.
  * Filter dropdown status (*Semua, Terkirim, Gagal, Pending*) dan filter kunci API pengembang spesifik.
  * Ekspor data tersaring ke format CSV dan JSON.
* **Proteksi In-Memory Auto-Purge:**
  * Mencegah *Out-of-Memory (OOM)* pada VPS dengan kapasitas RAM terbatas (1 GB – 2 GB).
  * Otomatis memangkas 35% log terlama saat kapasitas buffer mencapai 85% atau saat memori heap Node.js melampaui 220 MB.
  * Menjaga log kritis dan sesi OTP yang masih aktif.
* **2 Mode Pengiriman OTP Fleksibel:**
  * **Mode Acak Otomatis (*Gateway Auto-Generate*):** Cukup kirim nomor tujuan, server otomatis mengacak kode 6 digit kriptografis dan menyimpannya ke session store.
  * **Mode Kustom (*Developer-Supplied OTP*):** Jika backend Anda sudah memiliki generator OTP sendiri (misal dari database Laravel/Node.js/Django), cukup sertakan field `otp`.
* **Manajemen Kunci API Multi-Klien & Zero-Downtime Key Rotation:**
  * **Multi-Client Isolation:** Daftarkan berbagai aplikasi klien (Mobile iOS/Android, Web E-Commerce, Admin CRM, Microservice) dengan kredensial, lingkungan (`production`, `staging`, `development`), dan hak akses granular terpisah.
  * **Zero-Downtime Key Rotation:** Rotasi kunci JWT secara langsung dari dasbor dengan masa tenggang (*grace period* 24 jam, 48 jam, atau 7 hari). Kunci lama tetap diizinkan sementara waktu agar tim developer dapat memperbarui konfigurasi tanpa ada downtime transaksi OTP.
  * **Pencabutan Kunci Instan (*Immediate Revocation*):** Cabut akses kunci yang dicurigai bocor seketika dari dasbor dengan kode respon keamanan `401 AUTH_KEY_REVOKED`.
  * **Telemetri & Audit Log:** Pantau jumlah panggilan API (*usage count*), waktu terakhir digunakan (*last used at*), dan cuplikan integrasi siap pakai (cURL, Node.js, Python, PHP/Laravel).
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
│  └─────────┬─────────┘    └────────────┬────────────┘  │
│            ▼                           ▼               │
│  ┌───────────────────┐    ┌─────────────────────────┐  │
│  │ In-Memory Store   │◄───┤ Auto-Memory-Purge       │  │
│  │ (Ring Buffer Logs)│    │ (Threshold 85% / 220MB) │  │
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
NODE_ENV=production

# Kunci rahasia untuk menandatangani token JWT API Pengembang (wajib ganti!)
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
* `GET /api/v1/otp/logs` ➔ Mengambil daftar riwayat log pengiriman OTP terbaru (mendukung query parameter `?limit=100&status=sent`).
* `GET /api/v1/logs/errors` ➔ Mengambil riwayat log diagnostik galat.
* `GET /api/v1/logs/console` ➔ Mengambil riwayat log konsol server.
* `GET /api/v1/monitoring/memory` ➔ Status penggunaan memori heap Node.js & proteksi auto-purge.

---

### 6. Aktivitas Rate-Limiting & Telemetri Kunci
* `GET /api/v1/keys/rate-limit-activity` ➔ Mengambil metrik permintaan sukses vs throttled per kunci API untuk grafik visualisasi.
* `POST /api/v1/keys/rate-limit-activity/simulate` ➔ Mengirimkan simulasi lalu lintas beban untuk pengujian grafik.
* `POST /api/v1/keys/rate-limit-activity/reset` ➔ Mereset akumulasi metrik laju permintaan.

---

### 7. Notifikasi E-Commerce & Toko Online
Modul pengiriman pesan berbasis *event* untuk toko online, e-commerce, dan payment gateway.

* **Method:** `POST`
* **Path:** `/api/v1/ecommerce/events`
* **Headers:**
  * `Authorization: Bearer <JWT_TOKEN>`
  * `Content-Type: application/json`

#### Daftar Event yang Didukung:
1. `order_created`: Pesanan baru dibuat (menunggu pembayaran).
2. `payment_received`: Pembayaran lunas terverifikasi.
3. `order_processing`: Pesanan sedang dikemas oleh tim gudang.
4. `shipping_dispatched`: Paket diserahkan ke ekspedisi & nomor resi tersedia.
5. `order_delivered`: Paket telah sampai di alamat tujuan (permintaan review produk).
6. `cod_confirmation`: Konfirmasi pesanan COD anti-retur (pembeli balas *YA* atau *BATAL*).
7. `abandoned_cart`: Pengingat keranjang belanja checkout yang belum dibayar.

#### Contoh Request (Resi Ekspedisi Tersedia):
```bash
curl -X POST http://localhost:3000/api/v1/ecommerce/events \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
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
  }'
```

#### Endpoint Manajemen Template E-Commerce:
* `GET /api/v1/ecommerce/templates` ➔ Mengambil seluruh template event dan status aktif/nonaktifnya.
* `PUT /api/v1/ecommerce/templates/:id` ➔ Mengubah template atau sakelar aktif event tertentu.
* `POST /api/v1/ecommerce/templates/reset` ➔ Mengembalikan seluruh template ke standar bawaan sistem.
* `POST /api/v1/ecommerce/simulate` ➔ Menguji pengiriman dari antarmuka sandbox tanpa perlu token eksternal.

---

## Panduan Deployment ke VPS Ubuntu (Direkomendasikan)

Deployment ke VPS (Virtual Private Server) seperti **DigitalOcean, Linode, AWS EC2, Contabo, IdCloudHost, atau Biznet Gio** adalah metode yang paling direkomendasikan karena:
1. **Sesi WhatsApp Baileys Stabil Nonstop 24/7:** Koneksi WebSocket terus aktif tanpa risiko terkena *sleep / container freeze*.
2. **Persistensi Sesi Permanen:** Kredensial login di folder `.baileys_auth` tersimpan permanen di disk SSD VPS tanpa perlu scan ulang QR saat server restart.
3. **Kinerja Rendah Latensi:** Respon gateway berkisar antara 800ms – 1.4s.

### Spesifikasi VPS Minimum:
* **OS:** Ubuntu 22.04 LTS / 24.04 LTS (64-bit)
* **RAM:** 1 GB (Direkomendasikan 2 GB)
* **CPU:** 1 vCPU
* **Disk:** 20 GB SSD
* **Akses:** Akses SSH dengan pengguna berhak `sudo`

---

### Langkah 1: Persiapan VPS & Update Sistem
Login ke server VPS Anda melalui terminal SSH:

```bash
ssh root@IP_SERVER_VPS_ANDA
```

Perbarui paket sistem ke versi terbaru:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget build-essential ufw software-properties-common
```

---

### Langkah 2: Pasang Node.js 22 LTS & PM2
Pasang Node.js 22 LTS resmi melalui repositori NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi versi yang terpasang
node -v   # Output: v22.x.x
npm -v    # Output: 10.x.x

# Pasang Process Manager PM2 secara global
sudo npm install -g pm2
```

---

### Langkah 3: Clone Proyek & Pasang Dependensi
Tempatkan proyek pada direktori standar `/var/www`:

```bash
sudo mkdir -p /var/www
cd /var/www

# Clone repositori proyek Anda
git clone <URL_REPOSITORI_ANDA> WhatsApp-OTP-Gateway
cd WhatsApp-OTP-Gateway

# Berikan hak kepemilikan direktori kepada user aktif
sudo chown -R $USER:$USER /var/www/WhatsApp-OTP-Gateway

# Pasang seluruh dependensi NPM
npm install
```

---

### Langkah 4: Konfigurasi Lingkungan (.env) & Build
Salin template berkas `.env` dan sesuaikan nilainya:

```bash
cp .env.example .env
nano .env
```

Pastikan variabel berikut terisi dengan benar di `.env`:
```env
PORT=3000
NODE_ENV=production
JWT_SECRET=buat_kunci_rahasia_acak_yang_panjang_dan_aman_di_sini_2026
DEFAULT_APP_NAME="FinPay Security"
DEFAULT_EXPIRY_MINUTES=5
COOLDOWN_SECONDS=60
```
*(Tekan `CTRL + O`, lalu `Enter` untuk menyimpan, kemudian `CTRL + X` untuk keluar dari nano).*

Lakukan proses kompilasi frontend dan aset produksi:

```bash
npm run build
```

---

### Langkah 5: Jalankan Service dengan PM2 (24/7 Auto-Restart)
Proyek ini sudah dilengkapi berkas `ecosystem.config.cjs` siap pakai dengan batasan **1 instance** (sangat penting untuk kestabilan soket Baileys):

```bash
# Jalankan aplikasi via PM2 dengan environment production
npm run pm2:start
# atau perintah manual: pm2 start ecosystem.config.cjs --env production

# Simpan konfigurasi proses PM2 agar aktif
pm2 save

# Daftarkan PM2 agar otomatis berjalan saat VPS reboot
pm2 startup
```
*(Salin dan jalankan baris perintah `sudo env PATH=... pm2 startup systemd -u ... --hp ...` yang ditampilkan di terminal).*

#### Perintah Cek Status PM2:
```bash
pm2 status
npm run pm2:logs   # atau pm2 logs whatsapp-otp-gateway
```

---

### Langkah 6: Konfigurasi Nginx Reverse Proxy & WebSocket
Pasang web server Nginx untuk mem-proxy request HTTP/HTTPS dan WebSocket ke port aplikasi `3000`:

```bash
sudo apt install -y nginx
```

Buat berkas konfigurasi situs baru untuk gateway:

```bash
sudo nano /etc/nginx/sites-available/otp-gateway.conf
```

Salin dan sesuaikan konfigurasi berikut (ganti `otp.domainanda.com` dengan domain / subdomain Anda):

```nginx
server {
    listen 80;
    server_name otp.domainanda.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # Header Wajib untuk WebSocket Baileys & Server-Sent Events (SSE)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable buffering untuk streaming SSE realtime logs
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Aktifkan konfigurasi dan muat ulang Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/otp-gateway.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Langkah 7: Pasang SSL Gratis Let's Encrypt (HTTPS)
Amankan komunikasi API dan dasbor dengan sertifikat SSL gratis:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d otp.domainanda.com
```
*Ikuti petunjuk di layar (masukkan email dan setujui ToS). Certbot akan otomatis memperbarui konfigurasi Nginx menjadi HTTPS port 443 dan menjadwalkan auto-renewal.*

---

### Langkah 8: Pengaturan Firewall (UFW)
Lindungi server Anda dengan mengaktifkan firewall Ubuntu (UFW):

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Sekarang akses dasbor WhatsApp Gateway Anda melalui browser di:
```
https://otp.domainanda.com
```

Lakukan penautan nomor WhatsApp Anda melalui tombol **Tautkan WhatsApp** di pojok kanan atas dasbor (Scan QR atau Pairing Code).

---

### Langkah 9: Perintah Pemeliharaan & Update Cepat

Setiap kali Anda melakukan update kode dari repositori Git, cukup jalankan perintah satu baris berikut di VPS Anda:

```bash
cd /var/www/WhatsApp-OTP-Gateway && git pull && npm install && npm run build && npm run pm2:restart
```

#### Perintah Berguna Lainnya:
* **Melihat Log Realtime PM2:** `npm run pm2:logs`
* **Restart Manual Gateway:** `npm run pm2:restart`
* **Stop Sementara Gateway:** `npm run pm2:stop`
* **Cek Konsumsi Memori & CPU:** `pm2 monit`
* **Backup Sesi WhatsApp:**
  ```bash
  tar -czvf baileys_session_backup_$(date +%F).tar.gz /var/www/WhatsApp-OTP-Gateway/.baileys_auth
  ```

---

## Panduan Deployment ke Google Cloud Run (24/7)

Jika Anda lebih memilih arsitektur serverless di Google Cloud Platform, perhatikan konfigurasi wajib berikut agar koneksi WebSocket Baileys tidak terputus:

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
├── .api_keys.json               # Penyimpanan kredensial API key multi-klien (terenkripsi)
├── .baileys_auth/               # Sesi login terenkripsi Baileys (Multi-Device credentials)
├── ecosystem.config.cjs         # Konfigurasi PM2 production process manager (1 instance fork)
├── public/                      # Aset statis & ikon
├── server/                      # Arsitektur backend modular
│   ├── core/                   # Event bus, error handling, rate limiting middleware
│   └── modules/
│       ├── auth/               # JWT token generator, API key repository & zero-downtime rotation
│       ├── docs/               # OpenAPI 3.0 specification generator
│       ├── monitoring/         # Real-time console, in-memory log store, auto-purge, latency metrics
│       ├── otp/                # OTP Service, Verification Store, Rate Limiter, Template Engine
│       └── whatsapp/           # Baileys Socket Engine, QR & Pairing Handler
├── src/                         # Antarmuka frontend (React 19 + Tailwind v4 + Vite)
│   ├── components/             # Header, CodeBlock, Status Badges
│   ├── features/
│   │   ├── dashboard/          # Ringkasan analitik, diagram batang rate limiting, quickstart
│   │   ├── api-keys/           # Manajemen kunci API multi-klien, rotasi kunci, & cuplikan integrasi
│   │   ├── otp-tester/         # Sandbox uji coba kirim & verifikasi OTP
│   │   ├── template-editor/    # Kustomisasi template & WhatsApp Chat Preview
│   │   ├── delivery-logs/      # Riwayat log pengiriman dengan pencarian & filter multi-parameter
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

## Praktik Terbaik Keamanan & Pemeliharaan

1. **Jaga Kerahasiaan `JWT_SECRET`:** Selalu gunakan string acak yang kuat (minimal 32 karakter acak) pada environment produksi.
2. **Jangan Publikasikan `.baileys_auth`:** Folder `.baileys_auth` berisi kredensial kriptografi penaut akun WhatsApp Anda. Pastikan folder ini selalu terdaftar di `.gitignore`.
3. **Penyimpanan Kode OTP:** Gateway otomatis menghapus sesi OTP setelah berhasil diverifikasi atau saat masa kedaluwarsa habis untuk mencegah serangan *replay attack*.
4. **Proteksi Anti-Spam:** Jangan menonaktifkan fitur rate limiter (`bypassRateLimit`) pada *production*, kecuali untuk pengujian otomatis di lingkungan *staging*.
5. **Kebijakan 1 Instance PM2:** WhatsApp Baileys Multi-Device mengandalkan satu state koneksi soket per nomor. Pastikan pengaturan `instances` pada PM2 selalu bernilai `1` untuk mencegah konflik session handshake.
6. **Proteksi Memori Otomatis:** Fitur *In-Memory Auto-Purge* yang tertanam akan secara otomatis menjaga penggunaan RAM VPS tetap di bawah ambang batas aman tanpa memerlukan intervensi manual.

---

## Lisensi

Proyek ini dirilis di bawah lisensi **MIT**. Silakan gunakan, modifikasi, dan integrasikan ke dalam aplikasi bisnis atau personal Anda secara bebas.
