import { NextResponse } from 'next/server';
import { generationQueue } from '@/lib/queue';

export async function GET() {
  const status = generationQueue.status();
  return NextResponse.json(status);
}