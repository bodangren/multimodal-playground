import { NextResponse } from 'next/server';
import { generationQueue } from '@/lib/queue';

export async function POST() {
  const job = generationQueue.dequeue();

  if (!job) {
    return NextResponse.json({ error: 'No jobs in queue' }, { status: 204 });
  }

  return NextResponse.json(job);
}