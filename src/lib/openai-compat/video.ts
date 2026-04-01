import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { generateVideoFromPrompt } from '@/lib/generate-video';

export const OpenAIVideoRequestSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required'),
  model: z.string().optional(),
  size: z.enum(['256x256', '512x512', '1024x1024']).optional().default('1024x1024'),
  quality: z.enum(['standard', 'hd']).optional().default('standard'),
});

export type OpenAIVideoRequest = z.infer<typeof OpenAIVideoRequestSchema>;

export type OpenAIVideoData = {
  b64_json?: string;
  url?: string;
  revised_prompt?: string;
};

export type OpenAIVideoResponse = {
  created: number;
  data: OpenAIVideoData[];
};

export async function executeVideoGeneration(input: OpenAIVideoRequest): Promise<OpenAIVideoResponse> {
  const parsed = OpenAIVideoRequestSchema.parse(input);

  try {
    const result = await generateVideoFromPrompt({
      prompt: parsed.prompt,
      modelId: parsed.model,
    });

    const base64 = result.videoDataUrl.split(',')[1] ?? '';

    return {
      created: Math.floor(Date.now() / 1000),
      data: [{
        b64_json: base64,
        revised_prompt: result.prompt,
      }],
    };
  } catch (error) {
    throw new Error(errorMessage(error, 'Unable to generate video'), { cause: error });
  }
}
