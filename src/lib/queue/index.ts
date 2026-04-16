import { JobQueue } from './queue';
import { JobState } from './types';

export interface GenerationJob {
  type: 'text' | 'image' | 'speech' | 'video' | 'structured' | 'transcription';
  payload: Record<string, unknown>;
}

export interface GenerationResult {
  text?: string;
  image?: string;
  audioUrl?: string;
  videoUrl?: string;
  structured?: Record<string, unknown>;
  transcription?: string;
  modelId?: string;
  responseId?: string;
}

const generationQueue = new JobQueue<GenerationJob, GenerationResult, string>();

export { generationQueue, JobState };