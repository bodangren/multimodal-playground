import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProviderCircuitBreakerManager } from './circuit-breaker-manager';
import { CircuitState, InMemoryCircuitBreakerPersistence } from './circuit-breaker';
import fs from 'fs/promises';

describe('ProviderCircuitBreakerManager', () => {
  let manager: ProviderCircuitBreakerManager;
  let persistence: InMemoryCircuitBreakerPersistence;

  beforeEach(() => {
    persistence = new InMemoryCircuitBreakerPersistence();
    manager = new ProviderCircuitBreakerManager(persistence);
  });

  afterEach(async () => {
    persistence.clear();
    try {
      await fs.unlink('.test-circuit-breaker-state.json');
    } catch {
      // ignore if file doesn't exist
    }
  });

  describe('getCircuitBreaker', () => {
    it('creates a new circuit breaker for unknown provider', async () => {
      const cb = await manager.getCircuitBreaker('unknown-provider');
      expect(cb.getState()).toBe(CircuitState.Closed);
    });

    it('returns same circuit breaker for same provider', async () => {
      const cb1 = await manager.getCircuitBreaker('test-provider');
      const cb2 = await manager.getCircuitBreaker('test-provider');
      expect(cb1).toBe(cb2);
    });
  });

  describe('isProviderAllowed', () => {
    it('returns true for healthy provider', async () => {
      const allowed = await manager.isProviderAllowed('test-provider');
      expect(allowed).toBe(true);
    });

    it('returns false after consecutive failures trip the circuit', async () => {
      for (let i = 0; i < 5; i++) {
        await manager.recordProviderFailure('test-provider');
      }
      const allowed = await manager.isProviderAllowed('test-provider');
      expect(allowed).toBe(false);
    });
  });

  describe('recordProviderSuccess', () => {
    it('records success on circuit breaker', async () => {
      await manager.recordProviderSuccess('test-provider');
      const state = await manager.getProviderState('test-provider');
      expect(state).toBe(CircuitState.Closed);
    });
  });

  describe('recordProviderFailure', () => {
    it('records failure on circuit breaker', async () => {
      await manager.recordProviderFailure('test-provider');
      const cb = await manager.getCircuitBreaker('test-provider');
      expect(cb.getFailureCount()).toBe(1);
    });

    it('transitions to open after threshold', async () => {
      for (let i = 0; i < 5; i++) {
        await manager.recordProviderFailure('test-provider');
      }
      const state = await manager.getProviderState('test-provider');
      expect(state).toBe(CircuitState.Open);
    });
  });

  describe('resetProvider', () => {
    it('resets circuit breaker state', async () => {
      for (let i = 0; i < 5; i++) {
        await manager.recordProviderFailure('test-provider');
      }
      await manager.resetProvider('test-provider');
      const state = await manager.getProviderState('test-provider');
      expect(state).toBe(CircuitState.Closed);
    });
  });

  describe('persistence', () => {
    it('persists state across manager instances', async () => {
      await manager.recordProviderFailure('test-provider');
      await manager.recordProviderFailure('test-provider');

      const newManager = new ProviderCircuitBreakerManager(persistence);
      const state = await newManager.getProviderState('test-provider');
      expect(state).toBe(CircuitState.Closed);
      const cb = await newManager.getCircuitBreaker('test-provider');
      expect(cb.getFailureCount()).toBe(2);
    });

    it('cold starts with correct state', async () => {
      await manager.recordProviderFailure('test-provider');
      await manager.recordProviderFailure('test-provider');
      await manager.recordProviderFailure('test-provider');
      await manager.recordProviderFailure('test-provider');
      await manager.recordProviderFailure('test-provider');
      expect(await manager.getProviderState('test-provider')).toBe(CircuitState.Open);

      const newManager = new ProviderCircuitBreakerManager(persistence);
      expect(await newManager.getProviderState('test-provider')).toBe(CircuitState.Open);
    });
  });

  describe('resetAll', () => {
    it('resets all circuit breakers', async () => {
      await manager.recordProviderFailure('provider-a');
      await manager.recordProviderFailure('provider-b');

      await manager.resetAll();

      expect(await manager.getProviderState('provider-a')).toBe(CircuitState.Closed);
      expect(await manager.getProviderState('provider-b')).toBe(CircuitState.Closed);
    });
  });
});