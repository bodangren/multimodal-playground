import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('POST /api/v1/video/generations', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.VERCEL_ENV;
    delete process.env.API_SECRET_KEY;
  });

  it('returns video generation result when auth passes (local)', async () => {
    const mockResponse = {
      created: 1234567890,
      data: [{ b64_json: 'abc123', revised_prompt: 'A cat' }],
    };

    vi.doMock('@/lib/openai-compat/video', () => ({
      executeVideoGeneration: vi.fn().mockResolvedValue(mockResponse),
      OpenAIVideoRequestSchema: {
        parse: vi.fn().mockReturnValue({ prompt: 'A cat' }),
      },
    }));

    const { POST } = await import('../route');
    const req = new Request('http://localhost:3030/api/v1/video/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'A cat' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(mockResponse);

    vi.doUnmock('@/lib/openai-compat/video');
  });

  it('returns 401 when auth fails in production', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.API_SECRET_KEY = 'test-secret';

    const { POST } = await import('../route');
    const req = new Request('http://localhost:3030/api/v1/video/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'A cat' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 for missing prompt', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost:3030/api/v1/video/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.type).toBe('invalid_request_error');
  });

  it('returns 500 when video generation fails', async () => {
    vi.doMock('@/lib/openai-compat/video', () => ({
      executeVideoGeneration: vi.fn().mockRejectedValue(new Error('Provider error')),
      OpenAIVideoRequestSchema: {
        parse: vi.fn().mockReturnValue({ prompt: 'A cat' }),
      },
    }));

    const { POST } = await import('../route');
    const req = new Request('http://localhost:3030/api/v1/video/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'A cat' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.message).toBe('Provider error');

    vi.doUnmock('@/lib/openai-compat/video');
  });
});
