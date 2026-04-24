import { describe, it, expect, vi } from 'vitest';
import { FallbackChain, type ProviderFallbackConfig } from './fallback-chain';

describe('FallbackChain with circuit breaker integration', () => {
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

  describe('all providers have open circuits', () => {
    it('should throw error when all circuit breakers are open', async () => {
      const logger = createMockLogger();
      const failingProvider = createFailingProvider('a', 'fail');
      const isCircuitOpenA = vi.fn().mockReturnValue(true);
      const isCircuitOpenB = vi.fn().mockReturnValue(true);

      const providers: ProviderFallbackConfig<unknown, string>[] = [
        { id: 'a', modelId: 'test-model-a', execute: failingProvider, isCircuitOpen: isCircuitOpenA },
        { id: 'b', modelId: 'test-model-b', execute: failingProvider, isCircuitOpen: isCircuitOpenB },
      ];
      const chain = new FallbackChain(providers, { logger, maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 100 });

      await expect(chain.execute({ prompt: 'test' })).rejects.toThrow('All providers have open circuits');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('All providers have open circuits'),
        expect.objectContaining({
          providers: expect.any(String),
        })
      );
    });
  });

  describe('metrics tracking', () => {
    it('should track failover count correctly', async () => {
      const logger = createMockLogger();
      const failingProvider = createFailingProvider('a', 'fail');
      const successProvider = createSuccessProvider('b', 'ok');

      const providers: ProviderFallbackConfig<unknown, string>[] = [
        { id: 'a', modelId: 'test-model-a', execute: failingProvider },
        { id: 'b', modelId: 'test-model-b', execute: successProvider },
      ];
      const chain = new FallbackChain(providers, { logger, baseDelayMs: 10, maxDelayMs: 100 });

      await chain.execute({ prompt: 'test' });

      const metricsA = chain.getMetrics('a');
      expect(metricsA?.failoverCount).toBe(1);
      expect(metricsA?.totalAttempts).toBe(1);
      expect(metricsA?.failedAttempts).toBe(1);

      const metricsB = chain.getMetrics('b');
      expect(metricsB?.successfulAttempts).toBe(1);
      expect(metricsB?.totalAttempts).toBe(1);
    });
  });
});