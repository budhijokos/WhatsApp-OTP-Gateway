export function buildOpenApiSpec(serverUrl: string = '') {
  return {
    openapi: '3.0.3',
    info: {
      title: 'WhatsApp OTP Gateway API',
      version: '1.0.0',
      description:
        'Server REST API untuk pengiriman One-Time Password (OTP) via WhatsApp berbasis arsitektur Layered Modular Monolith (Hono.js + WhiskeySockets Baileys). Dilengkapi dengan otentikasi JWT Bearer, sistem logging status real-time, dan dokumentasi interaktif untuk pengembang aplikasi pihak ketiga.',
      contact: {
        name: 'Developer Integration Support',
        url: 'https://github.com/WhiskeySockets/Baileys',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: serverUrl || '/',
        description: 'Server Aktif / Local Gateway',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            "Masukkan token JWT dengan format: 'Bearer <token>'. Token dapat dibuat melalui endpoint POST /api/v1/auth/token atau pada menu Developer Auth di dasbor.",
        },
      },
      schemas: {
        SendOtpRequest: {
          type: 'object',
          required: ['to'],
          properties: {
            to: {
              type: 'string',
              description: 'Nomor WhatsApp tujuan penerima OTP (format lokal 08xxx atau internasional 628xxx).',
              example: '081234567890',
            },
            otp: {
              type: 'string',
              description: 'Opsional: Kode OTP yang akan dikirimkan. Jika dikosongkan/tidak diisi, server akan OTOMATIS mengacak kode 6 digit secara kriptografis.',
              example: '849201',
            },
            appName: {
              type: 'string',
              description: 'Nama aplikasi atau brand pengirim untuk disisipkan pada template pesan.',
              example: 'FinPay Indonesia',
              default: 'Aplikasi Layanan',
            },
            expiresInMinutes: {
              type: 'integer',
              description: 'Durasi masa aktif kode OTP dalam menit yang ditampilkan pada pesan.',
              example: 5,
              default: 5,
            },
            message: {
              type: 'string',
              description: 'Opsional: Pesan khusus (custom template) jika tidak ingin menggunakan template standar.',
              example: '🔐 Kode verifikasi FinPay Anda adalah *849201*. Berlaku 5 menit. Jangan bagikan kepada siapa pun.',
            },
            webhookUrl: {
              type: 'string',
              format: 'uri',
              description: 'Opsional: URL Webhook untuk menerima callback status pengiriman (sent, delivered, read, failed).',
              example: 'https://api.yourdomain.com/webhooks/whatsapp',
            },
          },
        },
        VerifyOtpRequest: {
          type: 'object',
          required: ['to', 'otp'],
          properties: {
            to: {
              type: 'string',
              description: 'Nomor WhatsApp penerima yang memverifikasi kode.',
              example: '081234567890',
            },
            otp: {
              type: 'string',
              description: 'Kode OTP yang dimasukkan oleh pengguna.',
              example: '849201',
            },
          },
        },
        VerifyOtpResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            verified: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Verifikasi OTP berhasil untuk nomor +6281****890.' },
            attemptsRemaining: { type: 'integer', example: 2 },
            appName: { type: 'string', example: 'FinPay Indonesia' },
          },
        },
        SendOtpResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'OTP berhasil dikirim ke penerima' },
            data: {
              type: 'object',
              properties: {
                messageId: { type: 'string', example: '3EB0C8921817502B' },
                recipient: { type: 'string', example: '+6281234567890' },
                maskedRecipient: { type: 'string', example: '+6281****890' },
                otp: { type: 'string', example: '849201' },
                appName: { type: 'string', example: 'FinPay Indonesia' },
                sentAt: { type: 'string', format: 'date-time', example: '2026-10-01T07:15:00.000Z' },
                latencyMs: { type: 'integer', example: 142 },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Unauthorized: Header Authorization tidak ditemukan' },
            code: { type: 'string', example: 'AUTH_HEADER_MISSING' },
            suggestedAction: {
              type: 'string',
              example: "Tambahkan header 'Authorization: Bearer <JWT_TOKEN>' ke request Anda.",
            },
            details: { type: 'object' },
            documentation: { type: 'string', example: '/api/docs' },
          },
        },
        TokenGenerateRequest: {
          type: 'object',
          required: ['sub', 'name'],
          properties: {
            sub: {
              type: 'string',
              description: 'Developer / Client Identifier unik.',
              example: 'app_finpay_backend',
            },
            name: {
              type: 'string',
              description: 'Nama aplikasi atau nama developer.',
              example: 'FinPay Core Auth Service',
            },
            permissions: {
              type: 'array',
              items: { type: 'string' },
              description: "Daftar hak akses (default: ['otp:send', 'otp:read', 'status:read']).",
              example: ['otp:send', 'otp:read', 'status:read'],
            },
            expiresIn: {
              type: 'string',
              description: "Masa berlaku token format zeit/ms (misal '30d', '90d', '365d').",
              example: '30d',
              default: '30d',
            },
          },
        },
        WhatsAppStatusResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['disconnected', 'connecting', 'qr_ready', 'connected'],
              example: 'connected',
            },
            phone: { type: 'string', nullable: true, example: '628123456789' },
            pushName: { type: 'string', nullable: true, example: 'Server WhatsApp Bot' },
            uptimeSeconds: { type: 'integer', example: 3600 },
            metrics: {
              type: 'object',
              properties: {
                total: { type: 'integer', example: 124 },
                sent: { type: 'integer', example: 120 },
                failed: { type: 'integer', example: 4 },
                successRate: { type: 'integer', example: 97 },
                avgLatencyMs: { type: 'integer', example: 154 },
              },
            },
          },
        },
      },
    },
    paths: {
      '/api/v1/auth/token': {
        post: {
          tags: ['Otentikasi Pengembang'],
          summary: 'Buat Token JWT Pengembang Baru',
          description:
            'Menghasilkan token JWT baru yang ditandatangani untuk digunakan oleh aplikasi eksternal saat memanggil endpoint pengiriman OTP.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/TokenGenerateRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Token JWT berhasil dibuat',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                      tokenType: { type: 'string', example: 'Bearer' },
                      expiresIn: { type: 'string', example: '30d' },
                      payload: { $ref: '#/components/schemas/TokenGenerateRequest' },
                      sampleCurl: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/auth/verify': {
        post: {
          tags: ['Otentikasi Pengembang'],
          summary: 'Validasi Token JWT Pengembang',
          description: 'Menguji apakah token JWT masih sah, belum kedaluwarsa, dan memeriksa izin yang tersemat.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token'],
                  properties: {
                    token: { type: 'string', description: 'String JWT token untuk diverifikasi' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Token valid',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      valid: { type: 'boolean', example: true },
                      developer: { type: 'object' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Token tidak valid atau kedaluwarsa',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/v1/keys': {
        get: {
          tags: ['Otentikasi & Developer Keys'],
          summary: 'Daftar Kunci API Klien & Metrik Rotasi',
          description: 'Mengambil seluruh daftar kunci API pengembang, status aktif/rotasi/revoked, serta statistik penggunaan.',
          responses: {
            '200': {
              description: 'Daftar kunci berhasil diambil',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      keys: { type: 'array', items: { type: 'object' } },
                      stats: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Otentikasi & Developer Keys'],
          summary: 'Buat Kunci API Klien Baru',
          description: 'Mendaftarkan aplikasi klien baru dan menghasilkan kunci JWT bertanda tangan digital.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['clientName'],
                  properties: {
                    clientName: { type: 'string', example: 'FinPay Android App' },
                    clientId: { type: 'string', example: 'finpay_android' },
                    environment: { type: 'string', enum: ['production', 'staging', 'development'], example: 'production' },
                    permissions: { type: 'array', items: { type: 'string' }, example: ['otp:send', 'otp:read'] },
                    expiresIn: { type: 'string', example: '365d' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Kunci API berhasil dibuat',
            },
          },
        },
      },
      '/api/v1/keys/{id}/rotate': {
        post: {
          tags: ['Otentikasi & Developer Keys'],
          summary: 'Rotasi Kunci API (Zero-Downtime Grace Period)',
          description: 'Merotasi kunci API dengan masa tenggang (grace period). Kunci lama tetap diizinkan sementara waktu untuk transisi tanpa downtime.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', example: 'key_abc123' },
              description: 'ID Kunci yang akan dirotasi',
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    gracePeriodHours: { type: 'integer', example: 24, description: 'Jam toleransi kunci lama sebelum hangus' },
                    newExpiresIn: { type: 'string', example: '90d' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Kunci berhasil dirotasi',
            },
          },
        },
      },
      '/api/v1/keys/{id}/revoke': {
        post: {
          tags: ['Otentikasi & Developer Keys'],
          summary: 'Cabut Kunci API (Immediate Revocation)',
          description: 'Mencabut dan menonaktifkan kunci API segera untuk perlindungan keamanan jika kunci terindikasi bocor.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string', example: 'key_abc123' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    reason: { type: 'string', example: 'Kunci lama terindikasi bocor' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Kunci berhasil dicabut',
            },
          },
        },
      },
      '/api/v1/otp/send': {
        post: {
          tags: ['Pengiriman OTP'],
          summary: 'Kirim Kode OTP WhatsApp (Membutuhkan JWT Bearer)',
          description:
            'Mengirimkan kode OTP ke nomor tujuan penerima melalui WhatsApp Baileys. Request harus menyertakan Header Authorization Bearer token.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SendOtpRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'OTP berhasil dikirim ke nomor tujuan',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/SendOtpResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Parameter request tidak valid (misal: nomor tujuan salah atau OTP kosong)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            '401': {
              description: 'Tidak terotentikasi: Header Authorization Bearer hilang, rusak, atau kedaluwarsa',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            '403': {
              description: "Akses ditolak: Token tidak memiliki izin 'otp:send'",
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            '429': {
              description: 'Terlalu banyak permintaan: Kuota akun developer terlampaui (RATE_LIMIT_EXCEEDED) atau cooldown nomor penerima (RATE_LIMIT_COOLDOWN)',
              headers: {
                'RateLimit-Limit': { schema: { type: 'integer' }, description: 'Maksimal permintaan per window menit' },
                'RateLimit-Remaining': { schema: { type: 'integer' }, description: 'Sisa kuota permintaan' },
                'RateLimit-Reset': { schema: { type: 'integer' }, description: 'Detik menuju reset kuota' },
                'Retry-After': { schema: { type: 'integer' }, description: 'Detik harus menunggu sebelum request ulang' },
              },
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            '503': {
              description: 'WhatsApp gateway belum terhubung atau socket terputus',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/v1/otp/verify': {
        post: {
          tags: ['Pengiriman OTP'],
          summary: 'Verifikasi Kode OTP WhatsApp (Terintegrasi)',
          description:
            'Memvalidasi apakah kode OTP yang dimasukkan pengguna cocok dengan sesi aktif, belum kedaluwarsa, dan belum melewati batas maksimal 3 kali percobaan.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/VerifyOtpRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Hasil verifikasi kode OTP',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/VerifyOtpResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Sesi OTP tidak ditemukan, kedaluwarsa, atau batas percobaan habis',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            '401': {
              description: 'Otentikasi token pengembang tidak valid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/v1/status': {
        get: {
          tags: ['WhatsApp Gateway'],
          summary: 'Cek Status Koneksi WhatsApp & Metrik',
          description:
            'Mengembalikan kondisi socket Baileys saat ini (terhubung, menunggu scan QR, atau terputus) beserta metrik pengiriman terkini.',
          responses: {
            '200': {
              description: 'Status WhatsApp server',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/WhatsAppStatusResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/qr': {
        get: {
          tags: ['WhatsApp Gateway'],
          summary: 'Ambil QR Code untuk Pairing',
          description: 'Mengambil DataURL dan string mentah QR Code saat status socket adalah qr_ready.',
          responses: {
            '200': {
              description: 'Data QR Code',
            },
          },
        },
      },
      '/api/v1/pair-code': {
        post: {
          tags: ['WhatsApp Gateway'],
          summary: 'Minta Kode Pairing 8-Digit (Tanpa Kamera)',
          description:
            'Meminta kode pairing 8 karakter untuk ditautkan via WhatsApp ponsel: Perangkat Tertaut -> Tautkan dengan nomor telepon saja.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['phoneNumber'],
                  properties: {
                    phoneNumber: { type: 'string', example: '081234567890' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Kode pairing berhasil didapatkan',
            },
          },
        },
      },
      '/api/v1/reconnect': {
        post: {
          tags: ['WhatsApp Gateway'],
          summary: 'Sambung Ulang Socket WhatsApp',
          description: 'Memicu inisialisasi ulang socket koneksi Baileys.',
          responses: {
            '200': {
              description: 'Perintah rekoneksi diterima',
            },
          },
        },
      },
      '/api/v1/reset-session': {
        post: {
          tags: ['WhatsApp Gateway'],
          summary: 'Reset Sesi WhatsApp & Hapus Kredensial',
          description: 'Memutuskan socket yang ada dan menghapus file sesi lokal agar dapat melakukan scan ulang baru.',
          responses: {
            '200': {
              description: 'Sesi di-reset',
            },
          },
        },
      },
      '/api/v1/otp/logs': {
        get: {
          tags: ['Log & Debugging'],
          summary: 'Daftar Riwayat Pengiriman OTP (In-Memory)',
          description: 'Mengambil riwayat pengiriman OTP dari memory buffer.',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 50 },
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ['sent', 'delivered', 'failed', 'pending'] },
            },
          ],
          responses: {
            '200': {
              description: 'Daftar log pengiriman',
            },
          },
        },
        delete: {
          tags: ['Log & Debugging'],
          summary: 'Bersihkan Riwayat Pengiriman OTP',
          responses: {
            '200': {
              description: 'Log berhasil dibersihkan',
            },
          },
        },
      },
      '/api/v1/logs/errors': {
        get: {
          tags: ['Log & Debugging'],
          summary: 'Daftar Log Error Rinci (Debugging)',
          description:
            'Mengembalikan daftar log error terperinci lengkap dengan kode error, payload data, dan saran perbaikan langsung.',
          responses: {
            '200': {
              description: 'Daftar log error',
            },
          },
        },
        delete: {
          tags: ['Log & Debugging'],
          summary: 'Bersihkan Log Error Debug',
          responses: {
            '200': {
              description: 'Log error berhasil dibersihkan',
            },
          },
        },
      },
      '/api/v1/logs/console': {
        get: {
          tags: ['Log & Debugging'],
          summary: 'Log Konsol Sistem Real-Time',
          description: 'Mengambil riwayat baris konsol server untuk keperluan audit dan monitoring.',
          responses: {
            '200': {
              description: 'Daftar baris konsol',
            },
          },
        },
        delete: {
          tags: ['Log & Debugging'],
          summary: 'Bersihkan Log Konsol',
          responses: {
            '200': {
              description: 'Log konsol berhasil dibersihkan',
            },
          },
        },
      },
      '/api/v1/ecommerce/events': {
        post: {
          tags: ['E-Commerce Notifier'],
          summary: 'Kirim Notifikasi Event E-Commerce & Toko Online',
          description:
            'Memicu pengiriman pesan WhatsApp otomatis berdasarkan status pesanan (order_created, payment_received, shipping_dispatched, order_delivered, cod_confirmation, abandoned_cart).',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['event', 'to'],
                  properties: {
                    event: {
                      type: 'string',
                      enum: [
                        'order_created',
                        'payment_received',
                        'order_processing',
                        'shipping_dispatched',
                        'order_delivered',
                        'cod_confirmation',
                        'abandoned_cart',
                      ],
                      example: 'shipping_dispatched',
                    },
                    to: {
                      type: 'string',
                      description: 'Nomor WhatsApp pembeli / penerima.',
                      example: '081234567890',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        customerName: { type: 'string', example: 'Budi Santoso' },
                        orderId: { type: 'string', example: 'INV-202610-098' },
                        storeName: { type: 'string', example: 'Toko Keren Official' },
                        courier: { type: 'string', example: 'J&T Express' },
                        trackingNumber: { type: 'string', example: 'JT9823481230ID' },
                        trackingUrl: { type: 'string', example: 'https://cekresi.com/?no=JT9823481230ID' },
                        totalAmount: { type: 'string', example: 'Rp 275.000' },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Notifikasi e-commerce berhasil dikirim ke WhatsApp pembeli',
            },
          },
        },
      },
      '/api/v1/ecommerce/templates': {
        get: {
          tags: ['E-Commerce Notifier'],
          summary: 'Daftar Template Event E-Commerce',
          description: 'Mengambil konfigurasi template dan status aktif/nonaktif untuk setiap jenis event pesanan.',
          responses: {
            '200': {
              description: 'Daftar template event e-commerce',
            },
          },
        },
      },
    },
  };
}
