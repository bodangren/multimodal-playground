import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('POST /api/v1/audio/speech', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.VERCEL_ENV;
    delete process.env.API_SECRET_KEY;
  });

  it('returns audio bytes when auth passes (local)', async () => {
    const mockAudio = Buffer.from('fake-mp3-data');

    vi.doMock('@/lib/openai-compat/audio', () => ({
      executeSpeechGeneration: vi.fn().mockResolvedValue({ audioBuffer: mockAudio, contentType: 'audio/mpeg' }),
      OpenAISpeechRequestSchema: {
        parse: vi.fn().mockReturnValue({ input: 'Hello', response_format: 'mp3', speed: 1.0 }),
      },
    }));

    const { POST } = await import('../route');
    const req = new Request('http://localhost:3030/api/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'Hello' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg');

    vi.doUnmock('@/lib/openai-compat/audio');
  });

  it('returns 401 when auth fails in production', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.API_SECRET_KEY = 'test-secret';

    const { POST } = await import('../route');
    const req = new Request('http://localhost:3030/api/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'Hello' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 for missing input', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost:3030/api/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.type).toBe('invalid_request_error');
  });

  it('returns 500 when speech generation fails', async () => {
    vi.doMock('@/lib/openai-compat/audio', () => ({
      executeSpeechGeneration: vi.fn().mockRejectedValue(new Error('Provider error')),
      OpenAISpeechRequestSchema: {
        parse: vi.fn().mockReturnValue({ input: 'Hello', response_format: 'mp3', speed: 1.0 }),
      },
    }));

    const { POST } = await import('../route');
    const req = new Request('http://localhost:3030/api/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'Hello' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.message).toBe('Provider error');

    vi.doUnmock('@/lib/openai-compat/audio');
  });
});
