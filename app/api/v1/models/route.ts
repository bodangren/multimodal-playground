import { NextResponse } from 'next/server';
import { checkAuth, openAiError } from '@/lib/openai-compat/auth';
import { listOpenAICompatModels } from '@/lib/openai-compat/models';

export async function GET(request: Request) {
  const authResult = checkAuth(request);
  if (!authResult.allowed) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const models = await listOpenAICompatModels();
    return NextResponse.json(models);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list models';
    return NextResponse.json({ error: openAiError(message, 'api_error') }, { status: 500 });
  }
}
