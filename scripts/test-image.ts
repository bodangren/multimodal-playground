import 'dotenv/config';

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { generateImageFromPrompt } from '../src/lib/generate-image';

const prompt = process.argv.slice(2).join(' ').trim() || 'A neon robot portrait on a clean studio backdrop.';

const result = await generateImageFromPrompt({ prompt });
const base64 = result.imageDataUrl.split(',')[1];
const extension = result.mediaType.split('/')[1]?.replace(/[^a-z0-9]+/gi, '') || 'bin';
const outputPath = join(process.cwd(), 'output', `generated-image.${extension}`);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, Buffer.from(base64, 'base64'));

console.log(JSON.stringify({ ...result, outputPath }, null, 2));
