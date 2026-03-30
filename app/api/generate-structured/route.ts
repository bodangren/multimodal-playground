import { NextResponse } from 'next/server';
import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { generateStructuredProduct } from '@/lib/generate-structured';

const RequestSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required'),
  schema: z.string().trim().min(1, 'Schema selection is required'),
  modelId: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const body = RequestSchema.parse(await request.json());
    const result = await generateStructuredProduct({
      prompt: body.prompt,
      schema: body.schema,
      modelId: body.modelId,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? 'Invalid request body'
        : errorMessage(error, 'Unable to generate structured output');

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
