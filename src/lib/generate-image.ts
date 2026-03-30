import { experimental_generateImage } from 'ai';
import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { getImageModel } from '@/lib/provider';
import { selectOpenRouterImageModelId } from '@/lib/openrouter-image-models';

export const ImageGenerationInputSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required'),
  modelId: z.string().trim().min(1).optional(),
});

export type ImageGenerationInput = z.infer<typeof ImageGenerationInputSchema>;

export type ImageGenerationResult = {
  prompt: string;
  modelId: string;
  imageDataUrl: string;
  mediaType: string;
  response: {
    timestamp: string;
    modelId: string;
  } | null;
  providerMetadata: Record<string, unknown>;
  warnings: Array<{ message?: string; details?: string }>;
};

function normalizeImageDataUrl(mediaType: string, base64: string) {
  return `data:${mediaType};base64,${base64}`;
}

export async function generateImageFromPrompt(input: ImageGenerationInput): Promise<ImageGenerationResult> {
  const { prompt, modelId } = ImageGenerationInputSchema.parse(input);

  try {
    const resolvedModelId = await selectOpenRouterImageModelId(modelId);
    const result = await experimental_generateImage({
      model: getImageModel(resolvedModelId),
      prompt,
      n: 1,
      aspectRatio: '16:9',
      seed: 42,
    });

    if (!result.image?.base64 || !result.image.mediaType) {
      throw new Error('No image was generated');
    }

    return {
      prompt,
      modelId: resolvedModelId,
      imageDataUrl: normalizeImageDataUrl(result.image.mediaType, result.image.base64),
      mediaType: result.image.mediaType,
      response: result.responses[0]
        ? {
            timestamp: result.responses[0].timestamp.toISOString(),
            modelId: result.responses[0].modelId,
          }
        : null,
      providerMetadata: result.providerMetadata ?? {},
      warnings: result.warnings ?? [],
    };
  } catch (error) {
    throw new Error(errorMessage(error, 'Unable to generate image'), { cause: error });
  }
}
