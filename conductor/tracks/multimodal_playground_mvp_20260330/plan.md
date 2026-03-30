# Implementation Plan

## Phase 1: Foundation, Schemas, And Provider Setup

- [x] Task: Scaffold the application foundation and shared provider module.
  - [x] Write failing tests for missing `OPENROUTER_API_KEY` handling and server-only provider initialization.
  - [x] Implement `src/lib/provider.ts` with centralized OpenRouter setup and helper exports.
  - [x] Add base project structure for `src/lib`, `scripts`, `app/api`, `output`, and `fixtures`.
- [x] Task: Implement reusable schemas and structured-output primitives.
  - [x] Write failing tests for `ProductSchema`, invalid schema selection, and normalized `{ error: string }` failures.
  - [x] Implement `src/lib/schemas/product.ts` and shared route-level validation helpers.
  - [x] Implement `src/lib/generate-structured.ts` using `generateText()` with `output`.
- [x] Task: Implement baseline text generation.
  - [x] Write failing tests for valid text prompts, empty prompt failures, and provider error normalization.
  - [x] Implement `src/lib/generate-text.ts`, `app/api/generate-text/route.ts`, and `scripts/test-text.ts`.
  - [x] Verify the text helper logs warnings and provider metadata when available.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation, Schemas, And Provider Setup' (Protocol in workflow.md)

## Phase 2: Structured Output And Image Generation

- [x] Task: Complete structured-output route wiring and verification. (65478ae)
  - [x] Write failing route tests for `POST /api/generate-structured` with the `product` schema.
  - [x] Implement `app/api/generate-structured/route.ts` and `scripts/test-structured.ts`.
  - [x] Validate returned objects against Zod before responding.
- [x] Task: Implement image-model discovery and capability checks. (c5a1667)
  - [x] Write failing tests for image-model listing, default-model fallback selection, and unsupported-image-model failures.
  - [x] Implement `scripts/list-openrouter-image-models.ts` and the image model selection helper.
  - [x] Record any provider capability gaps in `tech-debt.md` instead of hiding them in code.
- [x] Task: Implement image generation. (ca8a59a)
  - [x] Write failing tests for prompt validation, normalized image payload shape, and missing-image failures.
  - [x] Implement `src/lib/generate-image.ts`, `app/api/generate-image/route.ts`, and `scripts/test-image.ts`.
  - [x] Start with `n = 1`, `aspectRatio = '16:9'`, and `seed = 42` without assuming `size` support.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Structured Output And Image Generation' (Protocol in workflow.md)

## Phase 3: Speech And Transcription

- [ ] Task: Implement speech generation.
  - [ ] Write failing tests for empty text, voice selection, normalized audio payloads, and missing-audio failures.
  - [ ] Implement `src/lib/generate-speech.ts`, `app/api/generate-speech/route.ts`, and `scripts/test-speech.ts`.
  - [ ] Save generated speech output to `output/` during local verification.
- [ ] Task: Implement audio transcription.
  - [ ] Write failing tests for missing audio, invalid media type, normalized transcript responses, and missing-text failures.
  - [ ] Implement `src/lib/transcribe-audio.ts`, `app/api/transcribe/route.ts`, and `scripts/test-transcribe.ts`.
  - [ ] Add a fixture audio file contract for `fixtures/sample-audio.mp3`.
- [ ] Task: Harden media capability detection for audio paths.
  - [ ] Write failing tests for unsupported speech or transcription model combinations.
  - [ ] Implement clear runtime capability checks and error messages for unsupported modalities.
  - [ ] Introduce fallback provider wiring only if OpenRouter fails cleanly verified speech or transcription needs.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Speech And Transcription' (Protocol in workflow.md)

## Phase 4: Video, UI, And Final Verification

- [ ] Task: Implement video generation.
  - [ ] Write failing tests for prompt validation, normalized first-video response shape, and missing-video failures.
  - [ ] Implement `src/lib/generate-video.ts`, `app/api/generate-video/route.ts`, and `scripts/test-video.ts`.
  - [ ] Use a fallback provider adapter if OpenRouter does not expose a viable video path.
- [ ] Task: Build the internal multimodal testing page.
  - [ ] Write failing component or route interaction tests for one form per modality and result rendering.
  - [ ] Implement `app/page.tsx` with sections for text, structured, image, speech, transcription, and video.
  - [ ] Render images, audio, video, and formatted JSON using normalized route outputs.
- [ ] Task: Run final verification and document operator usage.
  - [ ] Execute lint, typecheck, route tests, and all modality verification scripts.
  - [ ] Document `.env.local`, script usage, route payloads, and any provider-specific caveats.
  - [ ] Capture unresolved experimental-API risks in `tech-debt.md`.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Video, UI, And Final Verification' (Protocol in workflow.md)
