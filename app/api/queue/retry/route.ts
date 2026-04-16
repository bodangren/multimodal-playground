import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generationQueue } from '@/lib/queue';

const RetrySchema = z.object({
  id: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = RetrySchema.parse(await request.json());
    const job = generationQueue.retry(body.id);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found or retry limit exceeded' },
        { status: 409 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? 'Invalid request body'
        : 'Unable to retry job';

    return NextResponse.json({ error: message }, { status: 400 });
  }
}