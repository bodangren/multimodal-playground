import 'server-only';

import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export const OPENROUTER_API_BASE_URL = 'https://openrouter.ai/api/v1/';
const DEFAULT_MODEL_ID = process.env.OPENROUTER_TEXT_MODEL?.trim() || 'openai/gpt-4o-mini';

let openRouterInstance: ReturnType<typeof createOpenRouter> | null = null;

export function getOpenRouterApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is required');
  }

  return apiKey;
}

export function getOpenRouterProvider() {
  if (!openRouterInstance) {
    openRouterInstance = createOpenRouter({
      apiKey: getOpenRouterApiKey(),
    });
  }

  return openRouterInstance;
}

export function getOpenRouterAuthHeaders() {
  return {
    Authorization: `Bearer ${getOpenRouterApiKey()}`,
  };
}

export function getOpenRouterApiUrl(path: string) {
  return new URL(path.replace(/^\//, ''), OPENROUTER_API_BASE_URL).toString();
}

export function getDefaultTextModelId() {
  return DEFAULT_MODEL_ID;
}

export function getTextModel(modelId = DEFAULT_MODEL_ID) {
  return getOpenRouterProvider().chat(modelId);
}

export function getCompletionModel(modelId = DEFAULT_MODEL_ID) {
  return getOpenRouterProvider().completion(modelId);
}

export function getImageModel(modelId = DEFAULT_MODEL_ID) {
  return getOpenRouterProvider().imageModel(modelId);
}
