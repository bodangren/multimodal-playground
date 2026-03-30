import 'dotenv/config';

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { generateSpeechFromText } from '../src/lib/generate-speech';

const text =
  process.argv.slice(2).join(' ').trim() || 'Say hello in a warm and friendly tone.';
const voice = process.env.SPEECH_VOICE?.trim();
const modelId = process.env.SPEECH_MODEL_ID?.trim();

const result = await generateSpeechFromText({
  text,
  voice,
  modelId,
});

const base64 = result.audioDataUrl.split(',')[1];
const extension = result.mediaType.split('/')[1]?.replace(/[^a-z0-9]+/gi, '') || 'mp3';
const outputPath = join(process.cwd(), 'output', `generated-speech.${extension}`);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, Buffer.from(base64, 'base64'));

console.log(JSON.stringify({ ...result, outputPath }, null, 2));
