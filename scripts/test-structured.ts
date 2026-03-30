import 'dotenv/config';

import { generateStructuredProduct } from '../src/lib/generate-structured';

const prompt = process.argv.slice(2).join(' ').trim() || 'Create a sample product summary for a productivity app.';

const result = await generateStructuredProduct({
  prompt,
  schema: 'product',
});

console.log(JSON.stringify(result.data, null, 2));
