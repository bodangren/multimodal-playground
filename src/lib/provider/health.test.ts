import { describe, it, expect, beforeEach } from 'vitest';
import {
  HealthWindow,
  ProviderHealthTracker,
  ProviderStatus,
} from './health';

describe('HealthWindow', () => {
  let healthWindow: HealthWindow;

  beforeEach(() => {
    healthWindow = new HealthWindow({
      windowSizeMs: 60000,
      minSamples: 5,
      degradedThreshold: 0.9,
      downThreshold: 0.5,
    });
  });

  describe('record', () => {
    it('should record successful outcomes', () => {
      healthWindow.record(true, 100);
      expect(healthWindow.getOutcomes()).toHaveLength(1);
    });

    it('should record failed outcomes with error codes', () => {
      healthWindow.record(false, 50, 500);
      const outcomes = healthWindow.getOutcomes();
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0].success).toBe(false);
      expect(outcomes[0].errorCode).toBe(500);
    });
  });

  describe('getSuccessRate', () => {
    it('should return 1.0 when no outcomes recorded', () => {
      expect(healthWindow.getSuccessRate()).toBe(1.0);
    });

    it('should calculate correct success rate', () => {
      healthWindow.record(true, 100);
      healthWindow.record(true, 100);
      healthWindow.record(false, 100);
      healthWindow.record(false, 100);
      expect(healthWindow.getSuccessRate()).toBe(0.5);
    });

    it('should return 1.0 for all successful outcomes', () => {
      healthWindow.record(true, 100);
      healthWindow.record(true, 100);
      healthWindow.record(true, 100);
      expect(healthWindow.getSuccessRate()).toBe(1.0);
    });
  });

  describe('getLatencyStats', () => {
    it('should return zeros when no outcomes', () => {
      const stats = healthWindow.getLatencyStats();
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.avg).toBe(0);
      expect(stats.p50).toBe(0);
      expect(stats.p95).toBe(0);
      expect(stats.p99).toBe(0);
    });

    it('should calculate correct latency stats', () => {
      healthWindow.record(true, 100);
      healthWindow.record(true, 200);
      healthWindow.record(true, 300);

      const stats = healthWindow.getLatencyStats();
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(300);
      expect(stats.avg).toBe(200);
    });

    it('should calculate correct percentiles', () => {
      for (let i = 1; i <= 100; i++) {
        healthWindow.record(true, i);
      }

      const stats = healthWindow.getLatencyStats();
      expect(stats.p50).toBe(50);
      expect(stats.p95).toBe(95);
      expect(stats.p99).toBe(99);
    });
  });

  describe('getStatus', () => {
    it('should return healthy when below minSamples', () => {
      healthWindow.record(true, 100);
      healthWindow.record(true, 100);
      healthWindow.record(true, 100);
      healthWindow.record(true, 100);
      expect(healthWindow.getStatus()).toBe(ProviderStatus.Healthy);
    });

    it('should return healthy when success rate >= degradedThreshold', () => {
      for (let i = 0; i < 5; i++) {
        healthWindow.record(true, 100);
      }
      expect(healthWindow.getStatus()).toBe(ProviderStatus.Healthy);
    });

    it('should return degraded when success rate between downThreshold and degradedThreshold', () => {
      for (let i = 0; i < 5; i++) {
        healthWindow.record(i < 3, 100);
      }
      expect(healthWindow.getStatus()).toBe(ProviderStatus.Degraded);
    });

    it('should return down when success rate < downThreshold', () => {
      for (let i = 0; i < 5; i++) {
        healthWindow.record(i < 2, 100);
      }
      expect(healthWindow.getStatus()).toBe(ProviderStatus.Down);
    });
  });

  describe('sliding window', () => {
    it('should prune outcomes outside window', async () => {
      const shortWindow = new HealthWindow({
        windowSizeMs: 100,
        minSamples: 1,
        degradedThreshold: 0.9,
        downThreshold: 0.5,
      });

      shortWindow.record(true, 100);
      expect(shortWindow.getOutcomes()).toHaveLength(1);

      shortWindow.record(true, 100);
      expect(shortWindow.getOutcomes()).toHaveLength(2);

      await new Promise((resolve) => setTimeout(resolve, 150));
      shortWindow.record(true, 100);
      expect(shortWindow.getOutcomes()).toHaveLength(1);
    });
  });

  describe('getHealth', () => {
    it('should return complete health object', () => {
      healthWindow.record(true, 100);
      healthWindow.record(true, 200);
      healthWindow.record(false, 50, 500);

      const health = healthWindow.getHealth();
      expect(health.providerId).toBe('provider');
      expect(health.totalRequests).toBe(3);
      expect(health.successfulRequests).toBe(2);
      expect(health.failedRequests).toBe(1);
      expect(health.successRate).toBeCloseTo(0.667, 2);
    });

    it('should return degraded status with enough failed samples', () => {
      for (let i = 0; i < 5; i++) {
        healthWindow.record(i < 3, 100);
      }
      const health = healthWindow.getHealth();
      expect(health.status).toBe(ProviderStatus.Degraded);
    });
  });
});

describe('ProviderHealthTracker', () => {
  let tracker: ProviderHealthTracker;

  beforeEach(() => {
    tracker = new ProviderHealthTracker({
      windowSizeMs: 60000,
      minSamples: 3,
      degradedThreshold: 0.9,
      downThreshold: 0.5,
    });
  });

  describe('getOrCreateTracker', () => {
    it('should create tracker for new provider', () => {
      const healthWindow = tracker.getOrCreateTracker('openrouter');
      expect(healthWindow).toBeDefined();
    });

    it('should return same tracker for same provider', () => {
      const t1 = tracker.getOrCreateTracker('openrouter');
      const t2 = tracker.getOrCreateTracker('openrouter');
      expect(t1).toBe(t2);
    });
  });

  describe('record', () => {
    it('should record outcome for provider', () => {
      tracker.record('openrouter', true, 100);
      const health = tracker.getHealth('openrouter');
      expect(health?.totalRequests).toBe(1);
      expect(health?.successfulRequests).toBe(1);
    });

    it('should create tracker automatically on record', () => {
      tracker.record('newprovider', false, 50, 503);
      const health = tracker.getHealth('newprovider');
      expect(health).toBeDefined();
      expect(health?.failedRequests).toBe(1);
    });
  });

  describe('getHealth', () => {
    it('should return undefined for unknown provider', () => {
      expect(tracker.getHealth('unknown')).toBeUndefined();
    });
  });

  describe('getAllHealth', () => {
    it('should return health for all trackers', () => {
      tracker.record('provider1', true, 100);
      tracker.record('provider2', false, 50, 500);

      const allHealth = tracker.getAllHealth();
      expect(allHealth.size).toBe(2);
      expect(allHealth.get('provider1')?.totalRequests).toBe(1);
      expect(allHealth.get('provider2')?.failedRequests).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset specific provider', () => {
      tracker.record('provider1', true, 100);
      tracker.record('provider2', true, 100);

      tracker.reset('provider1');
      expect(tracker.getHealth('provider1')).toBeUndefined();
      expect(tracker.getHealth('provider2')?.totalRequests).toBe(1);
    });

    it('should reset all providers when no id provided', () => {
      tracker.record('provider1', true, 100);
      tracker.record('provider2', true, 100);

      tracker.reset();
      expect(tracker.getHealth('provider1')).toBeUndefined();
      expect(tracker.getHealth('provider2')).toBeUndefined();
    });
  });
});