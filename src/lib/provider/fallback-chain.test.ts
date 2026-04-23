import { describe, it, expect, vi } from 'vitest';
import { FallbackChain, type ProviderFallbackConfig } from './fallback-chain';

describe('FallbackChain', () => {
  const createMockLogger = () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  });

  const createSuccessProvider = (_id: string, result: string) =>
    vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return result;
    });

  const createFailingProvider = (_id: string, errorMsg: string) =>
    vi.fn().mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 10));
      throw new Error(errorMsg);
    });

  describe('successful execution', () => {
    it('should return result from first provider on success', async () => {
      const logger = createMockLogger();
      const successProvider = createSuccessProvider('a', 'success');
      const providers: ProviderFallbackConfig<unknown, string>[] = [
        { id: 'a', execute: successProvider },
      ];
      const chain = new FallbackChain(providers, { logger });

      const result = await chain.execute({ prompt: 'test' });
      expect(result).toBe('success');
      expect(successProvider).toHaveBeenCalledTimes(1);
    });

    it('should record success in health tracker', async () => {
      const logger = createMockLogger();
      const successProvider = createSuccessProvider('a', 'ok');
      const providers: ProviderFallbackConfig<unknown, string>[] = [
        { id: 'a', execute: successProvider },
      ];
      const chain = new FallbackChain(providers, { logger });

      await chain.execute({ prompt: 'test' });
      const health = chain.getHealth('a');
      expect(health).toBeDefined();
      expect(health!.successfulRequests).toBe(1);
    });
  });

  describe('retry on failure', () => {
    it('should fallback to next provider when first fails', async () => {
      const logger = createMockLogger();
      const failingProvider = createFailingProvider('a', 'fail');
      const successProvider = createSuccessProvider('b', 'fallback-success');
      const providers: ProviderFallbackConfig<unknown, string>[] = [
        { id: 'a', execute: failingProvider },
        { id: 'b', execute: successProvider },
      ];
      const chain = new FallbackChain(providers, { logger, baseDelayMs: 10, maxDelayMs: 100 });

      const result = await chain.execute({ prompt: 'test' });
      expect(result).toBe('fallback-success');
      expect(failingProvider).toHaveBeenCalledTimes(1);
      expect(successProvider).toHaveBeenCalledTimes(1);
    });

    it('should apply exponential backoff between retries', async () => {
      const logger = createMockLogger();
      const failingProvider = createFailingProvider('a', 'fail');
      const successProvider = createSuccessProvider('b', 'ok');
      const providers: ProviderFallbackConfig<unknown, string>[] = [
        { id: 'a', execute: failingProvider },
        { id: 'b', execute: successProvider },
      ];
      const chain = new FallbackChain(providers, { logger, baseDelayMs: 50, maxDelayMs: 200 });

      const start = Date.now();
      await chain.execute({ prompt: 'test' });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(50);
    });

    it('should cap total attempts across providers', async () => {
      const logger = createMockLogger();
      const failingProvider = createFailingProvider('a', 'fail');
      const providers: ProviderFallbackConfig<unknown, string>[] = [
        { id: 'a', execute: failingProvider },
        { id: 'b', execute: failingProvider },
      ];
      const chain = new FallbackChain(providers, { logger, maxAttempts: 2, baseDelayMs: 10, maxDelayMs: 100 });

      await expect(chain.execute({ prompt: 'test' })).rejects.toThrow('fail');
      expect(failingProvider).toHaveBeenCalledTimes(2);
    });
  });

  describe('circuit breaker integration', () => {
    it('should skip providers with open circuit breakers', async () => {
      const logger = createMockLogger();
      const failingProvider = createFailingProvider('a', 'fail');
      const successProvider = createSuccessProvider('b', 'ok');
      const isCircuitOpenA = vi.fn().mockReturnValue(true);
      const isCircuitOpenB = vi.fn().mockReturnValue(false);

      const providers: ProviderFallbackConfig<unknown, string>[] = [
        { id: 'a', execute: failingProvider, isCircuitOpen: isCircuitOpenA },
        { id: 'b', execute: successProvider, isCircuitOpen: isCircuitOpenB },
      ];
      const chain = new FallbackChain(providers, { logger, maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100 });

      const result = await chain.execute({ prompt: 'test' });
      expect(result).toBe('ok');
      expect(isCircuitOpenA).toHaveBeenCalled();
      expect(isCircuitOpenB).toHaveBeenCalled();
    });

    it('should throw when all providers have open circuits', async () => {
      const logger = createMockLogger();
      const isCircuitOpenA = vi.fn().mockReturnValue(true);
      const isCircuitOpenB = vi.fn().mockReturnValue(true);

      const providers: ProviderFallbackConfig<unknown, string>[] = [
        { id: 'a', execute: createFailingProvider('a', 'fail'), isCircuitOpen: isCircuitOpenA },
        { id: 'b', execute: createFailingProvider('b', 'fail'), isCircuitOpen: isCircuitOpenB },
      ];
      const chain = new FallbackChain(providers, { logger, maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100 });

      await expect(chain.execute({ prompt: 'test' })).rejects.toThrow('All providers have open circuits');
      expect(isCircuitOpenA).toHaveBeenCalled();
      expect(isCircuitOpenB).toHaveBeenCalled();
    });

    it('should record failure when executing against a provider', async () => {
      const logger = createMockLogger();
      const failingProvider = createFailingProvider('a', 'fail');
      const recordFailure = vi.fn();

      const providers: ProviderFallbackConfig<unknown, string>[] = [
        { id: 'a', execute: failingProvider, recordFailure },
      ];
      const chain = new FallbackChain(providers, { logger, maxAttempts: 1, baseDelayMs: 10, maxDelayMs: 100 });

      await expect(chain.execute({ prompt: 'test' })).rejects.toThrow('fail');
      expect(recordFailure).toHaveBeenCalled();
    });
  });

  describe('chain exhaustion', () => {
    it('should throw when all providers fail', async () => {
      const logger = createMockLogger();
      const failingProvider = createFailingProvider('a', 'all failed');

      const providers: ProviderFallbackConfig<unknown, string>[] = [
        { id: 'a', execute: failingProvider },
      ];
      const chain = new FallbackChain(providers, { logger, maxAttempts: 1, baseDelayMs: 10, maxDelayMs: 100 });

      await expect(chain.execute({ prompt: 'test' })).rejects.toThrow('all failed');
    });

    it('should log failover events', async () => {
      const logger = createMockLogger();
      const failingProvider = createFailingProvider('a', 'fail');
      const successProvider = createSuccessProvider('b', 'ok');

      const providers: ProviderFallbackConfig<unknown, string>[] = [
        { id: 'a', execute: failingProvider },
        { id: 'b', execute: successProvider },
      ];
      const chain = new FallbackChain(providers, { logger, baseDelayMs: 10, maxDelayMs: 100 });

      await chain.execute({ prompt: 'test' });

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('failover'),
        expect.objectContaining({
          from: 'a',
          to: 'b',
        })
      );
    });
  });

  describe('health integration', () => {
    it('should return health for all attempted providers', async () => {
      const logger = createMockLogger();
      const successProvider = createSuccessProvider('a', 'ok');

      const providers: ProviderFallbackConfig<unknown, string>[] = [
        { id: 'a', execute: successProvider },
      ];
      const chain = new FallbackChain(providers, { logger });

      await chain.execute({ prompt: 'test' });
      const health = chain.getHealth('a');
      expect(health).toBeDefined();
      expect(health!.providerId).toBe('a');
      expect(health!.successfulRequests).toBe(1);
    });

    it('should return undefined for unknown provider', () => {
      const logger = createMockLogger();
      const providers: ProviderFallbackConfig<unknown, string>[] = [];
      const chain = new FallbackChain(providers, { logger });

      const health = chain.getHealth('unknown');
      expect(health).toBeUndefined();
    });
  });
});
