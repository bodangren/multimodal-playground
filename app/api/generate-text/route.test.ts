import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateTextFromPromptMock = vi.fn();

vi.mock('@/lib/generate-text', () => ({
  generateTextFromPrompt: generateTextFromPromptMock,
}));

describe('POST /api/generate-text', () => {
  beforeEach(() => {
    vi.resetModules();
    generateTextFromPromptMock.mockReset();
  });

  it('returns normalized text on success', async () => {
    generateTextFromPromptMock.mockResolvedValue({
      text: 'Hello world',
      modelId: 'openai/gpt-4o-mini',
      responseId: 'response-1',
      providerMetadata: {},
    });

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/generate-text', {
        method: 'POST',
        body: JSON.stringify({ prompt: 'Say hello' }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      text: 'Hello world',
      modelId: 'openai/gpt-4o-mini',
      responseId: 'response-1',
      providerMetadata: {},
    });
  });

  it('returns a normalized error on invalid input', async () => {
    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/generate-text', {
        method: 'POST',
        body: JSON.stringify({ prompt: '   ' }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Prompt is required' });
  });
});
