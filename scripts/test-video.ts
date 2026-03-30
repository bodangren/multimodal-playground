import 'dotenv/config';

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { generateVideoFromPrompt } from '../src/lib/generate-video';

const prompt = process.argv.slice(2).join(' ').trim() || 'A cinematic skyline at dusk with soft neon reflections.';

const result = await generateVideoFromPrompt({
  prompt,
});

const base64 = result.videoDataUrl.split(',')[1];
const extension = result.mediaType.split('/')[1]?.replace(/[^a-z0-9]+/gi, '') || 'bin';
const outputPath = join(process.cwd(), 'output', `generated-video.${extension}`);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, Buffer.from(base64, 'base64'));

console.log(JSON.stringify({ ...result, outputPath }, null, 2));
