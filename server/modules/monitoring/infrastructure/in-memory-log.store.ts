import { AppConfig } from '../../../core/config/app.config.js';
import { ConsoleLogEntry, DeliveryLog, DetailedErrorLog } from '../domain/monitoring.types.js';

export class InMemoryLogStore {
  private deliveryLogs: DeliveryLog[] = [];
  private errorLogs: DetailedErrorLog[] = [];
  private consoleLogs: ConsoleLogEntry[] = [];

  // --- Delivery Logs ---
  public addDeliveryLog(log: DeliveryLog): void {
    this.deliveryLogs.unshift(log);
    if (this.deliveryLogs.length > AppConfig.monitoring.maxDeliveryLogs) {
      this.deliveryLogs.pop();
    }
  }

  public updateDeliveryLog(id: string, partial: Partial<DeliveryLog>): DeliveryLog | undefined {
    const item = this.deliveryLogs.find((l) => l.id === id);
    if (item) {
      Object.assign(item, partial);
    }
    return item;
  }

  public getDeliveryLogs(limit = 100, status?: string): DeliveryLog[] {
    let filtered = this.deliveryLogs;
    if (status) {
      filtered = filtered.filter((l) => l.status === status);
    }
    return filtered.slice(0, limit);
  }

  public clearDeliveryLogs(): void {
    this.deliveryLogs = [];
  }

  // --- Error Logs ---
  public addErrorLog(error: DetailedErrorLog): void {
    this.errorLogs.unshift(error);
    if (this.errorLogs.length > AppConfig.monitoring.maxErrorLogs) {
      this.errorLogs.pop();
    }
  }

  public getErrorLogs(limit = 100): DetailedErrorLog[] {
    return this.errorLogs.slice(0, limit);
  }

  public clearErrorLogs(): void {
    this.errorLogs = [];
  }

  // --- Console Logs ---
  public addConsoleLog(entry: ConsoleLogEntry): void {
    this.consoleLogs.unshift(entry);
    if (this.consoleLogs.length > AppConfig.monitoring.maxConsoleLogs) {
      this.consoleLogs.pop();
    }
  }

  public getConsoleLogs(limit = 200, source?: string, level?: string): ConsoleLogEntry[] {
    let filtered = this.consoleLogs;
    if (source) filtered = filtered.filter((l) => l.source === source);
    if (level) filtered = filtered.filter((l) => l.level === level);
    return filtered.slice(0, limit);
  }

  public clearConsoleLogs(): void {
    this.consoleLogs = [];
  }
}
