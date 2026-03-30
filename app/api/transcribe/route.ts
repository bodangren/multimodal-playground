import { NextResponse } from 'next/server';
import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { transcribeAudio } from '@/lib/transcribe-audio';

const TextSchema = z.string().trim().min(1);
const ResponseSchema = z.object({
  text: z.string().trim().min(1),
  segments: z.array(
    z.object({
      text: z.string().trim().min(1),
      startSecond: z.number(),
      endSecond: z.number(),
    })
  ),
  language: z.string().trim().min(1).optional().nullable(),
  durationInSeconds: z.number().optional().nullable(),
  modelId: z.string().trim().min(1),
  response: z
    .object({
      timestamp: z.string().trim().min(1),
      modelId: z.string().trim().min(1),
    })
    .nullable(),
  providerMetadata: z.record(z.string(), z.unknown()),
  warnings: z.array(z.object({ message: z.string().optional(), details: z.string().optional() })),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get('audio');

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    const mediaType = audio.type?.trim();
    if (!mediaType) {
      return NextResponse.json({ error: 'Audio media type is required' }, { status: 400 });
    }

    if (!mediaType.toLowerCase().startsWith('audio/')) {
      return NextResponse.json({ error: 'Unsupported audio media type' }, { status: 400 });
    }

    const bytes = Buffer.from(await audio.arrayBuffer());
    if (bytes.length === 0) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    const modelEntry = formData.get('modelId');
    const modelId = typeof modelEntry === 'string' ? modelEntry.trim() : '';

    const result = await transcribeAudio({
      audio: bytes,
      mediaType,
      modelId: modelId ? TextSchema.parse(modelId) : undefined,
    });
    const payload = ResponseSchema.parse(result);

    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? 'Invalid generated transcription payload'
        : errorMessage(error, 'Unable to transcribe audio');

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
