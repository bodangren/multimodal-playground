import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('openai-compat auth', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.VERCEL_ENV;
    delete process.env.API_SECRET_KEY;
  });

  it('allows all requests when running locally (no VERCEL_ENV)', async () => {
    const { checkAuth } = await import('./auth');
    const req = new Request('http://localhost:3030/v1/chat/completions');
    const result = checkAuth(req);
    expect(result.allowed).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('allows all requests when VERCEL_ENV is development', async () => {
    process.env.VERCEL_ENV = 'development';
    const { checkAuth } = await import('./auth');
    const req = new Request('http://localhost:3030/v1/chat/completions');
    const result = checkAuth(req);
    expect(result.allowed).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects request when VERCEL_ENV is production and no auth header', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.API_SECRET_KEY = 'test-secret';
    const { checkAuth } = await import('./auth');
    const req = new Request('http://localhost:3030/v1/chat/completions');
    const result = checkAuth(req);
    expect(result.allowed).toBe(false);
    expect(result.error).toEqual({
      message: 'Invalid or missing API key',
      type: 'authentication_error',
      param: null,
      code: null,
    });
  });

  it('rejects request when VERCEL_ENV is production and wrong key', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.API_SECRET_KEY = 'test-secret';
    const { checkAuth } = await import('./auth');
    const req = new Request('http://localhost:3030/v1/chat/completions', {
      headers: { Authorization: 'Bearer wrong-key' },
    });
    const result = checkAuth(req);
    expect(result.allowed).toBe(false);
    expect(result.error).toEqual({
      message: 'Invalid or missing API key',
      type: 'authentication_error',
      param: null,
      code: null,
    });
  });

  it('allows request when VERCEL_ENV is production and key matches', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.API_SECRET_KEY = 'test-secret';
    const { checkAuth } = await import('./auth');
    const req = new Request('http://localhost:3030/v1/chat/completions', {
      headers: { Authorization: 'Bearer test-secret' },
    });
    const result = checkAuth(req);
    expect(result.allowed).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects when VERCEL_ENV is production but API_SECRET_KEY is not set', async () => {
    process.env.VERCEL_ENV = 'production';
    delete process.env.API_SECRET_KEY;
    const { checkAuth } = await import('./auth');
    const req = new Request('http://localhost:3030/v1/chat/completions');
    const result = checkAuth(req);
    expect(result.allowed).toBe(false);
    expect(result.error).toEqual({
      message: 'Invalid or missing API key',
      type: 'authentication_error',
      param: null,
      code: null,
    });
  });
});
