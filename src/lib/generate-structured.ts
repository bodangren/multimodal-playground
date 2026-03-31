import { generateText, Output } from 'ai';
import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { getDefaultTextModelId, getTextModel } from '@/lib/provider';
import { ProductSchema, resolveStructuredSchema, type StructuredSchemaName } from '@/lib/schemas/product';

export const StructuredGenerationInputSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required'),
  schema: z.string().trim().min(1, 'Schema selection is required'),
  modelId: z.string().trim().min(1).optional(),
});

export type StructuredGenerationInput = z.infer<typeof StructuredGenerationInputSchema>;

export async function generateStructuredProduct(input: StructuredGenerationInput) {
  const { prompt, schema, modelId } = StructuredGenerationInputSchema.parse(input);
  const structuredSchema = resolveStructuredSchema(schema);
  const output = Output.object({
    schema: structuredSchema,
    name: schema,
    description: `Structured JSON for the ${schema} schema`,
  });

  try {
    const result = await generateText({
      model: getTextModel(modelId ?? getDefaultTextModelId()),
      system: 'Respond with valid json that conforms to the schema.',
      prompt,
      output,
    });

    const data = ProductSchema.parse(result.output);

    return {
      schema: schema as StructuredSchemaName,
      data,
      text: result.text,
      modelId: result.response.modelId,
      responseId: result.response.id,
      providerMetadata: result.providerMetadata ?? {},
    };
  } catch (error) {
    throw new Error(errorMessage(error, 'Unable to generate structured output'), { cause: error });
  }
}
