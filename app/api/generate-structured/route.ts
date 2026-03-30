import { NextResponse } from 'next/server';
import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { generateStructuredProduct } from '@/lib/generate-structured';
import { ProductSchema } from '@/lib/schemas/product';

const RequestSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required'),
  schema: z.string().trim().min(1, 'Schema selection is required'),
  modelId: z.string().trim().min(1).optional(),
});

const StructuredResponseSchema = z.object({
  schema: z.literal('product'),
  data: ProductSchema,
  text: z.string().trim().min(1),
  modelId: z.string().trim().min(1),
  responseId: z.string().trim().min(1),
  providerMetadata: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  try {
    const body = RequestSchema.parse(await request.json());
    const result = await generateStructuredProduct({
      prompt: body.prompt,
      schema: body.schema,
      modelId: body.modelId,
    });
    const payload = StructuredResponseSchema.parse(result);

    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? 'Invalid structured output'
        : errorMessage(error, 'Unable to generate structured output');

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
