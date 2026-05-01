# Spec: Persistent Asset Storage & Gallery

## Problem

The ai-image-generator currently returns all generated media (images, speech, video) as base64 data URLs embedded directly in JSON API responses. This approach:

1. Bloats response payloads — especially for video and high-resolution images.
2. Prevents reuse — callers must re-generate assets every time; there is no stable URL or ID to reference.
3. Breaks the "backend gateway" product goal — local game projects and internal tools need persistent asset references, not ephemeral base64 blobs.
4. Wastes bandwidth and provider quota on repeated identical prompts.

## Goals

1. Store generated media in a persistent object store with stable, retrievable URLs.
2. Return lightweight metadata responses from generation routes instead of inline base64.
3. Provide a gallery UI for browsing, previewing, and downloading past assets.
4. Tag assets with metadata (modality, prompt, model, timestamp) for discoverability.
5. Keep a filesystem adapter for local development and an S3-compatible adapter for production/Vercel.

## Non-Goals

- Full digital asset management (DAM) with folders, collections, or ACLs.
- CDN edge caching configuration.
- Image/video transcoding or thumbnail generation.
- User-level isolation or multi-tenant access control.

## Approach

- Introduce a `StorageAdapter` interface with two implementations:
  - `LocalFilesystemAdapter` — writes to `output/assets/` for local dev.
  - `S3CompatibleAdapter` — uses the S3 API (AWS S3, Cloudflare R2, MinIO, etc.) for production.
- Configuration via environment variables (`STORAGE_PROVIDER`, `STORAGE_BUCKET`, `STORAGE_ENDPOINT`, etc.).
- After generation, routes write the media blob to storage and return a `StoredAsset` shape containing `id`, `url`, `modality`, `prompt`, `modelId`, and `createdAt`.
- Add `GET /api/assets` and `GET /api/assets/:id` for listing and retrieving asset metadata.
- Add `GET /api/assets/:id/download` to proxy or redirect to the stored blob.
- Add a `/gallery` page in the playground UI with modality filters and date sorting.

## Success Criteria

- Image, speech, and video generation routes return `StoredAsset` metadata instead of base64 data URLs.
- Generated files are retrievable via a stable URL or ID after the response is sent.
- The gallery page can list, filter by modality, and preview stored assets.
- Local dev works without external cloud dependencies (filesystem adapter).
- All existing tests pass; new storage layer has unit and integration tests.
