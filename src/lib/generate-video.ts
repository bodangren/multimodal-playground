import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { getOpenRouterApiUrl, getOpenRouterAuthHeaders, getDefaultVideoModelId } from '@/lib/provider';

export const VideoGenerationInputSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required'),
  modelId: z.string().trim().min(1).optional(),
});

const OpenRouterVideoResponseSchema = z.object({
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
            content: z.string().optional().nullable(),
            videos: z
              .array(
                z.object({
                  video_url: z.object({
                    url: z.string().min(1),
                  }),
                })
              )
              .optional(),
          })
          .optional(),
      })
    )
    .min(1, 'No video response choices were returned'),
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

function parseVideoDataUrl(dataUrl: string) {
  const match = /^data:([^;,]+);base64,(.+)$/i.exec(dataUrl);

  if (!match) {
    throw new Error('OpenRouter returned an unsupported video payload');
  }

  const [, mediaType, base64] = match;
  return { mediaType, base64 };
}

async function normalizeReturnedVideo(videoUrl: string) {
  if (videoUrl.startsWith('data:')) {
    return parseVideoDataUrl(videoUrl);
  }

  const response = await fetch(videoUrl);

  if (!response.ok) {
    throw new Error(`Unable to fetch generated video asset (${response.status})`);
  }

  const mediaType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'video/mp4';
  const bytes = Buffer.from(await response.arrayBuffer()).toString('base64');

  return { mediaType, base64: bytes };
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
  return text || `OpenRouter video request failed with status ${response.status}`;
}

export async function generateVideoFromPrompt(input: VideoGenerationInput): Promise<VideoGenerationResult> {
  const { prompt, modelId } = VideoGenerationInputSchema.parse(input);
  const resolvedModelId = modelId ?? getDefaultVideoModelId();

  try {
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
        modalities: ['video'],
      }),
    });

    if (!response.ok) {
      throw new Error(await readOpenRouterError(response));
    }

    const payload = OpenRouterVideoResponseSchema.parse(await response.json());
    const videoUrl = payload.choices[0]?.message?.videos?.[0]?.video_url.url;

    if (!videoUrl) {
      throw new Error('No video was generated');
    }

    const video = await normalizeReturnedVideo(videoUrl);
    const timestamp = response.headers.get('date');

    return {
      prompt,
      modelId: resolvedModelId,
      videoDataUrl: normalizeVideoDataUrl(video.mediaType, video.base64),
      mediaType: video.mediaType,
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
    throw new Error(errorMessage(error, 'Unable to generate video'), { cause: error });
  }
}
