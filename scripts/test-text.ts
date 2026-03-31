import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { generateTextFromPrompt } from '../src/lib/generate-text';

const prompt = process.argv.slice(2).join(' ').trim() || 'Write a short one-line welcome message.';

const result = await generateTextFromPrompt({ prompt });

console.log(result.text.trim());
