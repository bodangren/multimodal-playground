import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('GET /api/v1/models', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.VERCEL_ENV;
    delete process.env.API_SECRET_KEY;
  });

  it('returns models list when auth passes (local)', async () => {
    const mockModels = {
      object: 'list',
      data: [
        { id: 'openai/gpt-4o', object: 'model', created: 1234567890, owned_by: 'openrouter' },
      ],
    };

    vi.doMock('@/lib/openai-compat/models', () => ({
      listOpenAICompatModels: vi.fn().mockResolvedValue(mockModels),
    }));

    const { GET } = await import('../route');
    const req = new Request('http://localhost:3030/api/v1/models');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(mockModels);

    vi.doUnmock('@/lib/openai-compat/models');
  });

  it('returns 401 when auth fails in production', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.API_SECRET_KEY = 'test-secret';

    const { GET } = await import('../route');
    const req = new Request('http://localhost:3030/api/v1/models');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toEqual({
      message: 'Invalid or missing API key',
      type: 'authentication_error',
      param: null,
      code: null,
    });
  });

  it('returns 500 when model listing fails', async () => {
    vi.doMock('@/lib/openai-compat/models', () => ({
      listOpenAICompatModels: vi.fn().mockRejectedValue(new Error('OpenRouter is down')),
    }));

    const { GET } = await import('../route');
    const req = new Request('http://localhost:3030/api/v1/models');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.message).toBe('OpenRouter is down');
    expect(body.error.type).toBe('api_error');

    vi.doUnmock('@/lib/openai-compat/models');
  });
});
