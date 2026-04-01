# Track: Fix Speech Backend and Re-enable UI

## Problem

The speech (text-to-speech) generation panel was removed because the backend was broken. Root causes:

1. **Wrong default speech model**: `src/lib/provider.ts` defaults to `alibaba/wan-2.6` (a video model), not a speech-capable model. Should use `openai/gpt-audio-mini`.
2. **No speech model catalog on server**: `app/page.tsx` does not fetch or pass `speechModelOptions` to the client.
3. **UI panel disabled**: `page-client.tsx` has the speech panel removed, with `_SpeechResponse` type suppressed.

The OpenRouter docs confirm audio output works via `modalities: ["text", "audio"]` with SSE streaming on `/chat/completions`, using models like `openai/gpt-4o-audio-preview`.

## Goal

Fix the speech backend so it actually works with OpenRouter, then re-add the speech generation panel to the playground UI so all six modalities (text, structured, image, speech, transcription, video) are accessible from the main page.

## Scope

- Fix default speech model ID in `src/lib/provider.ts`
- Verify `src/lib/generate-speech.ts` SSE streaming works with the correct model
- Add `speechModelOptions` to server-side props using existing `listOpenRouterSpeechGenerationModels()`
- Re-enable the speech panel in `page-client.tsx` with model selector, text input, and audio playback
- Remove the `_SpeechResponse` underscore prefix and suppression comment
- Update tech debt and lessons learned

## Out of Scope

- Rewriting the SSE streaming logic (structure is correct, just needs the right model)
- Changing the OpenAI-compatible `/v1/audio/speech` endpoint
- Adding new voices or formats beyond what the current helper supports

## Acceptance Criteria

1. Default speech model is a valid OpenRouter audio-output model (e.g., `openai/gpt-4o-audio-preview`)
2. `generateSpeechFromText` tests pass with the corrected model
3. Playground page loads with a "Speech generation" panel between Image and Transcription
4. Model selector populates from OpenRouter catalog filtered for audio-output capability
5. Submitting text produces playable audio in the browser via `<audio>` element
6. Errors display with the same styling as other panels
7. Existing panels and routes remain unaffected
8. Tests pass (lint, typecheck, speech tests)
