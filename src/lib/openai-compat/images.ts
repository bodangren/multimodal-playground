import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { generateImageFromPrompt } from '@/lib/generate-image';

const _OpenAIImageSizeToAspectRatio: Record<string, string> = {
  '1024x1024': '1:1',
  '1024x1792': '9:16',
  '1792x1024': '16:9',
};

export const OpenAIImageRequestSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required'),
  model: z.string().optional(),
  n: z.number().int().min(1).max(10).default(1),
  size: z.enum(['1024x1024', '1024x1792', '1792x1024']).default('1024x1024'),
  response_format: z.enum(['url', 'b64_json']).default('b64_json'),
});

export type OpenAIImageRequest = z.infer<typeof OpenAIImageRequestSchema>;

export type OpenAIImageData = {
  b64_json?: string;
  url?: string;
};

export type OpenAIImageResponse = {
  created: number;
  data: OpenAIImageData[];
};

export async function executeImageGeneration(input: OpenAIImageRequest): Promise<OpenAIImageResponse> {
  const parsed = OpenAIImageRequestSchema.parse(input);

  try {
    const result = await generateImageFromPrompt({
      prompt: parsed.prompt,
      modelId: parsed.model,
    });

    const images: OpenAIImageData[] = [];
    for (let i = 0; i < parsed.n; i++) {
      if (parsed.response_format === 'b64_json') {
        const base64 = result.imageDataUrl.split(',')[1] ?? '';
        images.push({ b64_json: base64 });
      } else {
        images.push({ url: result.imageDataUrl });
      }
    }

    return {
      created: Math.floor(Date.now() / 1000),
      data: images,
    };
  } catch (error) {
    throw new Error(errorMessage(error, 'Unable to generate image'), { cause: error });
  }
}
