import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  CostModelSchema,
  CostConfigSchema,
  loadCostConfigFromEnv,
  getCostForModel,
  calculateRequestCost,
  validateCostConfig,
} from './cost-config';

describe('CostModelSchema', () => {
  it('should parse valid cost model', () => {
    const result = CostModelSchema.parse({
      providerId: 'openrouter',
      modelId: 'anthropic/claude-sonnet-4-20250514',
      modality: 'text',
      inputCostPerMillion: 3.0,
      outputCostPerMillion: 15.0,
    });
    expect(result.providerId).toBe('openrouter');
    expect(result.inputCostPerMillion).toBe(3.0);
  });

  it('should apply defaults for missing optional fields', () => {
    const result = CostModelSchema.parse({
      providerId: 'openrouter',
      modelId: 'test-model',
      modality: 'text',
    });
    expect(result.inputCostPerMillion).toBe(0);
    expect(result.outputCostPerMillion).toBe(0);
  });

  it('should reject negative costs', () => {
    expect(() => CostModelSchema.parse({
      providerId: 'openrouter',
      modelId: 'test-model',
      modality: 'text',
      inputCostPerMillion: -1,
    })).toThrow();
  });
});

describe('CostConfigSchema', () => {
  it('should parse valid config with models', () => {
    const result = CostConfigSchema.parse({
      enabled: true,
      models: {
        'openrouter:claude-sonnet': {
          providerId: 'openrouter',
          modelId: 'claude-sonnet',
          modality: 'text',
          inputCostPerMillion: 3.0,
          outputCostPerMillion: 15.0,
        },
      },
    });
    expect(result.enabled).toBe(true);
    expect(Object.keys(result.models)).toHaveLength(1);
  });

  it('should apply defaults', () => {
    const result = CostConfigSchema.parse({});
    expect(result.enabled).toBe(false);
    expect(result.models).toEqual({});
  });
});

describe('loadCostConfigFromEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env['COST_OPENROUTER__ANTHROPIC_CLAUDE_SONNET_INPUT'];
    delete process.env['COST_OPENROUTER__ANTHROPIC_CLAUDE_SONNET_OUTPUT'];
    delete process.env['COST_OPENAI__DALL_E_3_INPUT'];
    delete process.env['COST_OPENAI__DALL-E-3_INPUT'];
    delete process.env['COST_OPENAI__TTS_INPUT'];
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return default config when no cost env vars set', () => {
    delete process.env['COST_OPENROUTER__ANTHROPIC_CLAUDE_SONNET_INPUT'];
    delete process.env['COST_OPENROUTER__ANTHROPIC_CLAUDE_SONNET_OUTPUT'];

    const result = loadCostConfigFromEnv();
    expect(result.enabled).toBe(false);
    expect(result.models).toEqual({});
  });

  it('should parse cost from environment variables', () => {
    process.env['COST_OPENROUTER__ANTHROPIC_CLAUDE_SONNET_INPUT'] = '3.00';
    process.env['COST_OPENROUTER__ANTHROPIC_CLAUDE_SONNET_OUTPUT'] = '15.00';

    const result = loadCostConfigFromEnv();
    expect(result.enabled).toBe(true);
    const model = result.models['openrouter:anthropic-claude-sonnet'];
    expect(model).toBeDefined();
    expect(model?.inputCostPerMillion).toBe(3.0);
    expect(model?.outputCostPerMillion).toBe(15.0);
    expect(model?.modality).toBe('text');
  });

  it('should infer image modality from model name', () => {
    process.env['COST_OPENAI__DALL-E-3_INPUT'] = '0.04';

    const result = loadCostConfigFromEnv();
    const model = result.models['openai:dall-e-3'];
    expect(model?.modality).toBe('image');
  });

  it('should infer speech modality from model name', () => {
    process.env['COST_OPENAI__TTS_INPUT'] = '0.015';

    const result = loadCostConfigFromEnv();
    const model = result.models['openai:tts'];
    expect(model?.modality).toBe('speech');
  });
});

describe('getCostForModel', () => {
  const config = {
    enabled: true,
    models: {
      'openrouter:claude-sonnet': {
        providerId: 'openrouter',
        modelId: 'claude-sonnet',
        modality: 'text' as const,
        inputCostPerMillion: 3.0,
        outputCostPerMillion: 15.0,
      },
    },
  };

  it('should return cost model for known provider and model', () => {
    const result = getCostForModel(config, 'openrouter', 'claude-sonnet');
    expect(result).toBeDefined();
    expect(result?.inputCostPerMillion).toBe(3.0);
  });

  it('should return undefined for unknown model', () => {
    const result = getCostForModel(config, 'openrouter', 'unknown-model');
    expect(result).toBeUndefined();
  });
});

describe('calculateRequestCost', () => {
  const config = {
    enabled: true,
    models: {
      'openrouter:claude-sonnet': {
        providerId: 'openrouter',
        modelId: 'claude-sonnet',
        modality: 'text' as const,
        inputCostPerMillion: 3.0,
        outputCostPerMillion: 15.0,
      },
    },
  };

  it('should calculate cost for given tokens', () => {
    const result = calculateRequestCost(config, 'openrouter', 'claude-sonnet', 1000, 500);
    expect(result).toBeCloseTo((1000 / 1_000_000) * 3.0 + (500 / 1_000_000) * 15.0);
  });

  it('should return 0 for unknown model', () => {
    const result = calculateRequestCost(config, 'openrouter', 'unknown-model', 1000, 500);
    expect(result).toBe(0);
  });

  it('should return 0 when config is empty', () => {
    const result = calculateRequestCost({ enabled: false, models: {} }, 'openrouter', 'claude-sonnet', 1000, 500);
    expect(result).toBe(0);
  });
});

describe('validateCostConfig', () => {
  it('should return parsed config for valid input', () => {
    const input = {
      enabled: true,
      models: {
        'test': {
          providerId: 'test',
          modelId: 'test',
          modality: 'text',
          inputCostPerMillion: 1,
          outputCostPerMillion: 2,
        },
      },
    };
    const result = validateCostConfig(input);
    expect(result.enabled).toBe(true);
  });

  it('should throw for invalid config', () => {
    expect(() => validateCostConfig({ enabled: 'not a boolean' })).toThrow();
  });
});