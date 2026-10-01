# Panduan Deployment Cloudflare (Pages & Worker)

Panduan lengkap untuk men-deploy aplikasi **WhatsApp OTP Gateway**:
* **Frontend (React Vite SPA)** ➔ **Cloudflare Pages**
* **Backend (Hono.js REST API)** ➔ **Cloudflare Workers**

---

## 1. Persiapan Awal
Pastikan Anda sudah menginstal CLI Wrangler di komputer lokal Anda:
```bash
npm install -g wrangler
# Login ke akun Cloudflare Anda
npx wrangler login
```

---

## 2. Deploy Backend ke Cloudflare Worker

Backend menggunakan engine **Hono.js** yang kompatibel dengan runtime edge Cloudflare Workers via `nodejs_compat`.

### Langkah A: Konfigurasi Secret
Setel secret token JWT di Cloudflare:
```bash
npx wrangler secret put JWT_SECRET
```
*(Ketikkan string rahasia yang kuat saat diminta).*

### Langkah B: Deploy Worker
Jalankan perintah deploy yang sudah disiapkan:
```bash
npm run deploy:worker
```
Setelah proses selesai, Cloudflare akan memberikan URL publik Worker Anda, misalnya:
`https://whatsapp-otp-gateway-api.<subdomain-anda>.workers.dev`

> **Catatan Penting Socket Baileys:**
> Engine WhatsApp Baileys membutuhkan koneksi TCP/WebSocket terus menerus ke server WhatsApp. Di serverless Cloudflare Workers, isolate dapat mengalami siklus *idle sleep*. 
> * **Rekomendasi Skala Produksi:** Gunakan Cloudflare Worker sebagai **API Gateway / Reverse Proxy** ke server Node.js fisik/VPS/Container via **Cloudflare Tunnel (`cloudflared`)** agar koneksi WhatsApp di `.baileys_auth` tetap tersambung 24/7 tanpa putus.

---

## 3. Deploy Frontend ke Cloudflare Pages

### Metode 1: Menggunakan Wrangler CLI (Instan)
1. Tentukan URL backend Worker Anda ke variabel `VITE_API_URL`:
   ```bash
   # Linux / macOS
   export VITE_API_URL="https://whatsapp-otp-gateway-api.<subdomain-anda>.workers.dev"

   # Windows PowerShell
   $env:VITE_API_URL="https://whatsapp-otp-gateway-api.<subdomain-anda>.workers.dev"
   ```
2. Build dan deploy ke Cloudflare Pages:
   ```bash
   npm run deploy:pages
   ```

### Metode 2: Hubungkan Git Repository di Cloudflare Dashboard
1. Buka **Cloudflare Dashboard** > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Pilih repository aplikasi ini.
3. Masukkan konfigurasi Build berikut:
   * **Framework preset**: `Vite`
   * **Build command**: `npm run build`
   * **Build output directory**: `dist`
4. Di bagian **Environment variables**, tambahkan:
   * `VITE_API_URL`: `https://whatsapp-otp-gateway-api.<subdomain-anda>.workers.dev`
5. Klik **Save and Deploy**.

> File routing SPA `public/_redirects` (`/* /index.html 200`) dan header keamanan `public/_headers` sudah otomatis disertakan di folder `dist/`.

---

## 4. Pengujian Hasil Deploy
Setelah kedua layanan aktif:
1. Buka URL Cloudflare Pages Anda (misal: `https://whatsapp-otp.pages.dev`).
2. Masuk ke tab **Swagger API** atau **Kirim OTP** untuk menguji komunikasi antara frontend Cloudflare Pages dengan backend Cloudflare Worker.
