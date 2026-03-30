import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('provider', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_TEXT_MODEL;
  });

  it('throws when the OpenRouter API key is missing', async () => {
    const { getOpenRouterProvider } = await import('./provider');

    expect(() => getOpenRouterProvider()).toThrow('OPENROUTER_API_KEY is required');
  });

  it('caches the OpenRouter provider instance', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    const { getOpenRouterProvider } = await import('./provider');

    expect(getOpenRouterProvider()).toBe(getOpenRouterProvider());
  });

  it('exposes default model and helper accessors', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.OPENROUTER_TEXT_MODEL = 'custom/model';

    const { getCompletionModel, getDefaultTextModelId, getImageModel } = await import('./provider');

    expect(getDefaultTextModelId()).toBe('custom/model');
    expect(getCompletionModel('custom/model')).toBeDefined();
    expect(getImageModel('custom/model')).toBeDefined();
  });
});
