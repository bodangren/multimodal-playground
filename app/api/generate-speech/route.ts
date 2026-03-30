import { NextResponse } from 'next/server';
import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { generateSpeechFromText } from '@/lib/generate-speech';

const RequestSchema = z.object({
  text: z.string().trim().min(1, 'Text is required'),
  voice: z.string().trim().min(1, 'Voice is required').optional(),
  modelId: z.string().trim().min(1).optional(),
});

const ResponseSchema = z.object({
  text: z.string().trim().min(1),
  voice: z.string().trim().min(1).optional(),
  modelId: z.string().trim().min(1),
  audioDataUrl: z.string().trim().min(1),
  mediaType: z.string().trim().min(1),
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
    const body = RequestSchema.parse(await request.json());
    const result = await generateSpeechFromText(body);
    const payload = ResponseSchema.parse(result);

    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? 'Invalid generated speech payload'
        : errorMessage(error, 'Unable to generate speech');

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
