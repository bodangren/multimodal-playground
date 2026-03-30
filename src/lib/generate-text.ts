import { generateText } from 'ai';
import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { getDefaultTextModelId, getTextModel } from '@/lib/provider';

export const TextGenerationInputSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required'),
  modelId: z.string().trim().min(1).optional(),
});

export type TextGenerationInput = z.infer<typeof TextGenerationInputSchema>;

export async function generateTextFromPrompt(input: TextGenerationInput) {
  const { prompt, modelId } = TextGenerationInputSchema.parse(input);

  try {
    const result = await generateText({
      model: getTextModel(modelId ?? getDefaultTextModelId()),
      prompt,
    });

    if (!result.text.trim()) {
      throw new Error('No text was generated');
    }

    if (result.warnings?.length) {
      console.warn('OpenRouter generation warnings:', result.warnings);
    }

    return {
      text: result.text,
      modelId: result.response.modelId,
      responseId: result.response.id,
      providerMetadata: result.providerMetadata ?? {},
    };
  } catch (error) {
    throw new Error(errorMessage(error, 'Unable to generate text'), { cause: error });
  }
}
