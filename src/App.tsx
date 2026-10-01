import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DashboardOverview } from './features/dashboard/DashboardOverview';
import { PairingModal } from './features/dashboard/PairingModal';
import { OtpTester } from './features/otp-tester/OtpTester';
import { DeliveryLogsView } from './features/delivery-logs/DeliveryLogsView';
import { ErrorLogsView } from './features/error-logs/ErrorLogsView';
import { ConsoleFeedView } from './features/console-feed/ConsoleFeedView';
import { DeveloperGuide } from './features/developer-docs/DeveloperGuide';
import { SwaggerViewer } from './features/swagger-viewer/SwaggerViewer';
import { TemplateEditorView } from './features/template-editor/TemplateEditorView';
import { api } from './services/api';
import {
  ConsoleLogEntry,
  DeliveryLog,
  DetailedErrorLog,
  SystemMetrics,
  WhatsAppState,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [customTemplateForTester, setCustomTemplateForTester] = useState<string>('');

  // Core state
  const [waState, setWaState] = useState<WhatsAppState>({
    status: 'disconnected',
    phone: null,
    pushName: null,
    qrDataUrl: null,
    qrRaw: null,
    pairingCode: null,
    lastDisconnectReason: null,
    connectedAt: null,
    uptimeSeconds: 0,
  });

  const [metrics, setMetrics] = useState<SystemMetrics>({
    total: 0,
    sent: 0,
    failed: 0,
    pending: 0,
    successRate: 100,
    avgLatencyMs: 0,
    errorCount: 0,
    waStatus: 'disconnected',
  });

  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [errorLogs, setErrorLogs] = useState<DetailedErrorLog[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([]);

  // Refresh all state manually or upon socket reconnect
  const refreshAllData = useCallback(async () => {
    try {
      const [statusRes, delLogsRes, errLogsRes, consLogsRes] = await Promise.all([
        api.getStatus(),
        api.getDeliveryLogs(100),
        api.getErrorLogs(100),
        api.getConsoleLogs(200),
      ]);

      setWaState(statusRes.whatsapp);
      setMetrics(statusRes.metrics);
      setDeliveryLogs(delLogsRes.logs);
      setErrorLogs(errLogsRes.errors);
      setConsoleLogs(consLogsRes.logs);
    } catch (err) {
      console.warn('Initial data load warning:', err);
    }
  }, []);

  // Subscribe to real-time Server-Sent Events (SSE)
  useEffect(() => {
    refreshAllData();

    const unsubscribe = api.subscribeLiveLogs({
      onInit: (data) => {
        setWaState(data.waState);
        setMetrics(data.metrics);
        setDeliveryLogs(data.recentLogs);
        setConsoleLogs(data.recentConsole);
        setErrorLogs(data.recentErrors);
      },
      onWhatsAppState: (state) => {
        setWaState(state);
      },
      onDeliveryLog: (log) => {
        setDeliveryLogs((prev) => [log, ...prev.slice(0, 199)]);
        setMetrics((prev) => ({
          ...prev,
          total: prev.total + 1,
          pending: prev.pending + 1,
        }));
      },
      onDeliveryUpdate: (updatedLog) => {
        setDeliveryLogs((prev) =>
          prev.map((l) => (l.id === updatedLog.id ? updatedLog : l))
        );
        // Refresh metrics
        api.getStatus().then((res) => setMetrics(res.metrics)).catch(() => {});
      },
      onConsoleLog: (entry) => {
        setConsoleLogs((prev) => [entry, ...prev.slice(0, 299)]);
      },
      onErrorLog: (errLog) => {
        setErrorLogs((prev) => [errLog, ...prev.slice(0, 99)]);
        setMetrics((prev) => ({ ...prev, errorCount: prev.errorCount + 1 }));
      },
      onDeliveryCleared: () => {
        setDeliveryLogs([]);
        setMetrics((prev) => ({ ...prev, total: 0, sent: 0, failed: 0, pending: 0 }));
      },
      onErrorsCleared: () => {
        setErrorLogs([]);
        setMetrics((prev) => ({ ...prev, errorCount: 0 }));
      },
      onConsoleCleared: () => {
        setConsoleLogs([]);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [refreshAllData]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans antialiased flex flex-col selection:bg-emerald-500/30 selection:text-white">
      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        waState={waState}
        onOpenPairing={() => setIsPairingOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            waState={waState}
            metrics={metrics}
            recentLogs={deliveryLogs}
            recentErrors={errorLogs}
            onOpenPairing={() => setIsPairingOpen(true)}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'tester' && (
          <OtpTester
            waState={waState}
            onOpenPairing={() => setIsPairingOpen(true)}
            initialTemplate={customTemplateForTester}
          />
        )}

        {activeTab === 'template' && (
          <TemplateEditorView
            onNavigateToTester={(tpl) => {
              if (tpl) setCustomTemplateForTester(tpl);
              setActiveTab('tester');
            }}
          />
        )}

        {activeTab === 'logs' && (
          <DeliveryLogsView
            logs={deliveryLogs}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'errors' && (
          <ErrorLogsView
            errors={errorLogs}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'console' && (
          <ConsoleFeedView
            logs={consoleLogs}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'developer' && <DeveloperGuide />}

        {activeTab === 'swagger' && <SwaggerViewer />}
      </main>

      {/* Pairing & Device Modal */}
      <PairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        waState={waState}
        onRefresh={refreshAllData}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-5 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>WhatsApp OTP Gateway</span>
            <span aria-hidden="true">·</span>
            <span>Hono.js Engine</span>
            <span aria-hidden="true">·</span>
            <span>WhiskeySockets Baileys</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-mono">In-Memory (No DB)</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/api/openapi.json" target="_blank" className="hover:text-slate-300 transition-colors">
              OpenAPI Spec
            </a>
            <a href="/api/docs" target="_blank" className="hover:text-slate-300 transition-colors">
              Swagger UI
            </a>
            <a href="https://github.com/WhiskeySockets/Baileys" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">
              Baileys Repo
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
