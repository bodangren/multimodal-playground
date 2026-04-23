import { z } from 'zod';

export const Modality = z.enum(['text', 'image', 'speech', 'transcription', 'video']);
export type Modality = z.infer<typeof Modality>;

export const DEFAULT_PRIORITY: ProviderPriority = {
  text: ['openrouter', 'openai', 'anthropic'],
  image: ['openrouter', 'openai'],
  speech: ['openrouter', 'openai'],
  transcription: ['openrouter', 'openai'],
  video: ['openrouter'],
};

export const DEFAULT_FALLBACK_OPTIONS: FallbackOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

export const DEFAULT_CIRCUIT_BREAKER_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  cooldownMs: 60000,
  probeCount: 3,
};

export const DEFAULT_HEALTH_WINDOW_OPTIONS: HealthWindowOptions = {
  windowSizeMs: 60000,
  minSamples: 5,
  degradedThreshold: 0.9,
  downThreshold: 0.5,
};

export const ProviderPrioritySchema = z.object({
  text: z.array(z.string()).default(['openrouter', 'openai', 'anthropic']),
  image: z.array(z.string()).default(['openrouter', 'openai']),
  speech: z.array(z.string()).default(['openrouter', 'openai']),
  transcription: z.array(z.string()).default(['openrouter', 'openai']),
  video: z.array(z.string()).default(['openrouter']),
});

export type ProviderPriority = z.infer<typeof ProviderPrioritySchema>;

const FallbackOptionsSchema = z.object({
  maxAttempts: z.number().int().min(1).default(3),
  baseDelayMs: z.number().int().min(0).default(1000),
  maxDelayMs: z.number().int().min(0).default(30000),
});

export type FallbackOptions = z.infer<typeof FallbackOptionsSchema>;

const CircuitBreakerOptionsSchema = z.object({
  failureThreshold: z.number().int().min(1).default(5),
  cooldownMs: z.number().int().min(0).default(60000),
  probeCount: z.number().int().min(1).default(3),
});

export type CircuitBreakerOptions = z.infer<typeof CircuitBreakerOptionsSchema>;

const HealthWindowOptionsSchema = z.object({
  windowSizeMs: z.number().int().min(1000).default(60000),
  minSamples: z.number().int().min(1).default(5),
  degradedThreshold: z.number().min(0).max(1).default(0.9),
  downThreshold: z.number().min(0).max(1).default(0.5),
});

export type HealthWindowOptions = z.infer<typeof HealthWindowOptionsSchema>;

export const ProviderConfigSchema = z.object({
  priority: ProviderPrioritySchema.optional(),
  fallback: FallbackOptionsSchema.optional(),
  circuitBreaker: CircuitBreakerOptionsSchema.optional(),
  healthWindow: HealthWindowOptionsSchema.optional(),
}).transform((val) => ({
  priority: { ...DEFAULT_PRIORITY, ...val.priority },
  fallback: { ...DEFAULT_FALLBACK_OPTIONS, ...val.fallback },
  circuitBreaker: { ...DEFAULT_CIRCUIT_BREAKER_OPTIONS, ...val.circuitBreaker },
  healthWindow: { ...DEFAULT_HEALTH_WINDOW_OPTIONS, ...val.healthWindow },
}));

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

const ENV_PRIORITY_KEYS: Record<keyof ProviderPriority, string> = {
  text: 'PROVIDER_TEXT_PRIORITY',
  image: 'PROVIDER_IMAGE_PRIORITY',
  speech: 'PROVIDER_SPEECH_PRIORITY',
  transcription: 'PROVIDER_TRANSCRIPTION_PRIORITY',
  video: 'PROVIDER_VIDEO_PRIORITY',
};

function parsePriorityFromEnv(key: keyof ProviderPriority, defaultValue: string[]): string[] {
  const envKey = ENV_PRIORITY_KEYS[key];
  const envValue = process.env[envKey];
  if (!envValue) return defaultValue;
  const parsed = envValue.split(',').map((s) => s.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : defaultValue;
}

function parseNumberFromEnv(key: string, defaultValue: number): number {
  const envValue = process.env[key];
  if (!envValue) return defaultValue;
  const parsed = parseInt(envValue, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function loadProviderConfigFromEnv(config: Partial<ProviderConfig> = {}): ProviderConfig {
  return {
    priority: {
      text: parsePriorityFromEnv('text', config.priority?.text ?? DEFAULT_PRIORITY.text),
      image: parsePriorityFromEnv('image', config.priority?.image ?? DEFAULT_PRIORITY.image),
      speech: parsePriorityFromEnv('speech', config.priority?.speech ?? DEFAULT_PRIORITY.speech),
      transcription: parsePriorityFromEnv('transcription', config.priority?.transcription ?? DEFAULT_PRIORITY.transcription),
      video: parsePriorityFromEnv('video', config.priority?.video ?? DEFAULT_PRIORITY.video),
    },
    fallback: {
      maxAttempts: parseNumberFromEnv('PROVIDER_FALLBACK_MAX_ATTEMPTS', config.fallback?.maxAttempts ?? DEFAULT_FALLBACK_OPTIONS.maxAttempts),
      baseDelayMs: parseNumberFromEnv('PROVIDER_FALLBACK_BASE_DELAY_MS', config.fallback?.baseDelayMs ?? DEFAULT_FALLBACK_OPTIONS.baseDelayMs),
      maxDelayMs: parseNumberFromEnv('PROVIDER_FALLBACK_MAX_DELAY_MS', config.fallback?.maxDelayMs ?? DEFAULT_FALLBACK_OPTIONS.maxDelayMs),
    },
    circuitBreaker: {
      failureThreshold: parseNumberFromEnv('PROVIDER_CB_FAILURE_THRESHOLD', config.circuitBreaker?.failureThreshold ?? DEFAULT_CIRCUIT_BREAKER_OPTIONS.failureThreshold),
      cooldownMs: parseNumberFromEnv('PROVIDER_CB_COOLDOWN_MS', config.circuitBreaker?.cooldownMs ?? DEFAULT_CIRCUIT_BREAKER_OPTIONS.cooldownMs),
      probeCount: parseNumberFromEnv('PROVIDER_CB_PROBE_COUNT', config.circuitBreaker?.probeCount ?? DEFAULT_CIRCUIT_BREAKER_OPTIONS.probeCount),
    },
    healthWindow: {
      windowSizeMs: parseNumberFromEnv('PROVIDER_HEALTH_WINDOW_SIZE_MS', config.healthWindow?.windowSizeMs ?? DEFAULT_HEALTH_WINDOW_OPTIONS.windowSizeMs),
      minSamples: parseNumberFromEnv('PROVIDER_HEALTH_MIN_SAMPLES', config.healthWindow?.minSamples ?? DEFAULT_HEALTH_WINDOW_OPTIONS.minSamples),
      degradedThreshold: config.healthWindow?.degradedThreshold ?? DEFAULT_HEALTH_WINDOW_OPTIONS.degradedThreshold,
      downThreshold: config.healthWindow?.downThreshold ?? DEFAULT_HEALTH_WINDOW_OPTIONS.downThreshold,
    },
  };
}

export function getProviderPriorityForModality(config: ProviderConfig, modality: Modality): string[] {
  return config.priority[modality];
}

export function validateProviderConfig(config: unknown): ProviderConfig {
  return ProviderConfigSchema.parse(config);
}

export function isValidModality(modality: string): modality is Modality {
  return Modality.safeParse(modality).success;
}
