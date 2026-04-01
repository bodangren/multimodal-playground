export type OpenAICompatError = {
  message: string;
  type: 'invalid_request_error' | 'api_error' | 'authentication_error';
  param: string | null;
  code: null;
};

export type AuthResult = {
  allowed: boolean;
  error?: OpenAICompatError;
};

export function checkAuth(_req: Request): AuthResult {
  const vercelEnv = process.env.VERCEL_ENV;
  const isLocal = !vercelEnv || vercelEnv === 'development';

  if (isLocal) {
    return { allowed: true };
  }

  const secretKey = process.env.API_SECRET_KEY?.trim();
  if (!secretKey) {
    return {
      allowed: false,
      error: {
        message: 'Invalid or missing API key',
        type: 'authentication_error',
        param: null,
        code: null,
      },
    };
  }

  const authHeader = _req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      allowed: false,
      error: {
        message: 'Invalid or missing API key',
        type: 'authentication_error',
        param: null,
        code: null,
      },
    };
  }

  const providedKey = authHeader.slice(7);
  if (providedKey !== secretKey) {
    return {
      allowed: false,
      error: {
        message: 'Invalid or missing API key',
        type: 'authentication_error',
        param: null,
        code: null,
      },
    };
  }

  return { allowed: true };
}

export function openAiError(message: string, type: OpenAICompatError['type'] = 'invalid_request_error', param: string | null = null): OpenAICompatError {
  return {
    message,
    type,
    param,
    code: null,
  };
}
