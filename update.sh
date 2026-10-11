#!/usr/bin/env bash

# ==============================================================================
# Skrip Update & Redeploy Otomatis WhatsApp OTP Gateway
# ==============================================================================

set -e

echo "📥 [1/4] Mengambil pembaruan kode terbaru dari Git..."
git pull

echo "📦 [2/4] Memperbarui dependensi paket (jika ada)..."
npm install

echo "🛠️ [3/4] Melakukan build ulang frontend React..."
npm run build

echo "🔄 [4/4] Me-reload backend dengan zero-downtime via PM2..."
npm run pm2:restart

echo ""
echo "=============================================================================="
echo "✅ APLIKASI BERHASIL DI-UPDATE & DI-REDEPLOY!"
echo "📱 Sesi WhatsApp Anda tetap aman dan terhubung."
echo "=============================================================================="
echo ""
