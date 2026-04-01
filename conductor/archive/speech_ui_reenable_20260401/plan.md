# Implementation Plan: Fix Speech Backend and Re-enable UI

## Phase 1: Fix Default Speech Model

- [x] Task: Fix default speech model ID in provider.
  - [x] Write failing test that verifies default speech model is audio-capable (not a video model).
  - [x] Change `DEFAULT_SPEECH_MODEL_ID` in `src/lib/provider.ts` from `alibaba/wan-2.6` (video) to `openai/gpt-audio-mini`.
  - [x] Run existing `generate-speech.test.ts` to confirm SSE streaming tests still pass.

## Phase 2: Server-Side Model Catalog for Speech

- [x] Task: Add speech model options to page server props.
  - [x] Import `listOpenRouterSpeechGenerationModels` in `app/page.tsx`.
  - [x] Fetch speech models alongside existing catalog calls.
  - [x] Pass `speechModelOptions` to `PlaygroundClient`.

## Phase 3: Speech Panel in Playground UI

- [x] Task: Re-enable speech panel in `page-client.tsx`.
  - [x] Accept `speechModelOptions` in `PlaygroundClientProps`.
  - [x] Add speech state hooks (text input, model selector, result, error, loading).
  - [x] Add speech submit handler calling `/api/generate-speech`.
  - [x] Render speech panel with `<audio controls>` for playback.
  - [x] Remove `_SpeechResponse` underscore prefix and suppression comment.

## Phase 4: Cleanup and Verification

- [x] Task: Run lint, typecheck, and all tests.
- [x] Task: Update tech debt — close speech-related open items.
- [x] Task: Update lessons learned with speech fix notes.
