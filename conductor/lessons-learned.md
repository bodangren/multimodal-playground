# Lessons Learned

> This file is curated working memory, not an append-only log. Keep it at or below **50 lines**.
> Remove or condense entries that are no longer relevant to near-term planning.

## Architecture & Design

- (2026-03-30, multimodal_playground_mvp_20260330) Keep provider initialization centralized so modality helpers do not each re-handle secrets and model configuration.
- (2026-03-30, multimodal_playground_mvp_20260330) Treat text and structured output as the stable baseline; plan media modalities behind capability checks because the SDK surfaces are experimental.

## Recurring Gotchas

- (2026-03-30, multimodal_playground_mvp_20260330) Do not build new structured-output flows around deprecated `generateObject()` when the current docs recommend `generateText()` with `output`.
- (2026-03-30, multimodal_playground_mvp_20260330) Provider support varies by modality; a package that works for text may not cleanly support image, speech, transcription, or video.
- (2026-03-30, multimodal_playground_mvp_20260330) OpenRouter image support should come from catalog filtering on output modalities, not from the text default model assumption.
- (2026-03-31, multimodal_playground_mvp_20260330) OpenRouter image-model discovery should match text input plus image output, and image-only models require `modalities: ["image"]` instead of the AI SDK adapter's mixed image-plus-text request shape.
- (2026-03-31, multimodal_playground_mvp_20260330) OpenRouter speech output and audio transcription should use `/chat/completions` directly: speech output requires SSE with `modalities: ["text", "audio"]`, while transcription uses `input_audio` content on a non-streaming request.

## Patterns That Worked Well

- (2026-03-30, multimodal_playground_mvp_20260330) Documentation-first setup clarified modality boundaries before any framework code or provider SDK decisions.
- (2026-03-30, multimodal_playground_mvp_20260330) Keeping one helper and one route per modality makes verification scripts and UI sections line up cleanly.

## Planning Improvements

- (2026-03-30, multimodal_playground_mvp_20260330) Split baseline text/structured work from experimental media work so provider gaps do not block the entire MVP.
