import { experimental_generateVideo } from 'ai';
import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { getDefaultVideoModelId, getVideoModel } from '@/lib/provider';

export const VideoGenerationInputSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required'),
  modelId: z.string().trim().min(1).optional(),
});

export type VideoGenerationInput = z.infer<typeof VideoGenerationInputSchema>;

export type VideoGenerationResult = {
  prompt: string;
  modelId: string;
  videoDataUrl: string;
  mediaType: string;
  response: {
    timestamp: string;
    modelId: string;
  } | null;
  providerMetadata: Record<string, unknown>;
  warnings: Array<{ message?: string; details?: string }>;
};

function normalizeVideoDataUrl(mediaType: string, base64: string) {
  return `data:${mediaType};base64,${base64}`;
}

export async function generateVideoFromPrompt(input: VideoGenerationInput): Promise<VideoGenerationResult> {
  const { prompt, modelId } = VideoGenerationInputSchema.parse(input);
  const resolvedModelId = modelId ?? getDefaultVideoModelId();

  if (resolvedModelId.includes('/')) {
    throw new Error('OpenRouter video generation is still alpha and is not implemented in this app yet');
  }

  try {
    const result = await experimental_generateVideo({
      model: getVideoModel(resolvedModelId),
      prompt,
      n: 1,
      aspectRatio: '16:9',
      seed: 42,
    });

    if (!result.video?.base64 || !result.video.mediaType) {
      throw new Error('No video was generated');
    }

    return {
      prompt,
      modelId: resolvedModelId,
      videoDataUrl: normalizeVideoDataUrl(result.video.mediaType, result.video.base64),
      mediaType: result.video.mediaType,
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
    throw new Error(errorMessage(error, 'Unable to generate video'), { cause: error });
  }
}
