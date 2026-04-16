import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generationQueue, GenerationResult } from '@/lib/queue';

const CompleteSchema = z.object({
  id: z.string(),
  result: z.unknown().optional(),
  error: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = CompleteSchema.parse(await request.json());

    if (body.error) {
      const job = generationQueue.fail(body.id, body.error);
      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      return NextResponse.json(job);
    }

    if (body.result !== undefined) {
      const job = generationQueue.complete(body.id, body.result as GenerationResult);
      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      return NextResponse.json(job);
    }

    return NextResponse.json(
      { error: 'Either result or error must be provided' },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? 'Invalid request body'
        : 'Unable to complete job';

    return NextResponse.json({ error: message }, { status: 400 });
  }
}