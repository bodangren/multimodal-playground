import { describe, it, expect } from 'vitest';
import {
  JobState,
  Job,
  QueueStatus,
  isRetryableError,
  classifyError,
} from './types';

interface StatusError extends Error {
  status?: number;
}

describe('Job Types', () => {
  it('should define all job states', () => {
    expect(JobState.Queued).toBe('queued');
    expect(JobState.Running).toBe('running');
    expect(JobState.Succeeded).toBe('succeeded');
    expect(JobState.Failed).toBe('failed');
    expect(JobState.Retrying).toBe('retrying');
  });

  it('should create a job with queued state by default', () => {
    const job: Job = {
      id: 'job-1',
      state: JobState.Queued,
      createdAt: Date.now(),
      payload: { prompt: 'test' },
    };
    expect(job.state).toBe(JobState.Queued);
    expect(job.id).toBe('job-1');
    expect(job.createdAt).toBeDefined();
  });

  it('should track retry count and max attempts', () => {
    const job: Job = {
      id: 'job-1',
      state: JobState.Retrying,
      createdAt: Date.now(),
      payload: { prompt: 'test' },
      retryCount: 2,
      maxAttempts: 3,
    };
    expect(job.retryCount).toBe(2);
    expect(job.maxAttempts).toBe(3);
    expect(job.state).toBe(JobState.Retrying);
  });
});

describe('Error Classification', () => {
  it('should classify 429 as retryable', () => {
    const error: StatusError = new Error('Rate limited');
    error.status = 429;
    expect(isRetryableError(error)).toBe(true);
  });

  it('should classify 500 as retryable', () => {
    const error: StatusError = new Error('Internal server error');
    error.status = 500;
    expect(isRetryableError(error)).toBe(true);
  });

  it('should classify 400 as non-retryable', () => {
    const error: StatusError = new Error('Bad request');
    error.status = 400;
    expect(isRetryableError(error)).toBe(false);
  });

  it('should classify 401 as non-retryable', () => {
    const error: StatusError = new Error('Unauthorized');
    error.status = 401;
    expect(isRetryableError(error)).toBe(false);
  });

  it('should classify network errors as retryable', () => {
    const error = new Error('Network failure');
    expect(classifyError(error)).toBe('retryable');
  });
});

describe('Queue Status', () => {
  it('should report queue metrics', () => {
    const status: QueueStatus = {
      queued: 5,
      running: 2,
      succeeded: 10,
      failed: 1,
      retrying: 1,
    };
    expect(status.queued).toBe(5);
    expect(status.running).toBe(2);
    expect(status.succeeded).toBe(10);
    expect(status.failed).toBe(1);
    expect(status.retrying).toBe(1);
  });
});