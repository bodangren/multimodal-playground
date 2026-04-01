import { generateText, Output } from 'ai';
import { z } from 'zod';
import { errorMessage } from '@/lib/errors';
import { getDefaultTextModelId, getTextModel } from '@/lib/provider';

const OpenAIChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.union([
    z.string(),
    z.array(z.object({
      type: z.string(),
      text: z.string().optional(),
      image_url: z.object({ url: z.string() }).optional(),
    })),
  ]).optional(),
});

const OpenAIChatRequestSchema = z.object({
  model: z.string().optional(),
  messages: z.array(OpenAIChatMessageSchema).min(1, 'At least one message is required'),
  stream: z.boolean().optional(),
  response_format: z.object({
    type: z.string(),
    json_schema: z.object({
      name: z.string().optional(),
      schema: z.unknown().optional(),
    }).optional(),
  }).optional(),
});

export type OpenAIChatRequest = z.infer<typeof OpenAIChatRequestSchema>;

export type OpenAIChatChoice = {
  index: number;
  message: {
    role: 'assistant';
    content: string;
  };
  finish_reason: 'stop' | 'length' | 'content_filter';
};

export type OpenAIChatResponse = {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: OpenAIChatChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

type AiSdkMessage = {
  role: string;
  content: string | Array<{ type: string; text?: string; image?: string }>;
};

function buildAiSdkMessages(messages: OpenAIChatRequest['messages']) {
  const systemMessages = messages.filter((m) => m.role === 'system');
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');

  const system = systemMessages
    .map((m) => (typeof m.content === 'string' ? m.content : ''))
    .filter(Boolean)
    .join('\n');

  const promptParts: AiSdkMessage[] = [];
  for (const msg of nonSystemMessages) {
    if (typeof msg.content === 'string') {
      promptParts.push({ role: msg.role, content: msg.content });
    } else if (Array.isArray(msg.content)) {
      const textParts = msg.content.filter((p) => p.type === 'text').map((p) => p.text ?? '').filter(Boolean).join('\n');
      const imageParts = msg.content.filter((p) => p.type === 'image_url' && p.image_url);
      if (imageParts.length > 0) {
        const images = imageParts.map((p) => ({ type: 'image' as const, image: p.image_url!.url }));
        promptParts.push({
          role: msg.role,
          content: [{ type: 'text' as const, text: textParts }, ...images],
        });
      } else if (textParts) {
        promptParts.push({ role: msg.role, content: textParts });
      }
    }
  }

  return { system: system || undefined, messages: promptParts };
}

export async function executeChatCompletion(input: OpenAIChatRequest): Promise<OpenAIChatResponse> {
  const parsed = OpenAIChatRequestSchema.parse(input);
  const { system, messages: aiMessages } = buildAiSdkMessages(parsed.messages);

  const modelId = parsed.model ?? getDefaultTextModelId();
  const model = getTextModel(modelId);

  try {
    const isJsonSchema = parsed.response_format?.type === 'json_schema' && parsed.response_format?.json_schema?.schema;

    if (isJsonSchema) {
      const zodSchema = z.object({}).passthrough();
      const output = Output.object({
        schema: zodSchema,
        name: parsed.response_format!.json_schema!.name ?? 'response',
        description: 'Structured JSON response',
      });

      const lastMsg = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1] : null;
      const prompt = lastMsg && typeof lastMsg.content === 'string' ? lastMsg.content : '';

      const result = await generateText({
        model,
        system: system || 'Respond with valid JSON.',
        prompt,
        output,
      });

      const content = JSON.stringify(result.output);

      return {
        id: result.response.id ?? `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: result.response.modelId ?? modelId,
        choices: [{
          index: 0,
          message: { role: 'assistant', content },
          finish_reason: 'stop',
        }],
        usage: result.usage ? {
          prompt_tokens: result.usage.inputTokens ?? 0,
          completion_tokens: result.usage.outputTokens ?? 0,
          total_tokens: (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0),
        } : undefined,
      };
    }

    const lastMsg = aiMessages.length > 0 ? aiMessages[aiMessages.length - 1] : null;
    const prompt = lastMsg && typeof lastMsg.content === 'string'
      ? lastMsg.content
      : lastMsg ? JSON.stringify(lastMsg.content) : '';

    const result = await generateText({
      model,
      system,
      prompt,
    });

    if (!result.text.trim()) {
      throw new Error('No text was generated');
    }

    return {
      id: result.response.id ?? `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: result.response.modelId ?? modelId,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: result.text },
        finish_reason: 'stop',
      }],
      usage: result.usage ? {
        prompt_tokens: result.usage.inputTokens ?? 0,
        completion_tokens: result.usage.outputTokens ?? 0,
        total_tokens: (result.usage.inputTokens ?? 0) + (result.usage.outputTokens ?? 0),
      } : undefined,
    };
  } catch (error) {
    throw new Error(errorMessage(error, 'Unable to complete chat completion'), { cause: error });
  }
}
