import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { generateSpeechFromText } from '@/lib/generate-speech';
import { transcribeAudio } from '@/lib/transcribe-audio';

export const OpenAISpeechRequestSchema = z.object({
  input: z.string().trim().min(1, 'Input text is required'),
  model: z.string().optional(),
  voice: z.string().optional(),
  response_format: z.enum(['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm']).default('mp3'),
  speed: z.number().min(0.25).max(4.0).default(1.0),
});

export type OpenAISpeechRequest = z.infer<typeof OpenAISpeechRequestSchema>;

export async function executeSpeechGeneration(input: OpenAISpeechRequest): Promise<{
  audioBuffer: Buffer;
  contentType: string;
}> {
  const parsed = OpenAISpeechRequestSchema.parse(input);

  const formatToMediaType: Record<string, string> = {
    mp3: 'audio/mpeg',
    opus: 'audio/opus',
    aac: 'audio/aac',
    flac: 'audio/flac',
    wav: 'audio/wav',
    pcm: 'audio/pcm',
  };

  try {
    const result = await generateSpeechFromText({
      text: parsed.input,
      modelId: parsed.model,
      voice: parsed.voice,
      speed: parsed.speed,
    });

    const base64 = result.audioDataUrl.split(',')[1] ?? '';
    const audioBuffer = Buffer.from(base64, 'base64');
    const contentType = formatToMediaType[parsed.response_format] ?? 'audio/mpeg';

    return { audioBuffer, contentType };
  } catch (error) {
    throw new Error(errorMessage(error, 'Unable to generate speech'), { cause: error });
  }
}

export const OpenAITranscriptionRequestSchema = z.object({
  model: z.string().optional(),
  response_format: z.enum(['json', 'text', 'verbose_json', 'srt', 'vtt']).default('json'),
});

export type OpenAITranscriptionRequest = z.infer<typeof OpenAITranscriptionRequestSchema>;

export async function executeTranscription(input: {
  fileBuffer: Buffer;
  mediaType: string;
  options: OpenAITranscriptionRequest;
}): Promise<{ text: string; contentType: string }> {
  const { fileBuffer, mediaType, options } = input;
  const parsed = OpenAITranscriptionRequestSchema.parse(options);

  try {
    const result = await transcribeAudio({
      audio: fileBuffer,
      modelId: parsed.model,
      mediaType,
    });

    if (parsed.response_format === 'text') {
      return { text: result.text, contentType: 'text/plain' };
    }

    return {
      text: JSON.stringify({ text: result.text }),
      contentType: 'application/json',
    };
  } catch (error) {
    throw new Error(errorMessage(error, 'Unable to transcribe audio'), { cause: error });
  }
}
