# Lessons Learned

> This file is curated working memory, not an append-only log. Keep it at or below **50 lines**.
> Remove or condense entries that are no longer relevant to near-term planning.

## Architecture & Design

- (2026-03-30, multimodal_playground_mvp_20260330) Keep provider initialization centralized so modality helpers do not each re-handle secrets and model configuration.
- (2026-03-30, multimodal_playground_mvp_20260330) Treat text and structured output as the stable baseline; plan media modalities behind capability checks because the SDK surfaces are experimental.
- (2026-04-12, single_api_key_env_20260407) OpenAI provider (getOpenAIProvider) and its API key are not used in production code - all actual API calls go through OpenRouter. This is dead code that could be cleaned up in a future chore.
- (2026-04-16, job_queue_retry_20260407) Job queue retry semantics: maxAttempts=N means N total attempts (1 initial + N-1 retries). The retry() check is `(retryCount ?? 0) >= maxAttempts - 1` before incrementing.

## Recurring Gotchas

- (2026-03-30, multimodal_playground_mvp_20260330) Do not build new structured-output flows around deprecated `generateObject()` when the current docs recommend `generateText()` with `output`.
- (2026-03-30, multimodal_playground_mvp_20260330) Provider support varies by modality; a package that works for text may not cleanly support image, speech, transcription, or video.
- (2026-03-31, multimodal_playground_mvp_20260330) OpenRouter image-model discovery should match text input plus image output, and image-only models require `modalities: ["image"]`.
- (2026-04-01, speech_ui_reenable_20260401) OpenAI audio output via SSE streaming only supports `pcm16` format — `mp3` and `wav` are rejected when `stream: true`. Wrap pcm16 bytes in a WAV container.
- (2026-04-12, single_api_key_env_20260407) The page.test.tsx has a pre-existing failure - model catalog API returns "Cannot read properties of undefined (reading 'ok')".
- (2026-04-16, job_queue_retry_20260407) When implementing queue state machines, ensure retry() sets state to Queued (not Retrying) so dequeue() can pick it up. Retrying state is only for tracking.
- (2026-04-17, job_queue_retry_20260407) Zod v4 `z.record()` requires both key and value schemas: `z.record(z.string(), z.unknown())`.
- (2026-04-23, provider_failover_20260423) Fire-and-forget async saves need a `waitForPendingSave()` method for proper test synchronization.
- (2026-04-23, provider_failover_20260423) `vi.useFakeTimers()` breaks async file I/O; use in-memory persistence for persistence tests with fake timers.
- (2026-04-23, provider_failover_20260423) Error classification: 429 is classified as RateLimited (not Retryable). `isRetryable()` checks if retry-after delay is known. Retryable errors (500/502/503/504) can retry immediately with backoff.

## Patterns That Worked Well

- (2026-03-30, multimodal_playground_mvp_20260330) Documentation-first setup clarified modality boundaries before any framework code or provider SDK decisions.
- (2026-03-30, multimodal_playground_mvp_20260330) Keeping one helper and one route per modality makes verification scripts and UI sections line up cleanly.

## Planning Improvements

- (2026-03-30, multimodal_playground_mvp_20260330) Split baseline text/structured work from experimental media work so provider gaps do not block the entire MVP.
- (2026-04-12, single_api_key_env_20260407) Before implementing multi-key support, verify which providers/keys are actually used in production vs dead code.
