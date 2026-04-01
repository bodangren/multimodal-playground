import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkAuth, openAiError } from '@/lib/openai-compat/auth';
import { executeImageGeneration, OpenAIImageRequestSchema } from '@/lib/openai-compat/images';

export async function POST(request: Request) {
  const authResult = checkAuth(request);
  if (!authResult.allowed) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = OpenAIImageRequestSchema.parse(body);
    const result = await executeImageGeneration(parsed);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? 'Invalid request body';
      return NextResponse.json({ error: openAiError(message, 'invalid_request_error', error.issues[0]?.path.join('.')) }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Image generation failed';
    return NextResponse.json({ error: openAiError(message, 'api_error') }, { status: 500 });
  }
}
