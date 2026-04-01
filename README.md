# AI Image Generator / Multimodal Playground

A Next.js-based multimodal AI playground and internal gateway powered by OpenRouter. Exposes server-side routes for text, structured output, image generation, speech generation, audio transcription, and video generation. Also provides an OpenAI-compatible API layer so any OpenAI SDK client can connect directly.

## Quick Start

```bash
pnpm install
cp .env.example .env.local
# Edit .env.local and add your OPENROUTER_API_KEY
pnpm dev
```

The app runs on `http://localhost:3030`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | Your OpenRouter API key (`sk-or-v1-...`) |
| `API_SECRET_KEY` | No | Secret key for OpenAI-compatible endpoints in production (not needed for local/dev) |

## Internal API Endpoints

These endpoints are designed for the playground UI and internal consumers. No authentication required for local development.

### Text Generation

```
POST /api/generate-text
Content-Type: application/json
```

**Request:**
```json
{
  "prompt": "Write a short poem about the ocean",
  "modelId": "openai/gpt-4o-mini"
}
```

**Response (200):**
```json
{
  "text": "...",
  "modelId": "openai/gpt-4o-mini",
  "responseId": "...",
  "providerMetadata": {}
}
```

**Error (400):**
```json
{ "error": "Prompt is required" }
```

---

### Image Generation

```
POST /api/generate-image
Content-Type: application/json
```

**Request:**
```json
{
  "prompt": "A sunset over a calm ocean",
  "modelId": "black-forest-labs/flux-1-schnell"
}
```

**Response (200):**
```json
{
  "prompt": "A sunset over a calm ocean",
  "modelId": "black-forest-labs/flux-1-schnell",
  "imageDataUrl": "data:image/png;base64,...",
  "mediaType": "image/png",
  "response": { "timestamp": "...", "modelId": "..." },
  "providerMetadata": { "openrouter": { "responseId": "...", "usage": {} } },
  "warnings": []
}
```

---

### Speech Generation

```
POST /api/generate-speech
Content-Type: application/json
```

**Request:**
```json
{
  "text": "Hello, welcome to the AI playground",
  "modelId": "openai/gpt-audio-mini",
  "voice": "alloy"
}
```

**Response (200):**
```json
{
  "text": "Hello, welcome to the AI playground",
  "voice": "alloy",
  "modelId": "openai/gpt-audio-mini",
  "audioDataUrl": "data:audio/wav;base64,...",
  "mediaType": "audio/wav",
  "response": { "timestamp": "...", "modelId": "..." },
  "providerMetadata": { "openrouter": { "responseId": "..." } },
  "warnings": []
}
```

---

### Audio Transcription

```
POST /api/transcribe
Content-Type: multipart/form-data
```

**Request (multipart):**
- `audio` (File): Audio file (mp3, wav, ogg, flac, m4a, aac)
- `modelId` (optional): Model override

**curl example:**
```bash
curl -X POST http://localhost:3030/api/transcribe \
  -F "audio=@recording.mp3" \
  -F "modelId=openai/whisper-1"
```

**Response (200):**
```json
{
  "text": "Transcribed text here...",
  "segments": [],
  "modelId": "openai/whisper-1",
  "response": { "timestamp": "...", "modelId": "..." },
  "providerMetadata": {},
  "warnings": []
}
```

---

### Video Generation

```
POST /api/generate-video
Content-Type: application/json
```

**Request:**
```json
{
  "prompt": "A timelapse of clouds moving across the sky",
  "modelId": "minimax/video-01"
}
```

**Response (200):**
```json
{
  "prompt": "A timelapse of clouds moving across the sky",
  "modelId": "minimax/video-01",
  "videoDataUrl": "data:video/mp4;base64,...",
  "mediaType": "video/mp4",
  "response": { "timestamp": "...", "modelId": "..." },
  "providerMetadata": { "openrouter": { "responseId": "...", "usage": {} } },
  "warnings": []
}
```

---

### Structured Output

```
POST /api/generate-structured
Content-Type: application/json
```

**Request:**
```json
{
  "prompt": "A premium wireless headphone with noise cancellation",
  "schema": "product"
}
```

**Response (200):**
```json
{
  "schema": "product",
  "data": {
    "name": "Premium Wireless Headphone",
    "summary": "...",
    "price": 299.99,
    "featured": false,
    "tags": ["audio", "wireless"]
  },
  "text": "...",
  "modelId": "...",
  "responseId": "..."
}
```

---

## OpenAI-Compatible API Endpoints

These endpoints mimic the OpenAI API shape so any OpenAI SDK client can connect. Requires `Authorization: Bearer <API_SECRET_KEY>` header in production (no auth needed for local development).

### Chat Completions

```
POST /api/v1/chat/completions
Content-Type: application/json
Authorization: Bearer <your-api-secret-key>
```

**Request:**
```json
{
  "model": "openai/gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "What is the capital of France?" }
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "answer",
      "schema": { "type": "object", "properties": { "answer": { "type": "string" } } }
    }
  }
}
```

**Response (200):**
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1712345678,
  "model": "openai/gpt-4o-mini",
  "choices": [{
    "index": 0,
    "message": { "role": "assistant", "content": "..." },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

**Note:** Streaming (`stream: true`) returns 501 Not Implemented.

**curl example:**
```bash
curl -X POST http://localhost:3030/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

---

### Image Generations

```
POST /api/v1/images/generations
Content-Type: application/json
Authorization: Bearer <your-api-secret-key>
```

**Request:**
```json
{
  "model": "black-forest-labs/flux-1-schnell",
  "prompt": "A cat sitting on a windowsill",
  "n": 1,
  "size": "1024x1024",
  "response_format": "b64_json"
}
```

**Response (200):**
```json
{
  "created": 1712345678,
  "data": [{
    "b64_json": "..."
  }]
}
```

**curl example:**
```bash
curl -X POST http://localhost:3030/api/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{
    "prompt": "A cat sitting on a windowsill",
    "size": "1024x1024"
  }'
```

---

### Audio Speech

```
POST /api/v1/audio/speech
Content-Type: application/json
Authorization: Bearer <your-api-secret-key>
```

**Request:**
```json
{
  "model": "openai/tts-1",
  "input": "Hello world",
  "voice": "alloy",
  "response_format": "mp3",
  "speed": 1.0
}
```

**Response (200):** Raw audio bytes with `Content-Type: audio/mpeg` (or requested format).

**curl example:**
```bash
curl -X POST http://localhost:3030/api/v1/audio/speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{"input": "Hello world", "voice": "alloy"}' \
  --output speech.mp3
```

---

### Audio Transcriptions

```
POST /api/v1/audio/transcriptions
Content-Type: multipart/form-data
Authorization: Bearer <your-api-secret-key>
```

**Request (multipart):**
- `file` (File): Audio file
- `model` (optional): Model override
- `response_format` (optional): `json` (default) or `text`

**curl example:**
```bash
curl -X POST http://localhost:3030/api/v1/audio/transcriptions \
  -H "Authorization: Bearer your-secret-key" \
  -F "file=@recording.mp3" \
  -F "response_format=json"
```

**Response (200) - JSON format:**
```json
{ "text": "Transcribed text..." }
```

**Response (200) - Text format:**
```
Transcribed text...
```

---

### List Models

```
GET /api/v1/models
Authorization: Bearer <your-api-secret-key>
```

**Response (200):**
```json
{
  "object": "list",
  "data": [
    {
      "id": "openai/gpt-4o-mini",
      "object": "model",
      "created": 1712345678,
      "owned_by": "openrouter"
    }
  ]
}
```

**curl example:**
```bash
curl http://localhost:3030/api/v1/models \
  -H "Authorization: Bearer your-secret-key"
```

---

## Container Deployment (Podman)

### Build

```bash
podman build -t ai-image-generator .
```

### Run

```bash
podman run -d \
  --name ai-image-generator \
  -p 3030:3030 \
  -e OPENROUTER_API_KEY=sk-or-v1-your-key-here \
  ai-image-generator
```

### Run with API secret key (production)

```bash
podman run -d \
  --name ai-image-generator \
  -p 3030:3030 \
  -e OPENROUTER_API_KEY=sk-or-v1-your-key-here \
  -e API_SECRET_KEY=your-secret-key \
  ai-image-generator
```

### Stop and remove

```bash
podman stop ai-image-generator
podman rm ai-image-generator
```

## Testing

```bash
pnpm test           # Run all tests
pnpm test:coverage  # Run with coverage report
pnpm test:watch     # Watch mode
pnpm typecheck      # TypeScript type checking
pnpm lint           # ESLint
```

## Tech Stack

- **Framework:** Next.js 16 (App Router, standalone output)
- **AI SDK:** Vercel AI SDK v6
- **Provider:** OpenRouter (primary)
- **Validation:** Zod v4
- **Testing:** Vitest + jsdom
- **Runtime:** Node.js 20+

## Project Structure

```
app/
  api/
    generate-text/        # Internal text generation
    generate-image/       # Internal image generation
    generate-speech/      # Internal speech generation
    generate-video/       # Internal video generation
    generate-structured/  # Internal structured output
    transcribe/           # Internal audio transcription
    v1/                   # OpenAI-compatible API layer
      chat/completions/
      images/generations/
      audio/speech/
      audio/transcriptions/
      models/
  page.tsx                # Playground UI
src/lib/                  # Shared helpers and provider config
conductor/                # Spec-driven development tracks
```
