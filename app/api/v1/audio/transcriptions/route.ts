import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkAuth, openAiError } from '@/lib/openai-compat/auth';
import { executeTranscription, OpenAITranscriptionRequestSchema } from '@/lib/openai-compat/audio';

export async function POST(request: Request) {
  const authResult = checkAuth(request);
  if (!authResult.allowed) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: openAiError('No file provided', 'invalid_request_error', 'file') }, { status: 400 });
    }

    const optionsRaw: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (key !== 'file' && typeof value === 'string') {
        optionsRaw[key] = value;
      }
    });

    const options = OpenAITranscriptionRequestSchema.parse(optionsRaw);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const mediaType = file.type || 'audio/mpeg';

    const { text, contentType } = await executeTranscription({
      fileBuffer,
      mediaType,
      options,
    });

    return new NextResponse(text, {
      headers: { 'Content-Type': contentType },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? 'Invalid request body';
      return NextResponse.json({ error: openAiError(message, 'invalid_request_error', error.issues[0]?.path.join('.')) }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Transcription failed';
    return NextResponse.json({ error: openAiError(message, 'api_error') }, { status: 500 });
  }
}
