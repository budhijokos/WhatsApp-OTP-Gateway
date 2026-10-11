import fs from 'fs';
import path from 'path';
import { ApiKey, ApiKeyStats } from '../domain/auth.types.js';

export class ApiKeyRepository {
  private readonly filePath: string;
  private keys: Map<string, ApiKey> = new Map();
  private isLoaded = false;

  constructor(filePath?: string) {
    this.filePath = filePath || path.resolve(process.cwd(), '.api_keys.json');
  }

  public ensureLoaded(): void {
    if (this.isLoaded) return;
    this.loadFromDisk();
    this.isLoaded = true;
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.keys.clear();
          for (const item of parsed) {
            if (item && item.id) {
              this.keys.set(item.id, item);
            }
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Could not read .api_keys.json, initializing empty or fallback store', err);
    }
  }

  private saveToDisk(): void {
    try {
      const data = Array.from(this.keys.values());
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write .api_keys.json to disk', err);
    }
  }

  public findAll(): ApiKey[] {
    this.ensureLoaded();
    return Array.from(this.keys.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public findById(id: string): ApiKey | undefined {
    this.ensureLoaded();
    return this.keys.get(id);
  }

  public findByClientId(clientId: string): ApiKey | undefined {
    this.ensureLoaded();
    for (const key of this.keys.values()) {
      if (key.clientId === clientId) {
        return key;
      }
    }
    return undefined;
  }

  public findByToken(token: string): { key: ApiKey; isPreviousToken: boolean } | undefined {
    this.ensureLoaded();
    for (const key of this.keys.values()) {
      if (key.token === token) {
        return { key, isPreviousToken: false };
      }
      if (key.rotationInfo?.previousToken === token) {
        return { key, isPreviousToken: true };
      }
    }
    return undefined;
  }

  public save(key: ApiKey): ApiKey {
    this.ensureLoaded();
    this.keys.set(key.id, key);
    this.saveToDisk();
    return key;
  }

  public delete(id: string): boolean {
    this.ensureLoaded();
    const deleted = this.keys.delete(id);
    if (deleted) {
      this.saveToDisk();
    }
    return deleted;
  }

  public recordUsage(keyId: string): void {
    this.ensureLoaded();
    const key = this.keys.get(keyId);
    if (key) {
      key.usageCount = (key.usageCount || 0) + 1;
      key.lastUsedAt = new Date().toISOString();
      this.saveToDisk();
    }
  }

  public getStats(): ApiKeyStats {
    this.ensureLoaded();
    const all = Array.from(this.keys.values());
    return {
      total: all.length,
      active: all.filter((k) => k.status === 'active').length,
      rotating: all.filter((k) => k.status === 'rotating').length,
      revoked: all.filter((k) => k.status === 'revoked').length,
      totalUsage: all.reduce((sum, k) => sum + (k.usageCount || 0), 0),
    };
  }

  public count(): number {
    this.ensureLoaded();
    return this.keys.size;
  }
}

export const apiKeyRepository = new ApiKeyRepository();
