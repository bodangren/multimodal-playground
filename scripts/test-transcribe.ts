import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { transcribeAudio } from '../src/lib/transcribe-audio';

const defaultPath = join(process.cwd(), 'fixtures', 'sample-audio.mp3');
const audioPath = process.argv[2]?.trim() || process.env.TRANSCRIBE_AUDIO_PATH?.trim() || defaultPath;
const modelId = process.env.TRANSCRIBE_MODEL_ID?.trim();

const mediaTypeMap: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
};

const extension = extname(audioPath).toLowerCase();
const mediaType = mediaTypeMap[extension] ?? 'audio/mpeg';

const audio = await readFile(audioPath);
const result = await transcribeAudio({
  audio,
  mediaType,
  modelId,
});

console.log(JSON.stringify(result, null, 2));
