if (typeof process !== 'undefined' && process.env.NEXT_RUNTIME) {
  await import('server-only');
}

import { createOpenAI } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export const OPENROUTER_API_BASE_URL = 'https://openrouter.ai/api/v1/';

const DEFAULT_TEXT_MODEL_ID = process.env.OPENROUTER_TEXT_MODEL?.trim() || 'openrouter/free';
const DEFAULT_SPEECH_MODEL_ID = process.env.OPENROUTER_SPEECH_MODEL?.trim() || 'openai/gpt-audio-mini';
const DEFAULT_TRANSCRIPTION_MODEL_ID =
  process.env.OPENROUTER_TRANSCRIPTION_MODEL?.trim() || 'openrouter/free';
const DEFAULT_VIDEO_MODEL_ID = process.env.OPENROUTER_VIDEO_MODEL?.trim() || 'alibaba/wan-2.6';

let openRouterInstance: ReturnType<typeof createOpenRouter> | null = null;
let openAIInstance: ReturnType<typeof createOpenAI> | null = null;

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

export function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }

  return apiKey;
}

export function getOpenAIProvider() {
  if (!openAIInstance) {
    openAIInstance = createOpenAI({
      apiKey: getOpenAIApiKey(),
    });
  }

  return openAIInstance;
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
  return DEFAULT_TEXT_MODEL_ID;
}

export function getDefaultSpeechModelId() {
  return DEFAULT_SPEECH_MODEL_ID;
}

export function getDefaultTranscriptionModelId() {
  return DEFAULT_TRANSCRIPTION_MODEL_ID;
}

export function getDefaultVideoModelId() {
  return DEFAULT_VIDEO_MODEL_ID;
}

export function getTextModel(modelId = DEFAULT_TEXT_MODEL_ID) {
  return getOpenRouterProvider().chat(modelId);
}

export function getCompletionModel(modelId = DEFAULT_TEXT_MODEL_ID) {
  return getOpenRouterProvider().completion(modelId);
}

export function getImageModel(modelId: string) {
  return getOpenRouterProvider().imageModel(modelId);
}

export function getSpeechModel(modelId = DEFAULT_SPEECH_MODEL_ID) {
  return getOpenAIProvider().speech(modelId);
}

export function getTranscriptionModel(modelId = DEFAULT_TRANSCRIPTION_MODEL_ID) {
  return getOpenAIProvider().transcription(modelId);
}
