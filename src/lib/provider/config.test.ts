import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ProviderConfigSchema,
  loadProviderConfigFromEnv,
  getProviderPriorityForModality,
  validateProviderConfig,
  isValidModality,
  type ProviderConfig,
} from './config';

describe('ProviderConfig', () => {
  describe('schema validation', () => {
    it('should parse a valid config object', () => {
      const config = {
        priority: {
          text: ['openrouter', 'openai'],
          image: ['openrouter'],
          speech: ['openai'],
          transcription: ['openrouter'],
          video: ['openrouter'],
        },
        fallback: {
          maxAttempts: 5,
          baseDelayMs: 2000,
          maxDelayMs: 60000,
        },
      };
      const result = ProviderConfigSchema.parse(config);
      expect(result.priority.text).toEqual(['openrouter', 'openai']);
      expect(result.fallback.maxAttempts).toBe(5);
    });

    it('should apply default values for missing fields', () => {
      const result = ProviderConfigSchema.parse({});
      expect(result.priority.text).toEqual(['openrouter', 'openai', 'anthropic']);
      expect(result.priority.image).toEqual(['openrouter', 'openai']);
      expect(result.priority.speech).toEqual(['openrouter', 'openai']);
      expect(result.priority.transcription).toEqual(['openrouter', 'openai']);
      expect(result.priority.video).toEqual(['openrouter']);
      expect(result.fallback.maxAttempts).toBe(3);
      expect(result.fallback.baseDelayMs).toBe(1000);
      expect(result.fallback.maxDelayMs).toBe(30000);
      expect(result.circuitBreaker.failureThreshold).toBe(5);
      expect(result.circuitBreaker.cooldownMs).toBe(60000);
      expect(result.circuitBreaker.probeCount).toBe(3);
      expect(result.healthWindow.windowSizeMs).toBe(60000);
      expect(result.healthWindow.minSamples).toBe(5);
      expect(result.healthWindow.degradedThreshold).toBe(0.9);
      expect(result.healthWindow.downThreshold).toBe(0.5);
    });

    it('should reject invalid modality in priority', () => {
      const config = {
        priority: {
          text: ['invalid-provider'],
        },
      };
      expect(() => ProviderConfigSchema.parse(config)).not.toThrow();
    });

    it('should validate circuit breaker options', () => {
      const config = {
        circuitBreaker: {
          failureThreshold: 10,
          cooldownMs: 120000,
          probeCount: 5,
        },
      };
      const result = ProviderConfigSchema.parse(config);
      expect(result.circuitBreaker.failureThreshold).toBe(10);
      expect(result.circuitBreaker.cooldownMs).toBe(120000);
      expect(result.circuitBreaker.probeCount).toBe(5);
    });

    it('should validate health window options', () => {
      const config = {
        healthWindow: {
          windowSizeMs: 120000,
          minSamples: 10,
          degradedThreshold: 0.95,
          downThreshold: 0.6,
        },
      };
      const result = ProviderConfigSchema.parse(config);
      expect(result.healthWindow.windowSizeMs).toBe(120000);
      expect(result.healthWindow.minSamples).toBe(10);
      expect(result.healthWindow.degradedThreshold).toBe(0.95);
      expect(result.healthWindow.downThreshold).toBe(0.6);
    });
  });

  describe('loadProviderConfigFromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return default config when no env vars are set', () => {
      const config = loadProviderConfigFromEnv();
      expect(config.priority.text).toEqual(['openrouter', 'openai', 'anthropic']);
      expect(config.priority.image).toEqual(['openrouter', 'openai']);
      expect(config.fallback.maxAttempts).toBe(3);
    });

    it('should override text priority from env var', () => {
      process.env.PROVIDER_TEXT_PRIORITY = 'openai,anthropic,openrouter';
      const config = loadProviderConfigFromEnv();
      expect(config.priority.text).toEqual(['openai', 'anthropic', 'openrouter']);
    });

    it('should override image priority from env var', () => {
      process.env.PROVIDER_IMAGE_PRIORITY = 'openai';
      const config = loadProviderConfigFromEnv();
      expect(config.priority.image).toEqual(['openai']);
    });

    it('should override speech priority from env var', () => {
      process.env.PROVIDER_SPEECH_PRIORITY = 'anthropic,openai';
      const config = loadProviderConfigFromEnv();
      expect(config.priority.speech).toEqual(['anthropic', 'openai']);
    });

    it('should override transcription priority from env var', () => {
      process.env.PROVIDER_TRANSCRIPTION_PRIORITY = 'openai';
      const config = loadProviderConfigFromEnv();
      expect(config.priority.transcription).toEqual(['openai']);
    });

    it('should override video priority from env var', () => {
      process.env.PROVIDER_VIDEO_PRIORITY = 'openrouter,openai';
      const config = loadProviderConfigFromEnv();
      expect(config.priority.video).toEqual(['openrouter', 'openai']);
    });

    it('should handle empty env var for priority and fall back to default', () => {
      process.env.PROVIDER_TEXT_PRIORITY = '';
      const config = loadProviderConfigFromEnv();
      expect(config.priority.text).toEqual(['openrouter', 'openai', 'anthropic']);
    });

    it('should ignore priority env var with only whitespace', () => {
      process.env.PROVIDER_TEXT_PRIORITY = '   ';
      const config = loadProviderConfigFromEnv();
      expect(config.priority.text).toEqual(['openrouter', 'openai', 'anthropic']);
    });

    it('should override fallback max attempts from env var', () => {
      process.env.PROVIDER_FALLBACK_MAX_ATTEMPTS = '5';
      const config = loadProviderConfigFromEnv();
      expect(config.fallback.maxAttempts).toBe(5);
    });

    it('should override fallback base delay from env var', () => {
      process.env.PROVIDER_FALLBACK_BASE_DELAY_MS = '2000';
      const config = loadProviderConfigFromEnv();
      expect(config.fallback.baseDelayMs).toBe(2000);
    });

    it('should override fallback max delay from env var', () => {
      process.env.PROVIDER_FALLBACK_MAX_DELAY_MS = '60000';
      const config = loadProviderConfigFromEnv();
      expect(config.fallback.maxDelayMs).toBe(60000);
    });

    it('should override circuit breaker failure threshold from env var', () => {
      process.env.PROVIDER_CB_FAILURE_THRESHOLD = '10';
      const config = loadProviderConfigFromEnv();
      expect(config.circuitBreaker.failureThreshold).toBe(10);
    });

    it('should override circuit breaker cooldown from env var', () => {
      process.env.PROVIDER_CB_COOLDOWN_MS = '120000';
      const config = loadProviderConfigFromEnv();
      expect(config.circuitBreaker.cooldownMs).toBe(120000);
    });

    it('should override circuit breaker probe count from env var', () => {
      process.env.PROVIDER_CB_PROBE_COUNT = '5';
      const config = loadProviderConfigFromEnv();
      expect(config.circuitBreaker.probeCount).toBe(5);
    });

    it('should override health window size from env var', () => {
      process.env.PROVIDER_HEALTH_WINDOW_SIZE_MS = '120000';
      const config = loadProviderConfigFromEnv();
      expect(config.healthWindow.windowSizeMs).toBe(120000);
    });

    it('should override health window min samples from env var', () => {
      process.env.PROVIDER_HEALTH_MIN_SAMPLES = '10';
      const config = loadProviderConfigFromEnv();
      expect(config.healthWindow.minSamples).toBe(10);
    });

    it('should use default values for non-numeric env vars', () => {
      process.env.PROVIDER_FALLBACK_MAX_ATTEMPTS = 'not-a-number';
      const config = loadProviderConfigFromEnv();
      expect(config.fallback.maxAttempts).toBe(3);
    });

    it('should merge with provided partial config', () => {
      const partialConfig: Partial<ProviderConfig> = {
        priority: {
          text: ['custom-provider'],
          image: ['openrouter'],
          speech: ['openrouter'],
          transcription: ['openrouter'],
          video: ['openrouter'],
        },
      };
      process.env.PROVIDER_TEXT_PRIORITY = 'env-provider';
      const config = loadProviderConfigFromEnv(partialConfig);
      expect(config.priority.text).toEqual(['env-provider']);
      expect(config.priority.image).toEqual(['openrouter']);
    });
  });

  describe('getProviderPriorityForModality', () => {
    const config: ProviderConfig = {
      priority: {
        text: ['openrouter', 'openai'],
        image: ['openrouter'],
        speech: ['openai'],
        transcription: ['openrouter', 'openai'],
        video: ['openrouter'],
      },
      fallback: { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 30000 },
      circuitBreaker: { failureThreshold: 5, cooldownMs: 60000, probeCount: 3 },
      healthWindow: { windowSizeMs: 60000, minSamples: 5, degradedThreshold: 0.9, downThreshold: 0.5 },
    };

    it('should return priority list for text modality', () => {
      expect(getProviderPriorityForModality(config, 'text')).toEqual(['openrouter', 'openai']);
    });

    it('should return priority list for image modality', () => {
      expect(getProviderPriorityForModality(config, 'image')).toEqual(['openrouter']);
    });

    it('should return priority list for speech modality', () => {
      expect(getProviderPriorityForModality(config, 'speech')).toEqual(['openai']);
    });

    it('should return priority list for transcription modality', () => {
      expect(getProviderPriorityForModality(config, 'transcription')).toEqual(['openrouter', 'openai']);
    });

    it('should return priority list for video modality', () => {
      expect(getProviderPriorityForModality(config, 'video')).toEqual(['openrouter']);
    });
  });

  describe('validateProviderConfig', () => {
    it('should return validated config for valid input', () => {
      const config = {
        priority: {
          text: ['openrouter'],
        },
      };
      const result = validateProviderConfig(config);
      expect(result.priority.text).toEqual(['openrouter']);
    });

    it('should throw for invalid config', () => {
      expect(() => validateProviderConfig(null)).toThrow();
      expect(() => validateProviderConfig(undefined)).toThrow();
    });
  });

  describe('isValidModality', () => {
    it('should return true for valid modalities', () => {
      expect(isValidModality('text')).toBe(true);
      expect(isValidModality('image')).toBe(true);
      expect(isValidModality('speech')).toBe(true);
      expect(isValidModality('transcription')).toBe(true);
      expect(isValidModality('video')).toBe(true);
    });

    it('should return false for invalid modalities', () => {
      expect(isValidModality('invalid')).toBe(false);
      expect(isValidModality('')).toBe(false);
      expect(isValidModality('TEXT')).toBe(false);
    });
  });
});
