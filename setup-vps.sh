#!/usr/bin/env bash

# ==============================================================================
# Script Otomatis Setup WhatsApp OTP Gateway di VPS Ubuntu (Node.js 22 + PM2 + Nginx)
# ==============================================================================

set -e

echo "🚀 [1/6] Memperbarui repositori paket Ubuntu..."
sudo apt update -y && sudo apt upgrade -y
sudo apt install -y curl git ufw build-essential nginx certbot python3-certbot-nginx

echo "📦 [2/6] Memeriksa instalasi Node.js 22 LTS..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]]; then
    echo "Menginstall Node.js 22 LTS via NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "⚙️ [3/6] Memasang PM2 secara global..."
sudo npm install -g pm2

echo "📥 [4/6] Memasang dependensi proyek..."
npm install

echo "🛠️ [5/6] Membangun frontend React untuk produksi..."
npm run build

echo "📁 Membuat folder logs jika belum ada..."
mkdir -p logs

echo "🚀 [6/6] Menjalankan server backend dengan PM2..."
if pm2 list | grep -q "whatsapp-otp-gateway"; then
    pm2 reload ecosystem.config.cjs --env production
else
    pm2 start ecosystem.config.cjs --env production
fi

# Simpan state PM2 agar otomatis menyala saat server reboot
pm2 save
pm2 startup systemd -u $USER --hp $HOME || true

echo ""
echo "=============================================================================="
echo "✅ WhatsApp OTP Gateway BERHASIL DIKONFIGURASI DAN AKTIF DI PM2!"
echo "=============================================================================="
echo "📊 Cek status server:  pm2 status"
echo "📜 Cek log real-time:  pm2 logs whatsapp-otp-gateway"
echo "🌐 Akses lokal:        http://127.0.0.1:3000"
echo "=============================================================================="
echo ""
