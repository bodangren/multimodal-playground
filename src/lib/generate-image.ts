import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { selectOpenRouterImageModelId } from '@/lib/openrouter-image-models';
import { getOpenRouterApiUrl, getOpenRouterAuthHeaders } from '@/lib/provider';

export const ImageGenerationInputSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required'),
  modelId: z.string().trim().min(1).optional(),
});

const OpenRouterImageResponseSchema = z.object({
  id: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  usage: z
    .object({
      prompt_tokens: z.number().nonnegative().optional(),
      completion_tokens: z.number().nonnegative().optional(),
      total_tokens: z.number().nonnegative().optional(),
    })
    .optional(),
  choices: z
    .array(
      z.object({
        message: z
          .object({
            images: z
              .array(
                z.object({
                  image_url: z.object({
                    url: z.string().min(1),
                  }),
                })
              )
              .optional(),
          })
          .optional(),
      })
    )
    .min(1, 'No image response choices were returned'),
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

function parseImageDataUrl(dataUrl: string) {
  const match = /^data:([^;,]+);base64,(.+)$/i.exec(dataUrl);

  if (!match) {
    throw new Error('OpenRouter returned an unsupported image payload');
  }

  const [, mediaType, base64] = match;
  return {
    mediaType,
    base64,
  };
}

async function normalizeReturnedImage(imageUrl: string) {
  if (imageUrl.startsWith('data:')) {
    return parseImageDataUrl(imageUrl);
  }

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(`Unable to fetch generated image asset (${response.status})`);
  }

  const mediaType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'application/octet-stream';
  const bytes = Buffer.from(await response.arrayBuffer()).toString('base64');

  return {
    mediaType,
    base64: bytes,
  };
}

async function readOpenRouterError(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const payload: unknown = await response.json();

    if (
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof (payload as { error?: unknown }).error === 'object' &&
      (payload as { error?: { message?: unknown } }).error?.message &&
      typeof (payload as { error?: { message?: unknown } }).error?.message === 'string'
    ) {
      return (payload as { error: { message: string } }).error.message;
    }

    if (
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof (payload as { message?: unknown }).message === 'string'
    ) {
      return (payload as { message: string }).message;
    }
  }

  const text = (await response.text()).trim();
  return text || `OpenRouter image request failed with status ${response.status}`;
}

export async function generateImageFromPrompt(input: ImageGenerationInput): Promise<ImageGenerationResult> {
  const { prompt, modelId } = ImageGenerationInputSchema.parse(input);

  try {
    const resolvedModelId = await selectOpenRouterImageModelId(modelId);
    const response = await fetch(getOpenRouterApiUrl('/chat/completions'), {
      method: 'POST',
      headers: {
        ...getOpenRouterAuthHeaders(),
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: resolvedModelId,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        modalities: ['image'],
        image_config: {
          aspect_ratio: '16:9',
        },
        seed: 42,
      }),
    });

    if (!response.ok) {
      throw new Error(await readOpenRouterError(response));
    }

    const payload = OpenRouterImageResponseSchema.parse(await response.json());
    const imageUrl = payload.choices[0]?.message?.images?.[0]?.image_url.url;

    if (!imageUrl) {
      throw new Error('No image was generated');
    }

    const image = await normalizeReturnedImage(imageUrl);
    const timestamp = response.headers.get('date');

    return {
      prompt,
      modelId: resolvedModelId,
      imageDataUrl: normalizeImageDataUrl(image.mediaType, image.base64),
      mediaType: image.mediaType,
      response: {
        timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
        modelId: payload.model ?? resolvedModelId,
      },
      providerMetadata: {
        openrouter: {
          responseId: payload.id ?? null,
          usage: payload.usage ?? null,
        },
      },
      warnings: [],
    };
  } catch (error) {
    throw new Error(errorMessage(error, 'Unable to generate image'), { cause: error });
  }
}
