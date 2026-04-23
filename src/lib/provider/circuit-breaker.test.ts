import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreaker, CircuitState, InMemoryCircuitBreakerPersistence } from './circuit-breaker';

describe('CircuitBreaker', () => {
  let persistence: InMemoryCircuitBreakerPersistence;

  beforeEach(() => {
    persistence = new InMemoryCircuitBreakerPersistence();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));
  });

  describe('initial state', () => {
    it('starts in closed state', () => {
      const cb = new CircuitBreaker('test-provider', {}, persistence);
      expect(cb.getState()).toBe(CircuitState.Closed);
    });

    it('allows requests when closed', () => {
      const cb = new CircuitBreaker('test-provider', {}, persistence);
      expect(cb.isAllowed()).toBe(true);
    });
  });

  describe('closed -> open transition', () => {
    it('transitions to open after failure threshold reached', () => {
      const cb = new CircuitBreaker('test-provider', { failureThreshold: 3 }, persistence);

      cb.recordFailure();
      expect(cb.getState()).toBe(CircuitState.Closed);
      expect(cb.isAllowed()).toBe(true);

      cb.recordFailure();
      expect(cb.getState()).toBe(CircuitState.Closed);
      expect(cb.isAllowed()).toBe(true);

      cb.recordFailure();
      expect(cb.getState()).toBe(CircuitState.Open);
      expect(cb.isAllowed()).toBe(false);
    });

    it('increments failure count on each failure', () => {
      const cb = new CircuitBreaker('test-provider', { failureThreshold: 5 }, persistence);

      cb.recordFailure();
      expect(cb.getFailureCount()).toBe(1);

      cb.recordFailure();
      expect(cb.getFailureCount()).toBe(2);
    });

    it('decrements failure count on success when closed', () => {
      const cb = new CircuitBreaker('test-provider', { failureThreshold: 3 }, persistence);

      cb.recordFailure();
      cb.recordFailure();
      expect(cb.getFailureCount()).toBe(2);

      cb.recordSuccess();
      expect(cb.getFailureCount()).toBe(1);
    });

    it('records last failure time', () => {
      const cb = new CircuitBreaker('test-provider', {}, persistence);
      const beforeFailure = Date.now();

      cb.recordFailure();

      const afterFailure = Date.now();
      expect(cb.getLastFailureTime()).toBeGreaterThanOrEqual(beforeFailure);
      expect(cb.getLastFailureTime()).toBeLessThanOrEqual(afterFailure);
    });
  });

  describe('open -> half-open transition', () => {
    it('transitions to half-open after cooldown period', () => {
      const cb = new CircuitBreaker('test-provider', { failureThreshold: 1, cooldownMs: 30_000 }, persistence);

      cb.recordFailure();
      expect(cb.getState()).toBe(CircuitState.Open);
      expect(cb.isAllowed()).toBe(false);

      vi.advanceTimersByTime(30_000);
      expect(cb.isAllowed()).toBe(true);
      expect(cb.getState()).toBe(CircuitState.HalfOpen);
    });

    it('does not transition before cooldown expires', () => {
      const cb = new CircuitBreaker('test-provider', { failureThreshold: 1, cooldownMs: 30_000 }, persistence);

      cb.recordFailure();
      vi.advanceTimersByTime(29_999);

      expect(cb.isAllowed()).toBe(false);
      expect(cb.getState()).toBe(CircuitState.Open);
    });
  });

  describe('half-open -> closed transition', () => {
    it('transitions to closed after probe count successes', () => {
      const cb = new CircuitBreaker('test-provider', { failureThreshold: 1, cooldownMs: 1, probeCount: 3 }, persistence);

      cb.recordFailure();
      vi.advanceTimersByTime(1);
      cb.isAllowed();

      expect(cb.getState()).toBe(CircuitState.HalfOpen);

      cb.recordSuccess();
      expect(cb.getState()).toBe(CircuitState.HalfOpen);

      cb.recordSuccess();
      expect(cb.getState()).toBe(CircuitState.HalfOpen);

      cb.recordSuccess();
      expect(cb.getState()).toBe(CircuitState.Closed);
    });

    it('allows limited requests in half-open state', () => {
      const cb = new CircuitBreaker('test-provider', { failureThreshold: 1, cooldownMs: 1, probeCount: 2 }, persistence);

      cb.recordFailure();
      vi.advanceTimersByTime(1);
      cb.isAllowed();

      expect(cb.getState()).toBe(CircuitState.HalfOpen);
      expect(cb.isAllowed()).toBe(true);
      expect(cb.isAllowed()).toBe(true);
      expect(cb.isAllowed()).toBe(false);
    });
  });

  describe('half-open -> open transition', () => {
    it('returns to open on failure in half-open state', () => {
      const cb = new CircuitBreaker('test-provider', { failureThreshold: 1, cooldownMs: 1, probeCount: 3 }, persistence);

      cb.recordFailure();
      vi.advanceTimersByTime(1);
      cb.isAllowed();

      expect(cb.getState()).toBe(CircuitState.HalfOpen);
      cb.recordFailure();
      expect(cb.getState()).toBe(CircuitState.Open);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      const cb = new CircuitBreaker('test-provider', { failureThreshold: 2 }, persistence);

      cb.recordFailure();
      cb.recordFailure();
      expect(cb.getState()).toBe(CircuitState.Open);

      cb.reset();

      expect(cb.getState()).toBe(CircuitState.Closed);
      expect(cb.getFailureCount()).toBe(0);
      expect(cb.getLastFailureTime()).toBeNull();
    });
  });

  describe('persistence', () => {
    it('persists state to memory', async () => {
      const cb1 = new CircuitBreaker('test-provider', { failureThreshold: 2 }, persistence);
      cb1.recordFailure();
      cb1.recordFailure();
      expect(cb1.getState()).toBe(CircuitState.Open);

      const cb2 = new CircuitBreaker('test-provider', { failureThreshold: 2 }, persistence);
      await cb2.initialize();

      expect(cb2.getState()).toBe(CircuitState.Open);
      expect(cb2.getFailureCount()).toBe(2);
    });

    it('restores half-open state after cooldown with fake timers issue', async () => {
      vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));

      const cb1 = new CircuitBreaker('test-provider', { failureThreshold: 1, cooldownMs: 30_000 }, persistence);
      cb1.recordFailure();
      expect(cb1.getState()).toBe(CircuitState.Open);

      const cb2 = new CircuitBreaker('test-provider', { failureThreshold: 1, cooldownMs: 30_000 }, persistence);
      await cb2.initialize();

      vi.advanceTimersByTime(30_000);
      expect(cb2.isAllowed()).toBe(true);
      expect(cb2.getState()).toBe(CircuitState.HalfOpen);
    });

    it('cold start defaults to closed state when no persistence', async () => {
      const cb = new CircuitBreaker('test-provider', {});
      expect(cb.getState()).toBe(CircuitState.Closed);
    });
  });

  describe('getLastStateChangeTime', () => {
    it('records state change time', () => {
      vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));
      const cb = new CircuitBreaker('test-provider', { failureThreshold: 1 }, persistence);

      const beforeFailure = Date.now();
      cb.recordFailure();
      const afterFailure = Date.now();

      expect(cb.getLastStateChangeTime()).toBeGreaterThanOrEqual(beforeFailure);
      expect(cb.getLastStateChangeTime()).toBeLessThanOrEqual(afterFailure);
    });
  });
});