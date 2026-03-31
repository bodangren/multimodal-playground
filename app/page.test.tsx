import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Page from './page';

describe('Page', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  it('renders all modality sections with discovered OpenRouter models', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 'openai/gpt-4o-mini',
                name: 'GPT-4o mini',
                architecture: {
                  output_modalities: ['text'],
                },
              },
              {
                id: 'black-forest-labs/flux.2-pro',
                name: 'FLUX.2 Pro',
                architecture: {
                  input_modalities: ['text', 'image'],
                  output_modalities: ['image'],
                },
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 'black-forest-labs/flux.2-pro',
                name: 'FLUX.2 Pro',
                architecture: {
                  input_modalities: ['text', 'image'],
                  output_modalities: ['image'],
                },
              },
              {
                id: 'sourceful/riverflow-v2-pro',
                name: 'Riverflow V2 Pro',
                architecture: {
                  input_modalities: ['text', 'image'],
                  output_modalities: ['image'],
                },
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 'openai/gpt-4o-audio-preview',
                name: 'GPT-4o Audio Preview',
                architecture: {
                  input_modalities: ['audio'],
                  output_modalities: ['text'],
                },
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 'openai/sora-2-pro',
                name: 'Sora 2 Pro',
                architecture: {
                  input_modalities: ['text'],
                  output_modalities: ['video'],
                },
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          }
        )
      );

    vi.stubGlobal(
      'fetch',
      fetchMock
    );

    const html = renderToStaticMarkup(await Page());

    expect(html).toContain('Text generation');
    expect(html).toContain('Structured output');
    expect(html).toContain('Image generation');
    expect(html).toContain('Transcription');
    expect(html).toContain('Video generation');
    expect(html).toContain('Generate text');
    expect(html).toContain('Generate JSON');
    expect(html).toContain('Generate image');
    expect(html).toContain('Transcribe audio');
    expect(html).toContain('Generate video');
    expect(html).toContain('GPT-4o mini (openai/gpt-4o-mini)');
    expect(html).toContain('FLUX.2 Pro (black-forest-labs/flux.2-pro)');
    expect(html).toContain('Riverflow V2 Pro (sourceful/riverflow-v2-pro)');
    expect(html).toContain('GPT-4o Audio Preview (openai/gpt-4o-audio-preview)');
    expect(html).toContain('Sora 2 Pro (openai/sora-2-pro)');
  });
});
