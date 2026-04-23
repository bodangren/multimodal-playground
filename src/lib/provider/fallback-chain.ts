import { ProviderErrorClassifier, ErrorClassification, type ProviderError } from './error-classifier';
import { ProviderHealthTracker } from './health';

export interface ProviderFallbackConfig<P, R> {
  id: string;
  execute: (payload: P) => Promise<R>;
  weight?: number;
  isCircuitOpen?: () => boolean;
  recordSuccess?: () => void;
  recordFailure?: (error: ProviderError) => void;
}

export interface ChainOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  logger?: {
    info: (message: string, meta?: Record<string, unknown>) => void;
    error: (message: string, meta?: Record<string, unknown>) => void;
    warn: (message: string, meta?: Record<string, unknown>) => void;
  };
}

export interface FallbackMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  failoverCount: number;
}

export class FallbackChain<P, R> {
  private providers: ProviderFallbackConfig<P, R>[];
  private maxAttempts: number;
  private baseDelayMs: number;
  private maxDelayMs: number;
  private logger: NonNullable<ChainOptions['logger']>;
  private healthTracker: ProviderHealthTracker;
  private errorClassifier: ProviderErrorClassifier;
  private metrics: Map<string, FallbackMetrics>;

  constructor(providers: ProviderFallbackConfig<P, R>[], options: ChainOptions = {}) {
    this.providers = providers;
    this.maxAttempts = options.maxAttempts ?? 3;
    this.baseDelayMs = options.baseDelayMs ?? 1000;
    this.maxDelayMs = options.maxDelayMs ?? 30000;
    this.logger = options.logger ?? {
      info: () => {},
      error: () => {},
      warn: () => {},
    };
    this.healthTracker = new ProviderHealthTracker();
    this.errorClassifier = new ProviderErrorClassifier();
    this.metrics = new Map();
    for (const provider of providers) {
      this.metrics.set(provider.id, { totalAttempts: 0, successfulAttempts: 0, failedAttempts: 0, failoverCount: 0 });
    }
  }

  async execute(payload: P): Promise<R> {
    let attempts = 0;
    let lastError: unknown;
    let currentProviderIndex = 0;
    const totalProviders = this.providers.length;
    const triedInCycle = new Set<string>();

    while (attempts < this.maxAttempts) {
      if (triedInCycle.size >= totalProviders) {
        const skippedProviders = Array.from(triedInCycle).join(', ');
        this.logger.error('All providers have open circuits - aborting', {
          providers: skippedProviders,
          attempts,
        });
        throw lastError ?? new Error('All providers have open circuits');
      }

      const provider = this.providers[currentProviderIndex];
      if (!provider) {
        currentProviderIndex = 0;
        continue;
      }

      if (provider.isCircuitOpen?.() === true) {
        this.logger.info('Skipping provider with open circuit', { providerId: provider.id });
        triedInCycle.add(provider.id);
        currentProviderIndex = (currentProviderIndex + 1) % totalProviders;
        attempts++;
        continue;
      }

      triedInCycle.add(provider.id);
      const startTime = Date.now();
      attempts++;
      this.incrementTotalAttempts(provider.id);

      try {
        const result = await provider.execute(payload);
        const latencyMs = Date.now() - startTime;
        this.healthTracker.record(provider.id, true, latencyMs);
        provider.recordSuccess?.();
        this.incrementSuccessfulAttempts(provider.id);
        return result;
      } catch (error) {
        const latencyMs = Date.now() - startTime;
        const providerError = this.normalizeError(error, provider.id);

        this.healthTracker.record(provider.id, false, latencyMs, providerError.status);
        provider.recordFailure?.(providerError);
        this.incrementFailedAttempts(provider.id);

        const classification = this.errorClassifier.classify(providerError);

        if (classification === ErrorClassification.Terminal) {
          this.logger.error('Terminal error - stopping retry chain', { providerId: provider.id, error: providerError.message });
          throw error;
        }

        const nextProviderIndex = (currentProviderIndex + 1) % this.providers.length;
        const nextProvider = this.providers[nextProviderIndex];
        if (attempts < this.maxAttempts) {
          this.logger.info('failover event', {
            from: provider.id,
            to: nextProvider?.id,
            error: providerError.message,
            latencyMs,
          });
          this.incrementFailoverCount(provider.id);
          const delay = this.calculateBackoff(attempts, providerError);
          await this.sleep(delay);
        }

        currentProviderIndex = nextProviderIndex;
        lastError = error;
      }
    }

    const attemptedProviders = this.providers.map((p) => p.id);
    this.logger.error('All providers exhausted', { providers: attemptedProviders, attempts: this.maxAttempts });
    throw lastError ?? new Error('All providers failed');
  }

  getHealth(providerId: string) {
    return this.healthTracker.getHealth(providerId);
  }

  getMetrics(providerId: string): FallbackMetrics | undefined {
    return this.metrics.get(providerId);
  }

  private calculateBackoff(attempt: number, error: ProviderError): number {
    const baseDelay = this.baseDelayMs * Math.pow(2, attempt - 1);
    const classifiedDelay = this.errorClassifier.getRetryAfterMs(error);
    const delay = Math.max(baseDelay, classifiedDelay);
    return Math.min(delay, this.maxDelayMs);
  }

  private normalizeError(error: unknown, _providerId: string): ProviderError {
    if (error instanceof Error) {
      const statusMatch = error.message.match(/\b(\d{3})\b/);
      const status = statusMatch ? parseInt(statusMatch[1], 10) : undefined;
      return { message: error.message, status };
    }
    return { message: String(error) };
  }

  private incrementTotalAttempts(providerId: string): void {
    const m = this.metrics.get(providerId);
    if (m) m.totalAttempts++;
  }

  private incrementSuccessfulAttempts(providerId: string): void {
    const m = this.metrics.get(providerId);
    if (m) m.successfulAttempts++;
  }

  private incrementFailedAttempts(providerId: string): void {
    const m = this.metrics.get(providerId);
    if (m) m.failedAttempts++;
  }

  private incrementFailoverCount(providerId: string): void {
    const m = this.metrics.get(providerId);
    if (m) m.failoverCount++;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
