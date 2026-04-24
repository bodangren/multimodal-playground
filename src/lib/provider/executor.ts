import { loadProviderConfigFromEnv, type Modality, type ProviderConfig } from './config';
import { loadCostConfigFromEnv, type CostConfig } from './cost-config';
import { FallbackChain, type ChainOptions, type FallbackMetrics } from './fallback-chain';
import { ProviderCircuitBreakerManager, FileCircuitBreakerPersistence } from './circuit-breaker-manager';
import { type ProviderError } from './error-classifier';
import { getTextModel, getDefaultTextModelId, getOpenAIProvider } from '@/lib/provider';

interface GenerationRequest {
  prompt: string;
  system?: string;
}

interface GenerationResult {
  text: string;
  modelId: string;
  responseId: string;
  providerMetadata?: Record<string, unknown>;
}

function createMockLogger() {
  return {
    info: (message: string, meta?: Record<string, unknown>) => {
      console.info(`[ProviderExecutor] ${message}`, meta ?? {});
    },
    error: (message: string, meta?: Record<string, unknown>) => {
      console.error(`[ProviderExecutor] ${message}`, meta ?? {});
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      console.warn(`[ProviderExecutor] ${message}`, meta ?? {});
    },
  };
}

export class ProviderExecutor {
  private cbManager: ProviderCircuitBreakerManager;
  private config: ProviderConfig;
  private chains: Map<Modality, FallbackChain<GenerationRequest, GenerationResult>>;
  private circuitBreakerCache: Map<string, () => boolean>;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.cbManager = new ProviderCircuitBreakerManager(new FileCircuitBreakerPersistence());
    this.chains = new Map();
    this.circuitBreakerCache = new Map();
  }

  private createOpenRouterExecutor(modelId: string) {
    return async (request: GenerationRequest): Promise<GenerationResult> => {
      const { generateText } = await import('ai');
      const model = getTextModel(modelId);
      const result = await generateText({
        model,
        system: request.system,
        prompt: request.prompt,
      });
      return {
        text: result.text,
        modelId: result.response.modelId ?? modelId,
        responseId: result.response.id ?? `gen-${Date.now()}`,
        providerMetadata: result.providerMetadata ?? {},
      };
    };
  }

  private createOpenAIExecutor(modelId: string) {
    return async (request: GenerationRequest): Promise<GenerationResult> => {
      const { generateText } = await import('ai');
      const provider = getOpenAIProvider();
      const model = provider.chat(modelId);
      const result = await generateText({
        model,
        system: request.system,
        prompt: request.prompt,
      });
      return {
        text: result.text,
        modelId: result.response.modelId ?? modelId,
        responseId: result.response.id ?? `gen-${Date.now()}`,
        providerMetadata: result.providerMetadata ?? {},
      };
    };
  }

  async executeForModality(modality: Modality, request: GenerationRequest): Promise<GenerationResult> {
    let chain = this.chains.get(modality);
    if (!chain) {
      chain = await this.createChainForModality(modality);
      this.chains.set(modality, chain);
    }
    return chain.execute(request);
  }

  private async createChainForModality(modality: Modality): Promise<FallbackChain<GenerationRequest, GenerationResult>> {
    const priority = this.config.priority[modality];
    const chainOptions: ChainOptions = {
      maxAttempts: this.config.fallback.maxAttempts,
      baseDelayMs: this.config.fallback.baseDelayMs,
      maxDelayMs: this.config.fallback.maxDelayMs,
      logger: createMockLogger(),
    };

    const providers = await Promise.all(
      priority.map((providerId) => this.createProviderConfig(providerId, modality))
    );
    return new FallbackChain(providers, chainOptions);
  }

  private async createProviderConfig(providerId: string, _modality: Modality) {
    let circuitBreakerFn = this.circuitBreakerCache.get(providerId);
    if (!circuitBreakerFn) {
      const cb = await this.cbManager.getCircuitBreaker(providerId);
      circuitBreakerFn = () => !cb.isAllowed();
      this.circuitBreakerCache.set(providerId, circuitBreakerFn);
    }

    const recordSuccess = async () => {
      await this.cbManager.recordProviderSuccess(providerId);
    };

    const recordFailure = async (_error: ProviderError) => {
      await this.cbManager.recordProviderFailure(providerId);
    };

    let executor: (request: GenerationRequest) => Promise<GenerationResult>;
    let modelId: string;

    switch (providerId) {
      case 'openrouter':
        modelId = getDefaultTextModelId();
        executor = this.createOpenRouterExecutor(modelId);
        break;
      case 'openai':
        modelId = 'gpt-4o-mini';
        executor = this.createOpenAIExecutor(modelId);
        break;
      case 'anthropic':
        modelId = 'claude-sonnet-4-20250514';
        executor = this.createOpenAIExecutor(modelId);
        break;
      default:
        modelId = getDefaultTextModelId();
        executor = this.createOpenRouterExecutor(modelId);
    }

    return {
      id: providerId,
      execute: executor,
      isCircuitOpen: circuitBreakerFn,
      recordSuccess,
      recordFailure,
    };
  }

  getMetrics(providerId: string): FallbackMetrics | undefined {
    for (const chain of this.chains.values()) {
      const metrics = chain.getMetrics(providerId);
      if (metrics) return metrics;
    }
    return undefined;
  }

  getAllMetrics(): Map<string, FallbackMetrics> {
    const result = new Map<string, FallbackMetrics>();
    for (const chain of this.chains.values()) {
      const providerIds = ['openrouter', 'openai', 'anthropic'];
      for (const id of providerIds) {
        const metrics = chain.getMetrics(id);
        if (metrics) {
          result.set(id, metrics);
        }
      }
    }
    return result;
  }

  async getProviderHealth(providerId: string) {
    return this.cbManager.getProviderState(providerId);
  }
}

let globalExecutor: ProviderExecutor | null = null;

export function getProviderExecutor(): ProviderExecutor {
  if (!globalExecutor) {
    const config = loadProviderConfigFromEnv();
    globalExecutor = new ProviderExecutor(config);
  }
  return globalExecutor;
}

export async function executeWithFailover(
  modality: Modality,
  request: GenerationRequest
): Promise<GenerationResult> {
  const executor = getProviderExecutor();
  return executor.executeForModality(modality, request);
}

export async function getFailoverMetrics(): Promise<Record<string, FallbackMetrics>> {
  const executor = getProviderExecutor();
  const metrics = executor.getAllMetrics();
  const result: Record<string, FallbackMetrics> = {};
  for (const [key, value] of metrics.entries()) {
    result[key] = value;
  }
  return result;
}