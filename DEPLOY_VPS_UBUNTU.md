# Panduan Deployment WhatsApp OTP Gateway ke VPS (Ubuntu + Node.js)

Panduan lengkap langkah demi langkah untuk men-deploy **WhatsApp OTP Security Gateway** ke VPS Ubuntu (DigitalOcean, AWS EC2, Hetzner, Contabo, Linode, Vultr, IDCloudHost, dll.) agar berjalan **24/7 tanpa henti**.

---

## Ringkasan Alur Deployment
1. Persiapan Server Ubuntu & Instalasi Node.js 22 LTS + PM2
2. Clone Repositori & Instalasi Dependensi
3. Konfigurasi File Lingkungan (`.env`)
4. Build Frontend & Menjalankan Service dengan PM2
5. Konfigurasi Nginx Reverse Proxy (Dukungan WebSocket & SSE)
6. Pasang SSL HTTPS Gratis (Let's Encrypt Certbot)
7. Penautan Nomor WhatsApp & Pengujian

---

## Langkah 1: Persiapan Server & Instalasi Node.js 22

Login ke VPS Anda via SSH:
```bash
ssh root@IP_VPS_ANDA
```

Perbarui repositori sistem Ubuntu:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw build-essential
```

Pasang **Node.js 22 LTS** menggunakan NodeSource:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verifikasi versi Node.js dan NPM:
node -v # Harus v22.x.x
npm -v  # Harus v10.x.x
```

Pasang **PM2** (Process Manager agar aplikasi menyala 24/7 dan auto-restart saat server reboot):
```bash
sudo npm install -g pm2
```

---

## Langkah 2: Setup Direktori & Clone Aplikasi

Buat direktori proyek di `/var/www/`:
```bash
sudo mkdir -p /var/www
cd /var/www

# Clone repositori Anda:
git clone <URL_REPOSITORI_GIT_ANDA> whatsapp-otp-gateway
cd whatsapp-otp-gateway

# Pasang semua dependensi:
npm install
```

---

## Langkah 3: Konfigurasi Berkas `.env`

Salin contoh konfigurasi ke `.env`:
```bash
cp .env.example .env
nano .env
```

Sesuaikan isi `.env`:
```env
PORT=3000
NODE_ENV=production

# Ganti dengan teks rahasia acak yang panjang (minimal 32 karakter)
JWT_SECRET=kunci_rahasia_jwt_sangat_panjang_dan_aman_1234567890

DEFAULT_APP_NAME="FinPay Security"
DEFAULT_EXPIRY_MINUTES=5
COOLDOWN_SECONDS=60
```
*Tekan `CTRL + O`, lalu `ENTER` untuk menyimpan, kemudian `CTRL + X` untuk keluar dari nano.*

---

## Langkah 4: Build Frontend & Jalankan dengan PM2

1. **Build aset frontend React Vite:**
   ```bash
   npm run build
   ```

2. **Jalankan aplikasi full-stack menggunakan PM2:**
   ```bash
   pm2 start "npx tsx server.ts" --name "wa-otp-gateway"
   ```

3. **Aktifkan startup script PM2 agar otomatis menyala saat VPS reboot:**
   ```bash
   pm2 startup
   # Jalankan perintah yang ditampilkan oleh output di terminal (jika ada)
   pm2 save
   ```

4. **Periksa status aplikasi:**
   ```bash
   pm2 status
   pm2 logs wa-otp-gateway --lines 20
   ```

---

## Langkah 5: Konfigurasi Nginx (Reverse Proxy + WebSocket + SSE)

Pasang Web Server Nginx:
```bash
sudo apt install -y nginx
```

Buat berkas konfigurasi Nginx untuk domain/subdomain Anda (contoh: `otp.domainanda.com`):
```bash
sudo nano /etc/nginx/sites-available/wa-otp.conf
```

Tempelkan konfigurasi berikut:
```nginx
server {
    listen 80;
    server_name otp.domainanda.com; # Ganti dengan domain/subdomain Anda

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # Konfigurasi Header Standar
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Konfigurasi Wajib untuk WebSocket (Baileys) & SSE (Live Logs Feed)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```
*Tekan `CTRL + O` lalu `CTRL + X`.*

Aktifkan konfigurasi Nginx dan restart:
```bash
sudo ln -s /etc/nginx/sites-available/wa-otp.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Langkah 6: Pasang SSL HTTPS Gratis (Certbot Let's Encrypt)

Pastikan DNS domain Anda (A Record) sudah mengarah ke IP VPS Anda, lalu jalankan:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d otp.domainanda.com
```
*Ikuti instruksi di layar (masukkan email dan setujui ToS). Certbot akan otomatis mengubah konfigurasi Nginx menjadi HTTPS.*

---

## Langkah 7: Konfigurasi Firewall Server (UFW)

Amankan server dengan membuka hanya port yang diperlukan:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Langkah 8: Tautkan Nomor WhatsApp

1. Buka browser dan akses domain Anda: `https://otp.domainanda.com`
2. Klik tombol **Tautkan WhatsApp** di pojok kanan atas dasbor.
3. Pilih metode:
   * **Scan QR Code:** Buka WhatsApp di HP > *Perangkat Tertaut* > *Tautkan Perangkat* > Scan QR.
   * **Pairing Code:** Masukkan nomor telepon HP Anda > Masukkan 8 digit kode yang muncul ke WhatsApp HP.
4. Status akan berubah menjadi **Tersambung (Connected)**.

---

## Perintah Penting untuk Manajemen Sehari-hari

| Perintah | Deskripsi |
| :--- | :--- |
| `pm2 logs wa-otp-gateway` | Melihat log real-time aplikasi & Baileys socket |
| `pm2 restart wa-otp-gateway` | Restart ulang aplikasi |
| `pm2 stop wa-otp-gateway` | Menghentikan aplikasi sementara |
| `pm2 monit` | Monitoring CPU & penggunaan RAM secara interaktif |
| `cd /var/www/whatsapp-otp-gateway && git pull && npm run build && pm2 restart wa-otp-gateway` | Update aplikasi ke versi terbaru dari Git |
