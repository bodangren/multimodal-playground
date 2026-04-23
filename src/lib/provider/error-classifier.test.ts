import { describe, it, expect } from 'vitest';
import { ProviderErrorClassifier, ErrorClassification, type ProviderError } from './error-classifier';

describe('ProviderErrorClassifier', () => {
  let classifier: ProviderErrorClassifier;

  beforeEach(() => {
    classifier = new ProviderErrorClassifier();
  });

  describe('retryable errors', () => {
    it('should classify 429 as rate-limited', () => {
      const error: ProviderError = { status: 429, message: 'Rate limit exceeded' };
      expect(classifier.classify(error)).toBe(ErrorClassification.RateLimited);
    });

    it('should classify 503 as retryable', () => {
      const error: ProviderError = { status: 503, message: 'Service unavailable' };
      expect(classifier.classify(error)).toBe(ErrorClassification.Retryable);
    });

    it('should classify 500 as retryable', () => {
      const error: ProviderError = { status: 500, message: 'Internal server error' };
      expect(classifier.classify(error)).toBe(ErrorClassification.Retryable);
    });

    it('should classify 502 as retryable', () => {
      const error: ProviderError = { status: 502, message: 'Bad gateway' };
      expect(classifier.classify(error)).toBe(ErrorClassification.Retryable);
    });

    it('should classify 504 as retryable', () => {
      const error: ProviderError = { status: 504, message: 'Gateway timeout' };
      expect(classifier.classify(error)).toBe(ErrorClassification.Retryable);
    });

    it('should classify network timeout as retryable', () => {
      const error: ProviderError = { message: 'ECONNRESET', status: undefined };
      expect(classifier.classify(error)).toBe(ErrorClassification.Retryable);
    });

    it('should classify ENOTFOUND as retryable', () => {
      const error: ProviderError = { message: 'ENOTFOUND', status: undefined };
      expect(classifier.classify(error)).toBe(ErrorClassification.Retryable);
    });

    it('should classify connection refused as retryable', () => {
      const error: ProviderError = { message: 'ECONNREFUSED', status: undefined };
      expect(classifier.classify(error)).toBe(ErrorClassification.Retryable);
    });
  });

  describe('rate-limited errors', () => {
    it('should classify 429 with Retry-After header as rate-limited', () => {
      const error: ProviderError = { status: 429, message: 'Rate limit exceeded', retryAfterMs: 5000 };
      expect(classifier.classify(error)).toBe(ErrorClassification.RateLimited);
    });
  });

  describe('terminal errors', () => {
    it('should classify 400 as terminal', () => {
      const error: ProviderError = { status: 400, message: 'Bad request' };
      expect(classifier.classify(error)).toBe(ErrorClassification.Terminal);
    });

    it('should classify 401 as terminal', () => {
      const error: ProviderError = { status: 401, message: 'Unauthorized' };
      expect(classifier.classify(error)).toBe(ErrorClassification.Terminal);
    });

    it('should classify 403 as terminal', () => {
      const error: ProviderError = { status: 403, message: 'Forbidden' };
      expect(classifier.classify(error)).toBe(ErrorClassification.Terminal);
    });

    it('should classify 404 as terminal', () => {
      const error: ProviderError = { status: 404, message: 'Not found' };
      expect(classifier.classify(error)).toBe(ErrorClassification.Terminal);
    });

    it('should classify 422 as terminal', () => {
      const error: ProviderError = { status: 422, message: 'Unprocessable entity' };
      expect(classifier.classify(error)).toBe(ErrorClassification.Terminal);
    });

    it('should classify invalid API key as terminal', () => {
      const error: ProviderError = { message: 'Invalid API key', status: 401 };
      expect(classifier.classify(error)).toBe(ErrorClassification.Terminal);
    });
  });

  describe('unknown errors', () => {
    it('should classify errors without status as unknown', () => {
      const error: ProviderError = { message: 'Something went wrong', status: undefined };
      expect(classifier.classify(error)).toBe(ErrorClassification.Unknown);
    });
  });

  describe('isRetryable', () => {
    it('should return true for retryable errors', () => {
      const error: ProviderError = { status: 503, message: 'Service unavailable' };
      expect(classifier.isRetryable(error)).toBe(true);
    });

    it('should return false for terminal errors', () => {
      const error: ProviderError = { status: 401, message: 'Unauthorized' };
      expect(classifier.isRetryable(error)).toBe(false);
    });

    it('should return false for rate-limited errors when no retry-after', () => {
      const error: ProviderError = { status: 429, message: 'Rate limit' };
      expect(classifier.isRetryable(error)).toBe(false);
    });

    it('should return true for rate-limited errors when retry-after is provided', () => {
      const error: ProviderError = { status: 429, message: 'Rate limit', retryAfterMs: 5000 };
      expect(classifier.isRetryable(error)).toBe(true);
    });
  });

  describe('getRetryAfterMs', () => {
    it('should return configured retry-after value', () => {
      const error: ProviderError = { status: 429, message: 'Rate limit', retryAfterMs: 5000 };
      expect(classifier.getRetryAfterMs(error)).toBe(5000);
    });

    it('should return default retry-after for 429 without header', () => {
      const error: ProviderError = { status: 429, message: 'Rate limit' };
      expect(classifier.getRetryAfterMs(error)).toBe(1000);
    });

    it('should return 0 for non-rate-limited errors', () => {
      const error: ProviderError = { status: 500, message: 'Error' };
      expect(classifier.getRetryAfterMs(error)).toBe(0);
    });
  });
});
