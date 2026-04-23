export enum CircuitState {
  Closed = 'closed',
  Open = 'open',
  HalfOpen = 'half-open',
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  cooldownMs: number;
  probeCount: number;
}

export interface CircuitBreakerPersistence {
  save(providerId: string, state: CircuitState, failureCount: number, lastFailureTime: number | null): Promise<void>;
  load(providerId: string): Promise<CircuitBreakerPersistenceData | null>;
}

export interface CircuitBreakerPersistenceData {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number | null;
  lastStateChangeTime: number;
}

const DEFAULT_CIRCUIT_BREAKER_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  cooldownMs: 30 * 1000,
  probeCount: 3,
};

export class CircuitBreaker {
  private state: CircuitState = CircuitState.Closed;
  private failureCount: number = 0;
  private lastFailureTime: number | null = null;
  private lastStateChangeTime: number = Date.now();
  private options: CircuitBreakerOptions;
  private persistence: CircuitBreakerPersistence | null = null;
  private readonly providerId: string;
  private probeSuccesses: number = 0;
  private pendingSave: Promise<void> | null = null;

  constructor(
    providerId: string,
    options: Partial<CircuitBreakerOptions> = {},
    persistence?: CircuitBreakerPersistence
  ) {
    this.providerId = providerId;
    this.options = { ...DEFAULT_CIRCUIT_BREAKER_OPTIONS, ...options };
    this.persistence = persistence ?? null;
  }

  async initialize(): Promise<void> {
    if (!this.persistence) return;
    const data = await this.persistence.load(this.providerId);
    if (data) {
      this.state = data.state;
      this.failureCount = data.failureCount;
      this.lastFailureTime = data.lastFailureTime;
      this.lastStateChangeTime = data.lastStateChangeTime;
      if (this.state === CircuitState.Open && this.shouldTransitionToHalfOpen()) {
        this.transitionTo(CircuitState.HalfOpen);
      }
    }
  }

  isAllowed(): boolean {
    if (this.state === CircuitState.Closed) {
      return true;
    }
    if (this.state === CircuitState.Open) {
      if (this.shouldTransitionToHalfOpen()) {
        this.transitionTo(CircuitState.HalfOpen);
        return true;
      }
      return false;
    }
    if (this.state === CircuitState.HalfOpen) {
      if (this.probeSuccesses < this.options.probeCount) {
        this.probeSuccesses++;
        return true;
      }
      return false;
    }
    return false;
  }

  recordSuccess(): void {
    if (this.state === CircuitState.HalfOpen) {
      this.probeSuccesses++;
      if (this.probeSuccesses >= this.options.probeCount) {
        this.transitionTo(CircuitState.Closed);
      }
    } else if (this.state === CircuitState.Closed) {
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
    this.lastFailureTime = null;
    this.save();
  }

  recordFailure(): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;

    if (this.state === CircuitState.HalfOpen) {
      this.transitionTo(CircuitState.Open);
    } else if (this.state === CircuitState.Closed) {
      if (this.failureCount >= this.options.failureThreshold) {
        this.transitionTo(CircuitState.Open);
      }
    }
    this.save();
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  getLastFailureTime(): number | null {
    return this.lastFailureTime;
  }

  getLastStateChangeTime(): number {
    return this.lastStateChangeTime;
  }

  reset(): void {
    this.state = CircuitState.Closed;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.lastStateChangeTime = Date.now();
    this.probeSuccesses = 0;
    this.save();
  }

  private shouldTransitionToHalfOpen(): boolean {
    if (!this.lastStateChangeTime) return false;
    return Date.now() - this.lastStateChangeTime >= this.options.cooldownMs;
  }

  private transitionTo(newState: CircuitState): void {
    this.state = newState;
    this.lastStateChangeTime = Date.now();
    if (newState === CircuitState.HalfOpen) {
      this.probeSuccesses = 0;
    }
    if (newState === CircuitState.Closed) {
      this.failureCount = 0;
      this.probeSuccesses = 0;
    }
    this.save();
  }

  private save(): void {
    if (this.persistence) {
      const savePromise = this.persistence.save(
        this.providerId,
        this.state,
        this.failureCount,
        this.lastFailureTime
      );
      this.pendingSave = savePromise.catch(() => {});
    }
  }

  async waitForPendingSave(): Promise<void> {
    if (this.pendingSave) {
      await this.pendingSave;
    }
  }
}

export class InMemoryCircuitBreakerPersistence implements CircuitBreakerPersistence {
  private store: Map<string, CircuitBreakerPersistenceData> = new Map();

  async save(providerId: string, state: CircuitState, failureCount: number, lastFailureTime: number | null): Promise<void> {
    const existing = this.store.get(providerId);
    this.store.set(providerId, {
      state,
      failureCount,
      lastFailureTime,
      lastStateChangeTime: existing?.lastStateChangeTime ?? Date.now(),
    });
  }

  async load(providerId: string): Promise<CircuitBreakerPersistenceData | null> {
    return this.store.get(providerId) ?? null;
  }

  clear(): void {
    this.store.clear();
  }
}