# Implementation Plan: OpenAI-Compatible API

## Phase 1: Auth Gate And Models Endpoint

- [x] Task: Implement auth gate middleware/helper.
  - [x] Write failing tests for local bypass, missing key in production, and valid key acceptance.
  - [x] Implement `src/lib/openai-compat/auth.ts` with `checkAuth(req)` returning `{ allowed: boolean, error?: object }`.
  - [x] Use `VERCEL_ENV` to determine local vs production mode.
- [x] Task: Implement models listing adapter and route.
  - [x] Write failing tests for model filtering and OpenAI response shape.
  - [x] Implement `src/lib/openai-compat/models.ts` that wraps `src/lib/openrouter-models.ts` and formats as OpenAI `GET /v1/models`.
  - [x] Implement `app/api/v1/models/route.ts` with auth gate and error normalization.

## Phase 2: Chat Completions

- [x] Task: Implement chat completion adapter.
  - [x] Write failing tests for text-only prompts, multimodal input (image_url parts), structured output via `response_format`, and missing prompt.
  - [x] Implement `src/lib/openai-compat/chat.ts` that maps OpenAI `messages` to existing `generateText`/`generateStructured` calls.
  - [x] Handle `model` pass-through to OpenRouter and default model fallback.
- [x] Task: Wire chat completions route.
  - [x] Write failing route tests for valid request, auth failure, and provider error.
  - [x] Implement `app/api/v1/chat/completions/route.ts` with auth gate, Zod validation, and OpenAI response shape.

## Phase 3: Image Generation

- [x] Task: Implement image generation adapter.
  - [x] Write failing tests for `size` → `aspectRatio` mapping, `response_format` handling (`"b64_json"` vs `"url"`), and missing prompt.
  - [x] Implement `src/lib/openai-compat/images.ts` wrapping `src/lib/generate-image.ts`.
- [x] Task: Wire image generation route.
  - [x] Write failing route tests for valid request, auth failure, and missing image.
  - [x] Implement `app/api/v1/images/generations/route.ts` with auth gate, Zod validation, and OpenAI response shape.

## Phase 4: Audio Endpoints

- [x] Task: Implement speech adapter and route.
  - [x] Write failing tests for valid input, missing input, and voice pass-through.
  - [x] Implement `src/lib/openai-compat/audio.ts` speech function wrapping `src/lib/generate-speech.ts`.
  - [x] Implement `app/api/v1/audio/speech/route.ts` returning raw audio bytes with correct `Content-Type`.
- [x] Task: Implement transcription adapter and route.
  - [x] Write failing tests for multipart file upload, missing file, and response format selection.
  - [x] Implement transcription function in `src/lib/openai-compat/audio.ts` wrapping `src/lib/transcribe-audio.ts`.
  - [x] Implement `app/api/v1/audio/transcriptions/route.ts` with multipart parsing and OpenAI response shape.

## Phase 5: Final Verification

- [x] Task: Run final verification and document usage.
  - [x] Execute lint, typecheck, and all new adapter/route tests.
  - [x] Verify each endpoint with `curl` commands matching OpenAI SDK request shapes.
  - [x] Confirm existing playground UI and internal routes remain functional.
  - [x] Document `.env.local` `API_SECRET_KEY` usage and example `curl` commands.

## Phase 6: Video Endpoint And Bug Fixes

- [x] Task: Fix existing video route error handling.
  - [x] Separate request validation (400) from provider/response errors (500) in `app/api/generate-video/route.ts`.
  - [x] Update existing route test to expect 500 for response schema failures.
- [x] Task: Implement OpenAI-compatible video generation endpoint.
  - [x] Write failing tests for video adapter and route.
  - [x] Implement `src/lib/openai-compat/video.ts` wrapping `src/lib/generate-video.ts`.
  - [x] Implement `app/api/v1/video/generations/route.ts` with auth gate and OpenAI response shape.

## Phase 6: Video Endpoint And Bug Fixes

- [x] Task: Fix existing video route error handling.
  - [x] Separate request validation (400) from provider/response errors (500) in `app/api/generate-video/route.ts`.
  - [x] Update existing route test to expect 500 for response schema failures.
- [x] Task: Implement OpenAI-compatible video generation endpoint.
  - [x] Write failing tests for video adapter and route.
  - [x] Implement `src/lib/openai-compat/video.ts` wrapping `src/lib/generate-video.ts`.
  - [x] Implement `app/api/v1/video/generations/route.ts` with auth gate and OpenAI response shape.
