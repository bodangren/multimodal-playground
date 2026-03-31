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
| 2026-03-31 | multimodal_playground_mvp_20260330 | Speech generation (TTS) panel removed from UI — no OpenRouter TTS models available in the catalog. Types and route kept for re-enablement. | Low | Open | Re-add the Speech panel once OpenRouter exposes text→audio models. |
| 2026-03-30 | multimodal_playground_mvp_20260330 | Experimental AI SDK media APIs may change shape; pin versions tightly before production use. | Medium | Open | Protects the project from silent breaking changes in image, speech, transcription, and video helpers. |
