import { config } from 'dotenv';
config({ path: '.env.local' });
config();

const prompt = process.argv.slice(2).join(' ').trim() || 'Create a sample product summary for a productivity app.';
const routeUrl = process.env.STRUCTURED_ROUTE_URL || 'http://127.0.0.1:3000/api/generate-structured';

const response = await fetch(routeUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt,
    schema: 'product',
  }),
});

const payload: unknown = await response.json();

if (!response.ok) {
  const message =
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    typeof (payload as { error?: unknown }).error === 'string'
      ? (payload as { error: string }).error
      : 'Structured generation failed';

  throw new Error(message);
}

console.log(JSON.stringify(payload, null, 2));
