export enum JobState {
  Queued = 'queued',
  Running = 'running',
  Succeeded = 'succeeded',
  Failed = 'failed',
  Retrying = 'retrying',
}

export interface Job<P = unknown, E = unknown> {
  id: string;
  state: JobState;
  createdAt: number;
  updatedAt?: number;
  payload: P;
  result?: E;
  error?: string;
  retryCount?: number;
  maxAttempts?: number;
  lastRetryAt?: number;
}

export interface QueueStatus {
  queued: number;
  running: number;
  succeeded: number;
  failed: number;
  retrying: number;
}

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

interface StatusError extends Error {
  status?: number;
}

export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const statusError = error as StatusError;
  const status = statusError.status;
  if (typeof status === 'number') {
    return RETRYABLE_STATUS_CODES.has(status);
  }
  const lowerMsg = error.message.toLowerCase();
  if (lowerMsg.includes('network') || lowerMsg.includes('timeout') || lowerMsg.includes('econn')) {
    return true;
  }
  return false;
}

export function classifyError(error: unknown): 'retryable' | 'terminal' {
  return isRetryableError(error) ? 'retryable' : 'terminal';
}

export function createJob<P, R = unknown>(id: string, payload: P, maxAttempts = 3): Job<P, R> {
  return {
    id,
    state: JobState.Queued,
    createdAt: Date.now(),
    payload,
    retryCount: 0,
    maxAttempts,
  };
}