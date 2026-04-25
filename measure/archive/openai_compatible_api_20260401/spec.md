# Specification: OpenAI-Compatible API

## Overview

Expose an OpenAI-compatible REST API layer on top of the existing multimodal helpers so that any OpenAI-compatible client (SDKs, curl, third-party tools) can point to `http://localhost:3000/v1/...` and use all modalities. The existing playground UI and internal routes remain untouched.

## Tech Constraints

- TypeScript.
- Next.js App Router.
- Reuse existing `src/lib/` helpers; do not rewrite modality logic.
- No new dependencies beyond what the project already uses.

## Environment Requirements

- `OPENROUTER_API_KEY` required (already exists).
- `API_SECRET_KEY` optional — used to gate access in non-local environments.
- No auth enforcement when `NODE_ENV === 'development'` or `process.env.VERCEL_ENV !== 'production'`.

## Functional Requirements

### FR-1 Middleware Auth Gate

A shared middleware or auth helper must:
- Allow all requests when running locally (no `VERCEL_ENV` or `development`).
- Require `Authorization: Bearer <API_SECRET_KEY>` header in production.
- Return `401 { "error": { "message": "Invalid or missing API key", "type": "invalid_request_error" } }` on auth failure.

### FR-2 Models Endpoint (`GET /v1/models`)

Return an OpenAI-compatible models listing:
- Query OpenRouter for available models via existing `src/lib/openrouter-models.ts`.
- Return all models that support at least one modality the app exposes.
- Response shape: `{ "object": "list", "data": [{ "id": "...", "object": "model", "created": ..., "owned_by": "openrouter" }] }`.

### FR-3 Chat Completions (`POST /v1/chat/completions`)

Accept OpenAI chat completion requests and route to existing helpers:
- **Text-only prompts**: Use `src/lib/generate-text.ts`.
- **Structured output**: When `response_format: { type: "json_schema", json_schema: {...} }` is provided, use `src/lib/generate-structured.ts` with the supplied schema.
- **Multimodal input**: When `content` includes `image_url` parts, include images in the OpenRouter request via the existing provider.
- **Streaming**: Support `stream: true` by returning SSE in OpenAI chunk format.
- **Non-streaming**: Return `{ "id": "...", "object": "chat.completion", "created": ..., "model": "...", "choices": [{ "index": 0, "message": { "role": "assistant", "content": "..." }, "finish_reason": "stop" }] }`.
- Map OpenAI `model` parameter directly to OpenRouter model IDs (pass-through).
- Default model: use the existing default from `src/lib/provider.ts` when `model` is omitted.

### FR-4 Image Generation (`POST /v1/images/generations`)

Accept OpenAI image generation requests and route to `src/lib/generate-image.ts`:
- Accept `prompt` (required), `model` (optional, pass-through), `n` (default 1), `size` (map to `aspectRatio`), `response_format` (`"url"` or `"b64_json"`, default `"b64_json"`).
- Return `{ "created": ..., "data": [{ "b64_json": "..." }] }` or `{ "created": ..., "data": [{ "url": "..." }] }`.

### FR-5 Speech Generation (`POST /v1/audio/speech`)

Accept OpenAI speech generation requests and route to `src/lib/generate-speech.ts`:
- Accept `input` (text, required), `voice` (optional), `model` (optional, pass-through).
- Return raw audio bytes with `Content-Type: audio/mpeg` (or appropriate type from helper).

### FR-6 Audio Transcription (`POST /v1/audio/transcriptions`)

Accept OpenAI transcription requests and route to `src/lib/transcribe-audio.ts`:
- Accept `file` (multipart form-data, required), `model` (optional).
- Return `{ "text": "transcript..." }` for default format.
- Support `response_format` parameter (`"json"`, `"text"`, `"verbose_json"`).

### FR-7 Error Normalization

All endpoints must return OpenAI-compatible error shapes:
```json
{
  "error": {
    "message": "Human-readable message",
    "type": "invalid_request_error | api_error | authentication_error",
    "param": "field_name_or_null",
    "code": null
  }
}
```

### FR-8 No UI Changes

The existing playground UI at `app/page.tsx` and all existing internal API routes (`/api/generate-*`) remain functional and unchanged.

## Non-Functional Requirements

- Strict OpenAI request/response format compatibility.
- Pass-through OpenRouter model IDs — no custom model name mapping.
- Reuse existing helpers; the new routes are thin adapters.
- Type-safe request parsing with Zod.

## File Deliverables

- `src/lib/openai-compat/auth.ts` — auth gate helper
- `src/lib/openai-compat/chat.ts` — chat completion adapter
- `src/lib/openai-compat/images.ts` — image generation adapter
- `src/lib/openai-compat/audio.ts` — speech + transcription adapters
- `src/lib/openai-compat/models.ts` — models listing adapter
- `app/api/v1/models/route.ts`
- `app/api/v1/chat/completions/route.ts`
- `app/api/v1/images/generations/route.ts`
- `app/api/v1/audio/speech/route.ts`
- `app/api/v1/audio/transcriptions/route.ts`
- Tests for each adapter and route

## Completion Criteria

1. `curl` or OpenAI SDK pointing to `http://localhost:3000/v1/` can call all five endpoints successfully.
2. Chat completions return valid OpenAI `chat.completion` objects.
3. Image generation returns valid OpenAI `images` objects.
4. Audio speech returns playable audio bytes.
5. Audio transcription returns valid transcript.
6. Models endpoint returns a non-empty list of OpenRouter models.
7. No auth is required when running `npm run dev` locally.
8. Existing playground UI and internal routes continue to work.

## Out of Scope

- Streaming chat completions (phase 2).
- Tool calling / function calling.
- Fine-tuning endpoints.
- Embeddings endpoint.
- Rate limiting.
- Usage/billing tracking.
