# Specification

## Overview

Implement a multimodal AI playground using Vercel AI SDK v6. The application must be modular, server-side first, and deployed on Vercel. It should prefer OpenRouter through `@openrouter/ai-sdk-provider` where that path supports the target modality cleanly, while allowing fallback provider packages for unsupported or awkward modalities.

## Tech Constraints

- TypeScript.
- Next.js App Router.
- `ai` (AI SDK v6).
- `zod`.
- `@openrouter/ai-sdk-provider`.
- Additional provider packages are allowed only when OpenRouter does not expose the required modality cleanly.

## Environment Requirements

- `OPENROUTER_API_KEY` is required for the initial implementation.
- Secrets must remain server-side only.
- Browser code may call internal API routes only.

## Functional Requirements

### FR-1 Shared Provider Initialization

The system must centralize provider initialization in `src/lib/provider.ts`.

- Initialize OpenRouter once.
- Expose provider/model helper functions.
- Keep secret handling and provider selection out of API route files.

### FR-2 Text Generation

The system must support freeform text generation.

- Use `generateText()`.
- Expose a dedicated helper at `src/lib/generate-text.ts`.
- Expose a route at `app/api/generate-text/route.ts`.
- Expose a local verification script at `scripts/test-text.ts`.

### FR-3 Structured Output With Zod

The system must support structured generation validated with Zod.

- Prefer `generateText()` with the `output` property.
- Do not use deprecated `generateObject()` as the default implementation path.
- Include at least one reusable schema in `src/lib/schemas/product.ts`.
- Expose a dedicated helper at `src/lib/generate-structured.ts`.
- Expose a route at `app/api/generate-structured/route.ts`.
- Expose a local verification script at `scripts/test-structured.ts`.

### FR-4 Image Generation

The system must support image generation.

- Use `experimental_generateImage` through a local helper wrapper.
- Start with `n = 1`, `aspectRatio = '16:9'`, and `seed = 42`.
- Do not assume `size` or multi-image support unless verified.
- Support OpenRouter image-model discovery.
- Expose `src/lib/generate-image.ts`, `app/api/generate-image/route.ts`, `scripts/test-image.ts`, and `scripts/list-openrouter-image-models.ts`.

### FR-5 Speech Generation

The system must support text-to-speech generation.

- Use `experimental_generateSpeech` through a local helper wrapper.
- Support text input and a selected voice.
- Return normalized audio metadata and payload.
- Expose `src/lib/generate-speech.ts`, `app/api/generate-speech/route.ts`, and `scripts/test-speech.ts`.

### FR-6 Audio Transcription

The system must support speech-to-text transcription.

- Use `experimental_transcribe` through a local helper wrapper.
- Accept audio as a `Buffer` or uploaded file.
- Validate file presence and media type.
- Return transcript text and metadata when available.
- Expose `src/lib/transcribe-audio.ts`, `app/api/transcribe/route.ts`, and `scripts/test-transcribe.ts`.

### FR-7 Video Generation

The system must support prompt-based video generation.

- Use `experimental_generateVideo` through a local helper wrapper.
- Normalize the first returned video item into a stable route-level response shape.
- Save or surface the first result in a local verification script.
- Expose `src/lib/generate-video.ts`, `app/api/generate-video/route.ts`, and `scripts/test-video.ts`.
- If OpenRouter does not support a viable video path, the implementation may use a fallback provider package behind the same helper boundary.

### FR-8 Internal Testing UI

The system must provide a simple internal page at `app/page.tsx`.

- Include one form per modality.
- Include one submit button per modality.
- Render the returned result below each form.
- Render structured data as formatted JSON.
- Render images using data URLs.
- Render speech with an audio player.
- Render video with a video element or returned URL.

### FR-9 Error Handling

The system must normalize errors for API callers.

- Every route returns `{ "error": "message" }` on failure.
- Explicitly handle:
  - missing API key
  - empty prompt or text
  - empty uploaded audio
  - invalid schema selection
  - missing generated image, audio, transcription text, or video
  - unsupported model capability
  - provider or network failure

### FR-10 Capability Detection

The system must not assume all modalities are equally supported by the same provider or model.

- Treat text and structured output as the baseline.
- Verify image-capable models before defaulting to them.
- Verify speech, transcription, and video result shapes at runtime.
- Fail clearly when a modality is unsupported.

## File Deliverables

- `src/lib/provider.ts`
- `src/lib/generate-text.ts`
- `src/lib/generate-structured.ts`
- `src/lib/generate-image.ts`
- `src/lib/generate-speech.ts`
- `src/lib/transcribe-audio.ts`
- `src/lib/generate-video.ts`
- `src/lib/schemas/product.ts`
- `scripts/test-text.ts`
- `scripts/test-structured.ts`
- `scripts/test-image.ts`
- `scripts/test-speech.ts`
- `scripts/test-transcribe.ts`
- `scripts/test-video.ts`
- `scripts/list-openrouter-image-models.ts`
- `app/api/generate-text/route.ts`
- `app/api/generate-structured/route.ts`
- `app/api/generate-image/route.ts`
- `app/api/generate-speech/route.ts`
- `app/api/transcribe/route.ts`
- `app/api/generate-video/route.ts`
- `app/page.tsx`

## Non-Functional Requirements

- Compatible with Vercel deployment.
- Type-safe and validated at request boundaries.
- Clear server-only secret handling.
- Modular helpers by modality.
- Local scripts must run independently.

## Completion Criteria

1. `scripts/test-text.ts` prints valid text.
2. `scripts/test-structured.ts` prints a valid schema-conformant object.
3. `scripts/test-image.ts` saves a real image file.
4. `scripts/test-speech.ts` saves a real audio file.
5. `scripts/test-transcribe.ts` returns transcript text.
6. `scripts/test-video.ts` returns a usable video result.
7. Every API route returns normalized JSON or normalized media metadata.
8. The demo page can exercise each modality manually.

## Out Of Scope

- Streaming UI.
- Agentic tool calling.
- Image editing with masks or file attachments.
- Multi-image batching as a default behavior.
- Auth, persistence, or billing.
- Production storage for large media files.
