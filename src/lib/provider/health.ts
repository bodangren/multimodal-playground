export enum ProviderStatus {
  Healthy = 'healthy',
  Degraded = 'degraded',
  Down = 'down',
}

export interface LatencyStats {
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface HealthOutcome {
  timestamp: number;
  success: boolean;
  latencyMs: number;
  errorCode?: number;
}

export interface ProviderHealth {
  providerId: string;
  status: ProviderStatus;
  successRate: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  latencyStats: LatencyStats;
  lastUpdated: number;
}

export interface HealthWindowOptions {
  windowSizeMs: number;
  minSamples: number;
  degradedThreshold: number;
  downThreshold: number;
}

const DEFAULT_HEALTH_WINDOW_OPTIONS: HealthWindowOptions = {
  windowSizeMs: 60 * 1000,
  minSamples: 5,
  degradedThreshold: 0.9,
  downThreshold: 0.5,
};

export class HealthWindow {
  private outcomes: HealthOutcome[] = [];
  private options: HealthWindowOptions;
  private readonly windowId: string;

  constructor(windowId: string, options: Partial<HealthWindowOptions> = {}) {
    this.windowId = windowId;
    this.options = { ...DEFAULT_HEALTH_WINDOW_OPTIONS, ...options };
  }

  record(success: boolean, latencyMs: number, errorCode?: number): void {
    this.outcomes.push({
      timestamp: Date.now(),
      success,
      latencyMs,
      errorCode,
    });
    this.prune();
  }

  getOutcomes(): HealthOutcome[] {
    this.prune();
    return [...this.outcomes];
  }

  getSuccessRate(): number {
    this.prune();
    if (this.outcomes.length === 0) return 1.0;
    const successful = this.outcomes.filter((o) => o.success).length;
    return successful / this.outcomes.length;
  }

  getLatencyStats(): LatencyStats {
    this.prune();
    if (this.outcomes.length === 0) {
      return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
    }

    const latencies = this.outcomes.map((o) => o.latencyMs).sort((a, b) => a - b);
    const sum = latencies.reduce((acc, l) => acc + l, 0);

    return {
      min: latencies[0],
      max: latencies[latencies.length - 1],
      avg: sum / latencies.length,
      p50: this.percentile(latencies, 0.5),
      p95: this.percentile(latencies, 0.95),
      p99: this.percentile(latencies, 0.99),
    };
  }

  getStatus(): ProviderStatus {
    this.prune();
    const { minSamples, degradedThreshold, downThreshold } = this.options;

    if (this.outcomes.length < minSamples) {
      return ProviderStatus.Healthy;
    }

    const successRate = this.getSuccessRate();
    if (successRate >= degradedThreshold) {
      return ProviderStatus.Healthy;
    }
    if (successRate >= downThreshold) {
      return ProviderStatus.Degraded;
    }
    return ProviderStatus.Down;
  }

  getHealth(): ProviderHealth {
    this.prune();
    return {
      providerId: this.windowId,
      status: this.getStatus(),
      successRate: this.getSuccessRate(),
      totalRequests: this.outcomes.length,
      successfulRequests: this.outcomes.filter((o) => o.success).length,
      failedRequests: this.outcomes.filter((o) => !o.success).length,
      latencyStats: this.getLatencyStats(),
      lastUpdated: this.outcomes.length > 0 ? this.outcomes[this.outcomes.length - 1].timestamp : Date.now(),
    };
  }

  private percentile(sortedArr: number[], p: number): number {
    const index = Math.ceil(sortedArr.length * p) - 1;
    return sortedArr[Math.max(0, index)];
  }

  private prune(): void {
    const cutoff = Date.now() - this.options.windowSizeMs;
    this.outcomes = this.outcomes.filter((o) => o.timestamp >= cutoff);
  }
}

export class ProviderHealthTracker {
  private trackers: Map<string, HealthWindow> = new Map();
  private options: HealthWindowOptions;

  constructor(options: Partial<HealthWindowOptions> = {}) {
    this.options = { ...DEFAULT_HEALTH_WINDOW_OPTIONS, ...options };
  }

  getOrCreateTracker(providerId: string): HealthWindow {
    let tracker = this.trackers.get(providerId);
    if (!tracker) {
      tracker = new HealthWindow(providerId, this.options);
      this.trackers.set(providerId, tracker);
    }
    return tracker;
  }

  record(providerId: string, success: boolean, latencyMs: number, errorCode?: number): void {
    this.getOrCreateTracker(providerId).record(success, latencyMs, errorCode);
  }

  getHealth(providerId: string): ProviderHealth | undefined {
    const tracker = this.trackers.get(providerId);
    if (!tracker) return undefined;
    return tracker.getHealth();
  }

  getAllHealth(): Map<string, ProviderHealth> {
    const result = new Map<string, ProviderHealth>();
    for (const [providerId, tracker] of this.trackers) {
      result.set(providerId, tracker.getHealth());
    }
    return result;
  }

  reset(providerId?: string): void {
    if (providerId) {
      this.trackers.delete(providerId);
    } else {
      this.trackers.clear();
    }
  }
}