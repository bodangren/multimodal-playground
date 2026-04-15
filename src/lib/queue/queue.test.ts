import { describe, it, expect, beforeEach } from 'vitest';
import { JobQueue } from './queue';
import { JobState } from './types';

describe('JobQueue', () => {
  let queue: JobQueue<{ prompt: string }>;

  beforeEach(() => {
    queue = new JobQueue<{ prompt: string }>();
  });

  describe('enqueue', () => {
    it('should add job to queue with queued state', () => {
      const job = queue.enqueue('job-1', { prompt: 'test prompt' });
      expect(job.id).toBe('job-1');
      expect(job.state).toBe(JobState.Queued);
      expect(job.payload.prompt).toBe('test prompt');
      expect(queue.size()).toBe(1);
    });

    it('should assign unique ids if not provided', () => {
      const job1 = queue.enqueue(undefined as unknown as string, { prompt: 'test1' });
      const job2 = queue.enqueue(undefined as unknown as string, { prompt: 'test2' });
      expect(job1.id).not.toBe(job2.id);
    });

    it('should allow custom max attempts', () => {
      const job = queue.enqueue('job-1', { prompt: 'test' }, { maxAttempts: 5 });
      expect(job.maxAttempts).toBe(5);
    });
  });

  describe('dequeue', () => {
    it('should return undefined when queue is empty', () => {
      const job = queue.dequeue();
      expect(job).toBeUndefined();
    });

    it('should return oldest queued job and mark it as running', () => {
      queue.enqueue('job-1', { prompt: 'first' });
      queue.enqueue('job-2', { prompt: 'second' });
      const job = queue.dequeue();
      expect(job?.id).toBe('job-1');
      expect(job?.state).toBe(JobState.Running);
    });

    it('should not dequeue jobs that are already running', () => {
      queue.enqueue('job-1', { prompt: 'first' });
      queue.enqueue('job-2', { prompt: 'second' });
      queue.dequeue();
      const job = queue.dequeue();
      expect(job?.id).toBe('job-2');
    });
  });

  describe('status', () => {
    it('should return zero counts for empty queue', () => {
      const status = queue.status();
      expect(status.queued).toBe(0);
      expect(status.running).toBe(0);
      expect(status.succeeded).toBe(0);
      expect(status.failed).toBe(0);
      expect(status.retrying).toBe(0);
    });

    it('should count jobs by state', () => {
      queue.enqueue('job-1', { prompt: 'first' });
      queue.enqueue('job-2', { prompt: 'second' });
      queue.enqueue('job-3', { prompt: 'third' });
      queue.dequeue();
      const status = queue.status();
      expect(status.queued).toBe(2);
      expect(status.running).toBe(1);
    });
  });

  describe('complete', () => {
    it('should mark job as succeeded', () => {
      queue.enqueue('job-1', { prompt: 'test' });
      queue.dequeue();
      const updated = queue.complete('job-1', { result: 'success' });
      expect(updated?.state).toBe(JobState.Succeeded);
      expect(updated?.result).toEqual({ result: 'success' });
    });

    it('should return undefined for non-existent job', () => {
      const updated = queue.complete('non-existent', {});
      expect(updated).toBeUndefined();
    });
  });

  describe('fail', () => {
    it('should mark job as failed with error', () => {
      queue.enqueue('job-1', { prompt: 'test' });
      queue.dequeue();
      const updated = queue.fail('job-1', 'Something went wrong');
      expect(updated?.state).toBe(JobState.Failed);
      expect(updated?.error).toBe('Something went wrong');
    });
  });

  describe('retry', () => {
    it('should re-enqueue job and increment retry count', () => {
      queue.enqueue('job-1', { prompt: 'test' });
      queue.dequeue();
      queue.fail('job-1', 'Transient error');
      const updated = queue.retry('job-1');
      expect(updated?.state).toBe(JobState.Queued);
      expect(updated?.retryCount).toBe(1);
    });

    it('should not retry beyond max attempts', () => {
      queue.enqueue('job-1', { prompt: 'test' }, { maxAttempts: 2 });
      queue.dequeue();
      queue.fail('job-1', 'Error');
      queue.retry('job-1');
      queue.dequeue();
      queue.fail('job-1', 'Error');
      const retried = queue.retry('job-1');
      expect(retried).toBeUndefined();
    });
  });

  describe('getJob', () => {
    it('should retrieve job by id', () => {
      queue.enqueue('job-1', { prompt: 'test' });
      const job = queue.getJob('job-1');
      expect(job?.id).toBe('job-1');
    });

    it('should return undefined for non-existent job', () => {
      const job = queue.getJob('non-existent');
      expect(job).toBeUndefined();
    });
  });

  describe('idempotency', () => {
    it('should not enqueue duplicate of running job with same id and payload', () => {
      queue.enqueue('job-1', { prompt: 'test' });
      queue.dequeue();
      const duplicate = queue.enqueue('job-1', { prompt: 'test' });
      expect(duplicate).toBeUndefined();
      expect(queue.size()).toBe(1);
    });

    it('should allow re-enqueue of completed job with same id (replaces old)', () => {
      queue.enqueue('job-1', { prompt: 'test' });
      queue.dequeue();
      queue.complete('job-1', { result: 'done' });
      const duplicate = queue.enqueue('job-1', { prompt: 'test' });
      expect(duplicate).toBeDefined();
      expect(queue.size()).toBe(1);
      expect(queue.getJob('job-1')?.state).toBe(JobState.Queued);
    });
  });
});