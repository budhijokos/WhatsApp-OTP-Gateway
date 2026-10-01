export class SwaggerService {
  public renderSwaggerUiHtml(specUrl: string = '/api/openapi.json'): string {
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>WhatsApp OTP Gateway API - Swagger Documentation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b1120;
      color: #e2e8f0;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .custom-topbar {
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .custom-topbar .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .custom-topbar .title {
      font-size: 15px;
      font-weight: 700;
      color: #f8fafc;
    }
    .custom-topbar .badge {
      font-size: 11px;
      font-family: monospace;
      background: #0284c7;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .custom-topbar .actions {
      display: flex;
      gap: 12px;
    }
    .custom-topbar a {
      color: #94a3b8;
      text-decoration: none;
      font-size: 12px;
      padding: 5px 12px;
      border-radius: 6px;
      border: 1px solid #334155;
      transition: all 0.15s ease;
    }
    .custom-topbar a:hover {
      color: #ffffff;
      background: #1e293b;
    }
    #loading-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #94a3b8;
      font-size: 14px;
      gap: 12px;
    }
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #1e293b;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .swagger-ui {
      filter: invert(88%) hue-rotate(180deg);
      padding-bottom: 60px;
    }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 24px 0; }
  </style>
</head>
<body>
  <div class="custom-topbar">
    <div class="brand">
      <span class="title">WhatsApp OTP Gateway API</span>
      <span class="badge">OpenAPI 3.0</span>
      <span class="badge" style="background:#16a34a;">REST API</span>
    </div>
    <div class="actions">
      <a href="/" target="_self">← Kembali ke Dasbor</a>
      <a href="${specUrl}" target="_blank">Unduh openapi.json</a>
    </div>
  </div>

  <div id="loading-indicator">
    <div class="spinner"></div>
    <div>Memuat spesifikasi OpenAPI Swagger...</div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js"></script>
  <script>
    function initSwagger() {
      const loader = document.getElementById('loading-indicator');
      if (typeof SwaggerUIBundle === 'undefined') {
        if (loader) {
          loader.innerHTML = '<div style="color:#f43f5e;font-weight:600;">Gagal memuat pustaka Swagger UI CDN.</div><div style="font-size:12px;margin-top:6px;">Silakan gunakan API Explorer bawaan pada dasbor utama atau buka file <a href="${specUrl}" style="color:#38bdf8;">openapi.json</a>.</div>';
        }
        return;
      }
      try {
        const ui = SwaggerUIBundle({
          url: "${specUrl}",
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "BaseLayout",
          docExpansion: "list",
          onComplete: function() {
            if (loader) loader.style.display = 'none';
          }
        });
        window.ui = ui;
        setTimeout(function() {
          if (loader) loader.style.display = 'none';
        }, 1200);
      } catch (err) {
        if (loader) {
          loader.innerHTML = '<div style="color:#f43f5e;">Error: ' + err.message + '</div>';
        }
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSwagger);
    } else {
      initSwagger();
    }
  </script>
</body>
</html>`;
  }
}

export const swaggerService = new SwaggerService();
