import fs from 'fs/promises';
import path from 'path';
import { CircuitBreaker, CircuitBreakerPersistence, CircuitBreakerPersistenceData, CircuitState } from './circuit-breaker';

const CIRCUIT_BREAKER_STATE_FILE = '.circuit-breaker-state.json';

interface CircuitBreakerStateStore {
  [providerId: string]: CircuitBreakerPersistenceData;
}

export class FileCircuitBreakerPersistence implements CircuitBreakerPersistence {
  private filePath: string;
  private writeTimeout: ReturnType<typeof setTimeout> | null = null;
  private writePending: boolean = false;

  constructor(filePath: string = CIRCUIT_BREAKER_STATE_FILE) {
    this.filePath = filePath;
  }

  async save(providerId: string, state: CircuitState, failureCount: number, lastFailureTime: number | null): Promise<void> {
    const store = await this.loadStore();
    const existing = store[providerId];
    store[providerId] = {
      state,
      failureCount,
      lastFailureTime,
      lastStateChangeTime: existing?.lastStateChangeTime ?? Date.now(),
    };
    this.writePending = true;
    await this.saveStore(store);
    this.writePending = false;
  }

  async load(providerId: string): Promise<CircuitBreakerPersistenceData | null> {
    const store = await this.loadStore();
    return store[providerId] ?? null;
  }

  private async loadStore(): Promise<CircuitBreakerStateStore> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private async saveStore(store: CircuitBreakerStateStore): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.filePath) || '.', { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify(store, null, 2));
    } catch (error) {
      console.error('Failed to save circuit breaker state:', error);
    }
  }
}

export class ProviderCircuitBreakerManager {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private persistence: CircuitBreakerPersistence;

  constructor(persistence?: CircuitBreakerPersistence) {
    this.persistence = persistence ?? new FileCircuitBreakerPersistence();
  }

  async getCircuitBreaker(providerId: string): Promise<CircuitBreaker> {
    let cb = this.circuitBreakers.get(providerId);
    if (!cb) {
      cb = new CircuitBreaker(providerId, {}, this.persistence);
      await cb.initialize();
      this.circuitBreakers.set(providerId, cb);
    }
    return cb;
  }

  async isProviderAllowed(providerId: string): Promise<boolean> {
    const cb = await this.getCircuitBreaker(providerId);
    return cb.isAllowed();
  }

  async recordProviderSuccess(providerId: string): Promise<void> {
    const cb = await this.getCircuitBreaker(providerId);
    cb.recordSuccess();
    await cb.waitForPendingSave();
  }

  async recordProviderFailure(providerId: string): Promise<void> {
    const cb = await this.getCircuitBreaker(providerId);
    cb.recordFailure();
    await cb.waitForPendingSave();
  }

  async getProviderState(providerId: string): Promise<CircuitState | null> {
    const cb = await this.getCircuitBreaker(providerId);
    return cb?.getState() ?? null;
  }

  async resetProvider(providerId: string): Promise<void> {
    const cb = await this.circuitBreakers.get(providerId);
    cb?.reset();
  }

  async resetAll(): Promise<void> {
    for (const cb of this.circuitBreakers.values()) {
      cb.reset();
    }
  }
}