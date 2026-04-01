import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkAuth, openAiError } from '@/lib/openai-compat/auth';
import { executeSpeechGeneration, OpenAISpeechRequestSchema } from '@/lib/openai-compat/audio';

export async function POST(request: Request) {
  const authResult = checkAuth(request);
  if (!authResult.allowed) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = OpenAISpeechRequestSchema.parse(body);
    const { audioBuffer, contentType } = await executeSpeechGeneration(parsed);
    return new NextResponse(audioBuffer as unknown as BodyInit, {
      headers: { 'Content-Type': contentType },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? 'Invalid request body';
      return NextResponse.json({ error: openAiError(message, 'invalid_request_error', error.issues[0]?.path.join('.')) }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Speech generation failed';
    return NextResponse.json({ error: openAiError(message, 'api_error') }, { status: 500 });
  }
}
