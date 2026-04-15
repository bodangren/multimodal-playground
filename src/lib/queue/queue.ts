import { Job, JobState, QueueStatus, createJob } from './types';

export interface QueueOptions {
  maxAttempts?: number;
}

export class JobQueue<P = unknown, R = unknown, E = string> {
  private jobs: Map<string, Job<P, R>> = new Map();
  private runningIds: Set<string> = new Set();

  enqueue(id: string | undefined, payload: P, options?: QueueOptions): Job<P, R> | undefined {
    if (id === undefined) {
      id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    const existingJob = this.jobs.get(id);
    if (existingJob && this.isActiveState(existingJob.state)) {
      const isDuplicate = existingJob.state === JobState.Running &&
        JSON.stringify(existingJob.payload) === JSON.stringify(payload);
      if (isDuplicate) {
        return undefined;
      }
    }

    const job = createJob<P, R>(id, payload, options?.maxAttempts ?? 3);
    this.jobs.set(id, job);
    return job;
  }

  dequeue(): Job<P, R> | undefined {
    for (const [id, job] of this.jobs) {
      if (job.state === JobState.Queued && !this.runningIds.has(id)) {
        job.state = JobState.Running;
        job.updatedAt = Date.now();
        this.runningIds.add(id);
        return job;
      }
    }
    return undefined;
  }

  complete(id: string, result: R): Job<P, R> | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    job.state = JobState.Succeeded;
    job.result = result;
    job.updatedAt = Date.now();
    this.runningIds.delete(id);
    return job;
  }

  fail(id: string, error: E): Job<P, R> | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    job.state = JobState.Failed;
    job.error = String(error);
    job.updatedAt = Date.now();
    this.runningIds.delete(id);
    return job;
  }

  retry(id: string): Job<P, R> | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    const maxAttempts = job.maxAttempts ?? 3;
    if ((job.retryCount ?? 0) >= maxAttempts - 1) {
      return undefined;
    }
    job.state = JobState.Queued;
    job.retryCount = (job.retryCount ?? 0) + 1;
    job.lastRetryAt = Date.now();
    job.updatedAt = Date.now();
    return job;
  }

  getJob(id: string): Job<P, R> | undefined {
    return this.jobs.get(id);
  }

  status(): QueueStatus {
    const status: QueueStatus = {
      queued: 0,
      running: 0,
      succeeded: 0,
      failed: 0,
      retrying: 0,
    };
    for (const job of this.jobs.values()) {
      switch (job.state) {
        case JobState.Queued:
          status.queued++;
          break;
        case JobState.Running:
          status.running++;
          break;
        case JobState.Succeeded:
          status.succeeded++;
          break;
        case JobState.Failed:
          status.failed++;
          break;
        case JobState.Retrying:
          status.retrying++;
          break;
      }
    }
    return status;
  }

  size(): number {
    let count = 0;
    for (const job of this.jobs.values()) {
      if (this.isActiveState(job.state)) {
        count++;
      }
    }
    return count;
  }

  private isActiveState(state: JobState): boolean {
    return state !== JobState.Succeeded && state !== JobState.Failed;
  }
}