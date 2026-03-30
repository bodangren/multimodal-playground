import { NextResponse } from 'next/server';
import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { generateTextFromPrompt } from '@/lib/generate-text';

const RequestSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required'),
  modelId: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const body = RequestSchema.parse(await request.json());
    const result = await generateTextFromPrompt(body);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? 'Invalid request body'
        : errorMessage(error, 'Unable to generate text');

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
