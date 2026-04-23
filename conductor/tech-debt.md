# Tech Debt Registry

> This file is curated working memory, not an append-only log. Keep it at or below **50 lines**.
> Remove or summarize resolved items when they no longer need to influence near-term planning.
>
> **Severity:** `Critical` | `High` | `Medium` | `Low`
> **Status:** `Open` | `Resolved`

| Date | Track | Item | Severity | Status | Notes |
|------|-------|------|----------|--------|-------|
| 2026-03-31 | multimodal_playground_mvp_20260330 | OpenRouter video generation now uses direct `/chat/completions` with `modalities: ["video"]`. The API contract is still experimental. | Low | Resolved | Removed Google/Veo fallback; video runs through OpenRouter like other modalities. |
| 2026-03-31 | multimodal_playground_mvp_20260330 | The current `@openrouter/ai-sdk-provider` image helper requests mixed `image` plus `text` output, which excludes many text-to-image models from the public OpenRouter catalog; the app now uses a direct OpenRouter image request path for this modality. | Medium | Open | Revisit if the provider adds a way to request image-only outputs without bypassing the SDK helper. |
| 2026-03-31 | multimodal_playground_mvp_20260330 | The OpenRouter AI SDK provider does not expose `.video()`, `.speech()`, or `.transcription()` helpers. Speech, transcription, and video use direct `/chat/completions` requests. | Medium | Open | Revisit if the provider adds first-class audio/video surfaces. |
| 2026-03-31 | multimodal_playground_mvp_20260330 | Speech generation (TTS) panel removed from UI — no OpenRouter TTS models available in the catalog. Types and route kept for re-enablement. | Low | Resolved | Speech panel re-enabled; uses `openai/gpt-audio-mini` with `pcm16` streaming wrapped in WAV. |
| 2026-03-30 | multimodal_playground_mvp_20260330 | Experimental AI SDK media APIs may change shape; pin versions tightly before production use. | Medium | Open | Protects the project from silent breaking changes in image, speech, transcription, and video helpers. |
| 2026-04-12 | single_api_key_env_20260407 | `getOpenAIProvider()`, `getSpeechModel()`, `getTranscriptionModel()` are dead code - never called in production. Only `getOpenAIApiKey()` is used (via fallback). | Low | Open | Consider removing OpenAI provider dead code in a cleanup chore. |
| 2026-04-12 | single_api_key_env_20260407 | `app/page.test.tsx` fails due to pre-existing mock setup issue | Low | Resolved | Missing fetch mock for `listOpenRouterSpeechGenerationModels()`; fixed by switching to URL-aware `mockImplementation` |
| 2026-04-17 | job_queue_retry_20260407 | JobQueue is in-memory only (Map-based); jobs are lost on server restart. Suitable for dev/demo only. | Medium | Open | For production, consider Redis or similar persistent queue. |
| 2026-04-23 | provider_failover_20260423 | CircuitBreaker uses JSON file persistence which may not work in serverless environments (Vercel, etc.). State is lost on cold start in those environments. | Medium | Open | For serverless, consider Redis or similar distributed state store. |
| 2026-04-23 | provider_failover_20260423 | FallbackChain uses in-memory HealthWindow instances; per-provider health state is not shared across serverless instances. | Medium | Open | For distributed fallback, health tracking needs a shared store (Redis, etc.). |
| 2026-04-23 | provider_failover_20260423 | `FallbackChain.execute()` infinite loop when all providers have open circuits — the `attempts` counter never increments for skipped providers. | High | Open | Add cycle detection or increment attempts when skipping circuit-open providers. |
| 2026-04-23 | provider_failover_20260423 | Duplicate error classification logic in `queue/types.ts` (`isRetryableError`, `classifyError`, `RETRYABLE_STATUS_CODES`) overlaps with `provider/error-classifier.ts`. | Low | Open | Consolidate into `provider/error-classifier.ts` and remove duplication from queue types. |
