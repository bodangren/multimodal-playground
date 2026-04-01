import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkAuth, openAiError } from '@/lib/openai-compat/auth';
import { executeChatCompletion } from '@/lib/openai-compat/chat';

const ChatRequestSchema = z.object({
  model: z.string().optional(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant', 'tool']),
    content: z.union([
      z.string(),
      z.array(z.object({
        type: z.string(),
        text: z.string().optional(),
        image_url: z.object({ url: z.string() }).optional(),
      })),
    ]).optional(),
  })).min(1, 'At least one message is required'),
  stream: z.boolean().optional(),
  response_format: z.object({
    type: z.string(),
    json_schema: z.object({
      name: z.string().optional(),
      schema: z.unknown().optional(),
    }).optional(),
  }).optional(),
});

export async function POST(request: Request) {
  const authResult = checkAuth(request);
  if (!authResult.allowed) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = ChatRequestSchema.parse(body);

    if (parsed.stream) {
      return NextResponse.json(
        { error: openAiError('Streaming is not yet supported', 'invalid_request_error') },
        { status: 501 },
      );
    }

    const result = await executeChatCompletion(parsed);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? 'Invalid request body';
      return NextResponse.json({ error: openAiError(message, 'invalid_request_error', error.issues[0]?.path.join('.')) }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Chat completion failed';
    return NextResponse.json({ error: openAiError(message, 'api_error') }, { status: 500 });
  }
}
