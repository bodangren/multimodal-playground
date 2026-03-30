# Tech Debt Registry

> This file is curated working memory, not an append-only log. Keep it at or below **50 lines**.
> Remove or summarize resolved items when they no longer need to influence near-term planning.
>
> **Severity:** `Critical` | `High` | `Medium` | `Low`
> **Status:** `Open` | `Resolved`

| Date | Track | Item | Severity | Status | Notes |
|------|-------|------|----------|--------|-------|
| 2026-03-30 | multimodal_playground_mvp_20260330 | OpenRouter does not expose speech, transcription, or video model methods in this SDK, so the MVP uses OpenAI for audio and Google for video behind the shared provider boundary. | Medium | Open | Keep the fallback provider boundary isolated and revisit if OpenRouter adds first-class audio/video surfaces. |
| 2026-03-30 | multimodal_playground_mvp_20260330 | Experimental AI SDK media APIs may change shape; pin versions tightly before production use. | Medium | Open | Protects the project from silent breaking changes in image, speech, transcription, and video helpers. |
