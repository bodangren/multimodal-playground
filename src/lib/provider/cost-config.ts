import { z } from 'zod';

export const CostModelSchema = z.object({
  providerId: z.string(),
  modelId: z.string(),
  modality: z.enum(['text', 'image', 'speech', 'transcription', 'video']),
  inputCostPerMillion: z.number().min(0).default(0),
  outputCostPerMillion: z.number().min(0).default(0),
});

export type CostModel = z.infer<typeof CostModelSchema>;

export const CostConfigSchema: z.ZodType<CostConfig> = z.object({
  models: z.record(z.string(), CostModelSchema).optional().transform((val) => val ?? {}),
  enabled: z.boolean().default(false),
});

export type CostConfig = z.infer<typeof CostConfigSchema>;

export const DEFAULT_COST_CONFIG: CostConfig = {
  models: {},
  enabled: false,
};

const ENV_COST_PREFIX = 'COST_';

function parseCostFromEnv(): Record<string, CostModel> {
  const models: Record<string, CostModel> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith(ENV_COST_PREFIX) || !value) continue;

    const withoutPrefix = key.slice(ENV_COST_PREFIX.length);
    const lastUnderscore = withoutPrefix.lastIndexOf('_');
    if (lastUnderscore === -1) continue;

    const costType = withoutPrefix.slice(lastUnderscore + 1).toLowerCase();
    if (costType !== 'input' && costType !== 'output') continue;

    const providerAndModel = withoutPrefix.slice(0, lastUnderscore);
    const separatorIdx = providerAndModel.indexOf('__');
    if (separatorIdx === -1) continue;

    const providerId = providerAndModel.slice(0, separatorIdx).toLowerCase();
    const modelId = providerAndModel.slice(separatorIdx + 2).toLowerCase();

    if (!providerId || !modelId) continue;

    const costValue = parseFloat(value);
    if (isNaN(costValue)) continue;

    const modelKey = `${providerId}:${modelId.replace(/_/g, '-')}`;
    if (!models[modelKey]) {
      const modality = inferModalityFromModelId(modelId);
      models[modelKey] = {
        providerId,
        modelId: modelId.replace(/_/g, '-'),
        modality,
        inputCostPerMillion: 0,
        outputCostPerMillion: 0,
      };
    }

    if (costType === 'input') {
      models[modelKey].inputCostPerMillion = costValue;
    } else {
      models[modelKey].outputCostPerMillion = costValue;
    }
  }

  return models;
}

function inferModalityFromModelId(modelId: string): CostModel['modality'] {
  const lower = modelId.toLowerCase();
  if (lower.includes('image') || lower.includes('vision') || lower.includes('dall')) {
    return 'image';
  }
  if (lower.includes('speech') || lower.includes('tts') || lower.includes('audio')) {
    return 'speech';
  }
  if (lower.includes('transcribe') || lower.includes('whisper')) {
    return 'transcription';
  }
  if (lower.includes('video')) {
    return 'video';
  }
  return 'text';
}

export function loadCostConfigFromEnv(config: Partial<CostConfig> = {}): CostConfig {
  const envModels = parseCostFromEnv();
  const enabled = Object.keys(envModels).length > 0 || config.enabled === true;

  return {
    enabled,
    models: Object.keys(envModels).length > 0 ? envModels : config.models ?? {},
  };
}

export function getCostForModel(config: CostConfig, providerId: string, modelId: string): CostModel | undefined {
  const key = `${providerId}:${modelId}`;
  return config.models[key];
}

export function calculateRequestCost(config: CostConfig, providerId: string, modelId: string, inputTokens: number, outputTokens: number): number {
  const costModel = getCostForModel(config, providerId, modelId);
  if (!costModel) return 0;

  const inputCost = (inputTokens / 1_000_000) * costModel.inputCostPerMillion;
  const outputCost = (outputTokens / 1_000_000) * costModel.outputCostPerMillion;
  return inputCost + outputCost;
}

export function validateCostConfig(config: unknown): CostConfig {
  return CostConfigSchema.parse(config);
}