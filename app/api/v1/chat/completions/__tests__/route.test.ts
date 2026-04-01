import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('POST /api/v1/chat/completions', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.VERCEL_ENV;
    delete process.env.API_SECRET_KEY;
  });

  it('returns chat completion when auth passes (local)', async () => {
    const mockResponse = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: 1234567890,
      model: 'openai/gpt-4o',
      choices: [{ index: 0, message: { role: 'assistant', content: 'Hello' }, finish_reason: 'stop' }],
    };

    vi.doMock('@/lib/openai-compat/chat', () => ({
      executeChatCompletion: vi.fn().mockResolvedValue(mockResponse),
    }));

    const { POST } = await import('../route');
    const req = new Request('http://localhost:3030/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(mockResponse);

    vi.doUnmock('@/lib/openai-compat/chat');
  });

  it('returns 401 when auth fails in production', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.API_SECRET_KEY = 'test-secret';

    const { POST } = await import('../route');
    const req = new Request('http://localhost:3030/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.type).toBe('authentication_error');
  });

  it('returns 400 for invalid request body', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost:3030/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.type).toBe('invalid_request_error');
  });

  it('returns 501 when streaming is requested', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost:3030/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }], stream: true }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(501);
    expect(body.error.message).toBe('Streaming is not yet supported');
  });

  it('returns 500 when chat completion fails', async () => {
    vi.doMock('@/lib/openai-compat/chat', () => ({
      executeChatCompletion: vi.fn().mockRejectedValue(new Error('Provider error')),
    }));

    const { POST } = await import('../route');
    const req = new Request('http://localhost:3030/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.message).toBe('Provider error');

    vi.doUnmock('@/lib/openai-compat/chat');
  });
});
