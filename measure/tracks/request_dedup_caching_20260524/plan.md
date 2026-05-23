# Implementation Plan: Request Deduplication & Result Caching

## Phase 1: Cache Key & Normalization (TDD)

- [ ] Task: Define `CacheKeyInput` schema and `computeCacheKey()` helper.
  - [ ] Write unit tests for deterministic hashing of identical inputs.
  - [ ] Write tests for parameter normalization (whitespace, key ordering).
  - [ ] Implement `computeCacheKey` with SHA-256.
- [ ] Task: Add `cacheKey` column to `AssetRecord` schema and SQLite migration.
  - [ ] Write migration test.
  - [ ] Run migration and verify schema.
- [ ] Task: Update `AssetRepository` with `findByCacheKey(cacheKey, modality, maxAge)`.
  - [ ] Write tests for cache hit (within TTL) and miss (expired / not found).
  - [ ] Implement query with `createdAt > NOW - TTL` filter.
- [ ] Task: Measure — User Manual Verification 'Phase 1: Cache Key & Normalization'

## Phase 2: In-Flight Deduplication (TDD)

- [ ] Task: Define `InFlightDeduplicator` class with `Map<cacheKey, Promise<StoredAsset>>`.
  - [ ] Write tests for concurrent identical requests sharing one promise.
  - [ ] Write tests for cleanup after promise settles (success and error).
  - [ ] Implement deduplicator with automatic entry removal on settle.
- [ ] Task: Integrate deduplicator into generation flow for `/api/generate-image`.
  - [ ] Write integration tests: two simultaneous identical requests → one provider call.
  - [ ] Wire deduplicator before job enqueue.
- [ ] Task: Repeat integration for `/api/generate-speech` and `/api/generate-video`.
  - [ ] Write integration tests per modality.
- [ ] Task: Measure — User Manual Verification 'Phase 2: In-Flight Deduplication'

## Phase 3: Result Caching & TTL (TDD)

- [ ] Task: Implement `ResultCache` service wrapping `AssetRepository` lookup.
  - [ ] Write tests for cache hit (asset returned, no job created).
  - [ ] Write tests for cache miss (job enqueued normally).
  - [ ] Write tests for TTL expiry (old asset ignored, new job created).
- [ ] Task: Add per-modality TTL configuration via environment variables.
  - [ ] Write tests for config parsing and defaults.
  - [ ] Update `.env.example`.
- [ ] Task: Wire `ResultCache` into all generation routes.
  - [ ] Write end-to-end tests for each route: first request misses, second hits.
- [ ] Task: Measure — User Manual Verification 'Phase 3: Result Caching & TTL'

## Phase 4: Cache Management API & Metrics (TDD)

- [ ] Task: Implement `POST /api/cache/purge` with optional modality filter.
  - [ ] Write tests for purge all, purge by modality, and unauthorized access.
- [ ] Task: Implement `GET /api/cache/stats` returning hit/miss counts and cache size.
  - [ ] Write tests for stats accuracy.
- [ ] Task: Emit cache hit/miss events to usage analytics pipeline.
  - [ ] Write tests verifying analytics events include `cacheHit` boolean.
- [ ] Task: Measure — User Manual Verification 'Phase 4: Cache Management API & Metrics'

## Phase 5: LRU Eviction & Limits (TDD)

- [ ] Task: Add `MAX_CACHE_ENTRIES` config and LRU eviction in `AssetRepository`.
  - [ ] Write tests for eviction ordering (oldest accessed evicted first).
  - [ ] Write tests for max entries enforcement.
- [ ] Task: Add `lastAccessedAt` column to assets table for LRU tracking.
  - [ ] Write migration test.
- [ ] Task: Run full test suite, verify no regressions.
- [ ] Task: Update API documentation with cache behavior and purge endpoints.
- [ ] Task: Measure — User Manual Verification 'Phase 5: LRU Eviction & Limits'
