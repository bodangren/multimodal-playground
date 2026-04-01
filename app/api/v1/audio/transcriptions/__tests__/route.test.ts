import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('POST /api/v1/audio/transcriptions', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.VERCEL_ENV;
    delete process.env.API_SECRET_KEY;
  });

  it('returns transcription result when auth passes (local)', async () => {
    vi.doMock('@/lib/openai-compat/audio', () => ({
      executeTranscription: vi.fn().mockResolvedValue({ text: JSON.stringify({ text: 'Hello world' }), contentType: 'application/json' }),
      OpenAITranscriptionRequestSchema: {
        parse: vi.fn().mockReturnValue({}),
      },
    }));

    const { POST } = await import('../route');
    const formData = new FormData();
    formData.append('file', new File(['fake-audio'], 'audio.mp3', { type: 'audio/mpeg' }));

    const req = new Request('http://localhost:3030/api/v1/audio/transcriptions', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ text: 'Hello world' });

    vi.doUnmock('@/lib/openai-compat/audio');
  });

  it('returns 401 when auth fails in production', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.API_SECRET_KEY = 'test-secret';

    const { POST } = await import('../route');
    const formData = new FormData();
    formData.append('file', new File(['fake-audio'], 'audio.mp3', { type: 'audio/mpeg' }));

    const req = new Request('http://localhost:3030/api/v1/audio/transcriptions', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 when no file is provided', async () => {
    const { POST } = await import('../route');
    const formData = new FormData();

    const req = new Request('http://localhost:3030/api/v1/audio/transcriptions', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.param).toBe('file');
  });

  it('returns 500 when transcription fails', async () => {
    vi.doMock('@/lib/openai-compat/audio', () => ({
      executeTranscription: vi.fn().mockRejectedValue(new Error('Transcription failed')),
      OpenAITranscriptionRequestSchema: {
        parse: vi.fn().mockReturnValue({}),
      },
    }));

    const { POST } = await import('../route');
    const formData = new FormData();
    formData.append('file', new File(['fake-audio'], 'audio.mp3', { type: 'audio/mpeg' }));

    const req = new Request('http://localhost:3030/api/v1/audio/transcriptions', {
      method: 'POST',
      body: formData,
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.message).toBe('Transcription failed');

    vi.doUnmock('@/lib/openai-compat/audio');
  });
});
