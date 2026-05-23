# Spec: Request Deduplication & Result Caching

## Problem

The ai-image-generator wastes provider quota and latency on repeated identical generation requests. Local game projects and internal tools may re-request the same asset (same modality, prompt, model, and parameters) multiple times during development or across different consumers. Without deduplication:

1. Provider API costs grow linearly with redundant requests.
2. Latency is unchanged for repeated prompts — there is no cache hit path.
3. Rate limits are consumed faster than necessary, increasing failure risk.
4. The gateway does not behave like a cost-efficient backend service.

## Goals

1. Deduplicate in-flight generation requests so that identical concurrent requests share a single provider call.
2. Cache successful generation results keyed by a deterministic hash of (modality, prompt, modelId, parameters).
3. Return cached assets immediately on cache hit, skipping provider round-trips entirely.
4. Integrate with the existing `AssetService` / `AssetRepository` so cached results are persistent and retrievable via the gallery.
5. Provide cache invalidation controls (TTL, manual purge, max cache size).

## Non-Goals

- Semantic deduplication (near-matching prompts).
- Distributed caching across multiple serverless instances.
- Cache warming or pre-generation.
- Multi-tier caching (CDN, edge, etc.).

## Approach

- Introduce a `GenerationCache` service layer that sits between route handlers and the job queue / provider callers.
- Cache key: SHA-256 of normalized JSON containing `{ modality, prompt, modelId, params }`.
- In-flight dedup: maintain an in-memory `Map<cacheKey, Promise<StoredAsset>>` so concurrent identical requests await the same promise.
- Result cache: query `AssetRepository` by `cacheKey` before enqueueing a new job. Store `cacheKey` on the `AssetRecord` when saving.
- TTL: configurable per modality via env var (`CACHE_TTL_IMAGE_SECONDS`, etc.). Default 24h for images, 7d for speech/video.
- Invalidation: `POST /api/cache/purge` for manual clearing; LRU eviction when max cache entries exceeded.

## Success Criteria

- Two identical concurrent requests result in a single provider call and both receive the same asset metadata.
- A repeated request after the first completes returns the cached asset in <50ms (no provider call).
- Cache hit/miss metrics are visible in usage analytics.
- All existing tests pass; new cache layer has 100% unit test coverage.
- No provider secrets or user data are cached in-memory longer than the request lifecycle.
