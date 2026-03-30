import { NextResponse } from 'next/server';
import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { generateVideoFromPrompt } from '@/lib/generate-video';

const RequestSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required'),
  modelId: z.string().trim().min(1).optional(),
});

const ResponseSchema = z.object({
  prompt: z.string().trim().min(1),
  modelId: z.string().trim().min(1),
  videoDataUrl: z.string().trim().min(1),
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
    const result = await generateVideoFromPrompt(body);
    const payload = ResponseSchema.parse(result);

    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? 'Invalid generated video payload'
        : errorMessage(error, 'Unable to generate video');

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
