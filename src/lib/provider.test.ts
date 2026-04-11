import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('provider', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_TEXT_MODEL;
    delete process.env.OPENROUTER_SPEECH_MODEL;
    delete process.env.OPENROUTER_TRANSCRIPTION_MODEL;
    delete process.env.OPENROUTER_VIDEO_MODEL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_SPEECH_MODEL;
    delete process.env.OPENAI_TRANSCRIPTION_MODEL;
  });

  it('throws when the OpenRouter API key is missing', async () => {
    const { getOpenRouterProvider } = await import('./provider');

    expect(() => getOpenRouterProvider()).toThrow('OPENROUTER_API_KEY is required');
  });

  it('falls back to OPENROUTER_API_KEY when OPENAI_API_KEY is not set', async () => {
    process.env.OPENROUTER_API_KEY = 'router-key';
    delete process.env.OPENAI_API_KEY;
    const { getOpenAIApiKey } = await import('./provider');

    expect(getOpenAIApiKey()).toBe('router-key');
  });

  it('prefers explicit OPENAI_API_KEY over fallback', async () => {
    process.env.OPENROUTER_API_KEY = 'router-key';
    process.env.OPENAI_API_KEY = 'explicit-ai-key';
    const { getOpenAIApiKey } = await import('./provider');

    expect(getOpenAIApiKey()).toBe('explicit-ai-key');
  });

  it('caches the OpenRouter provider instance', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    const { getOpenRouterProvider } = await import('./provider');

    expect(getOpenRouterProvider()).toBe(getOpenRouterProvider());
  });

  it('exposes default model and helper accessors', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.OPENROUTER_TEXT_MODEL = 'custom/model';
    process.env.OPENAI_API_KEY = 'openai-key';

    const {
      getCompletionModel,
      getDefaultTextModelId,
      getDefaultSpeechModelId,
      getDefaultTranscriptionModelId,
      getDefaultVideoModelId,
      getImageModel,
      getSpeechModel,
      getTranscriptionModel,
      getOpenRouterApiUrl,
      getOpenRouterAuthHeaders,
    } = await import('./provider');

    expect(getDefaultTextModelId()).toBe('custom/model');
    expect(getDefaultSpeechModelId()).toBe('openai/gpt-audio-mini');
    expect(getDefaultTranscriptionModelId()).toBe('openrouter/free');
    expect(getDefaultVideoModelId()).toBe('alibaba/wan-2.6');
    expect(getCompletionModel('custom/model')).toBeDefined();
    expect(getImageModel('custom/model')).toBeDefined();
    expect(getSpeechModel('gpt-4o-mini-tts')).toBeDefined();
    expect(getTranscriptionModel('gpt-4o-mini-transcribe')).toBeDefined();
    expect(getOpenRouterAuthHeaders()).toEqual({ Authorization: 'Bearer test-key' });
    expect(getOpenRouterApiUrl('/models')).toBe('https://openrouter.ai/api/v1/models');
  });
});
