import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateTextMock = vi.fn();

vi.mock('ai', () => ({
  generateText: generateTextMock,
}));

describe('generateTextFromPrompt', () => {
  beforeEach(() => {
    vi.resetModules();
    generateTextMock.mockReset();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('returns normalized text generation output', async () => {
    generateTextMock.mockResolvedValue({
      text: 'Hello from the model.',
      response: {
        id: 'response-1',
        modelId: 'openai/gpt-4o-mini',
      },
      providerMetadata: { openrouter: { id: 'provider-1' } },
    });

    const { generateTextFromPrompt } = await import('./generate-text');
    const result = await generateTextFromPrompt({ prompt: 'Say hello' });

    expect(result).toEqual({
      text: 'Hello from the model.',
      modelId: 'openai/gpt-4o-mini',
      responseId: 'response-1',
      providerMetadata: { openrouter: { id: 'provider-1' } },
    });
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it('rejects empty prompts before the provider is called', async () => {
    const { generateTextFromPrompt } = await import('./generate-text');

    await expect(generateTextFromPrompt({ prompt: '   ' })).rejects.toThrow('Prompt is required');
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it('normalizes provider failures', async () => {
    generateTextMock.mockRejectedValue(new Error('upstream blew up'));

    const { generateTextFromPrompt } = await import('./generate-text');

    await expect(generateTextFromPrompt({ prompt: 'Say hello' })).rejects.toThrow('upstream blew up');
  });

  it('logs provider warnings when the model returns them', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    generateTextMock.mockResolvedValue({
      text: 'Hello from the model.',
      warnings: [{ message: 'temperature was adjusted' }],
      response: {
        id: 'response-3',
        modelId: 'openai/gpt-4o-mini',
      },
      providerMetadata: {},
    });

    const { generateTextFromPrompt } = await import('./generate-text');
    await generateTextFromPrompt({ prompt: 'Say hello' });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });
});
