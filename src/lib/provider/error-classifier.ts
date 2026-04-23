export enum ErrorClassification {
  Retryable = 'retryable',
  RateLimited = 'rate-limited',
  Terminal = 'terminal',
  Unknown = 'unknown',
}

export interface ProviderError {
  status?: number;
  message: string;
  retryAfterMs?: number;
}

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

const RETRYABLE_ERROR_PATTERNS = [
  'timeout',
  'econnreset',
  'enotfound',
  'econnrefused',
  'network',
  'socket',
  'fetch',
];

const TERMINAL_STATUS_CODES = new Set([400, 401, 403, 404, 422]);

const TERMINAL_ERROR_PATTERNS = ['invalid api key', 'unauthorized', 'forbidden', 'bad request', 'not found'];

export class ProviderErrorClassifier {
  classify(error: ProviderError): ErrorClassification {
    if (typeof error.status === 'number') {
      if (error.status === 429) {
        return ErrorClassification.RateLimited;
      }
      if (RETRYABLE_STATUS_CODES.has(error.status)) {
        return ErrorClassification.Retryable;
      }
      if (TERMINAL_STATUS_CODES.has(error.status)) {
        return ErrorClassification.Terminal;
      }
    }

    const lowerMsg = error.message.toLowerCase();
    if (TERMINAL_ERROR_PATTERNS.some((p) => lowerMsg.includes(p))) {
      return ErrorClassification.Terminal;
    }

    if (RETRYABLE_ERROR_PATTERNS.some((p) => lowerMsg.includes(p))) {
      return ErrorClassification.Retryable;
    }

    return ErrorClassification.Unknown;
  }

  isRetryable(error: ProviderError): boolean {
    const classification = this.classify(error);
    if (classification === ErrorClassification.Retryable) {
      return true;
    }
    if (classification === ErrorClassification.RateLimited) {
      return error.retryAfterMs !== undefined;
    }
    return false;
  }

  getRetryAfterMs(error: ProviderError): number {
    if (error.status === 429) {
      return error.retryAfterMs ?? 1000;
    }
    return 0;
  }
}
