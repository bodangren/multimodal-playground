import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generationQueue, GenerationJob } from '@/lib/queue';

const EnqueueSchema = z.object({
  id: z.string().optional(),
  job: z.object({
    type: z.enum(['text', 'image', 'speech', 'video', 'structured', 'transcription']),
    payload: z.record(z.string(), z.unknown()),
  }),
  maxAttempts: z.number().int().positive().optional(),
});

export async function POST(request: Request) {
  try {
    const body = EnqueueSchema.parse(await request.json());
    const job = generationQueue.enqueue(body.id, body.job as GenerationJob, { maxAttempts: body.maxAttempts });

    if (!job) {
      return NextResponse.json(
        { error: 'Job already exists and is active' },
        { status: 409 }
      );
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? 'Invalid request body'
        : 'Unable to enqueue job';

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  const status = generationQueue.status();
  return NextResponse.json(status);
}