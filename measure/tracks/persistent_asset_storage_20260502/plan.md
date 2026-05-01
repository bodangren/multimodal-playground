# Implementation Plan: Persistent Asset Storage & Gallery

## Phase 1: Storage Adapter Abstraction

- [ ] Task: Define `StorageAdapter` interface (`store`, `retrieve`, `delete`, `list`) with typed options.
  - [ ] Write unit tests asserting interface contracts.
  - [ ] Add Zod schemas for storage configuration.
- [ ] Task: Implement `LocalFilesystemAdapter`.
  - [ ] Write tests for store/retrieve/delete/list operations.
  - [ ] Handle directory creation and safe path validation.
  - [ ] Write tests for edge cases (missing files, invalid paths).
- [ ] Task: Implement `S3CompatibleAdapter`.
  - [ ] Write tests using mocked S3 client (do not call real services in unit tests).
  - [ ] Handle presigned URL generation for retrieval.
- [ ] Task: Create storage factory and environment configuration loader.
  - [ ] Write tests for config validation and factory dispatch.
- [ ] Task: Measure — User Manual Verification 'Phase 1: Storage Adapter Abstraction'

## Phase 2: Asset Repository & Metadata Layer

- [ ] Task: Define `AssetRecord` schema and SQLite table (`assets` — id, modality, prompt, modelId, storageKey, url, createdAt, metadata JSON).
  - [ ] Write migration script.
  - [ ] Add composite index on `(modality, createdAt)`.
- [ ] Task: Implement `AssetRepository` with insert, getById, list, and delete methods.
  - [ ] Write unit tests for all CRUD operations.
  - [ ] Write tests for list filtering by modality and date range.
- [ ] Task: Implement `AssetService` that orchestrates storage adapter + repository.
  - [ ] Write tests for the full store flow: save blob → record metadata → return `StoredAsset`.
  - [ ] Write tests for retrieval and deletion.
- [ ] Task: Measure — User Manual Verification 'Phase 2: Asset Repository & Metadata Layer'

## Phase 3: Update Generation Routes

- [ ] Task: Refactor `POST /api/generate-image` to use `AssetService`.
  - [ ] Write integration tests verifying response shape (`StoredAsset`, not `imageDataUrl`).
  - [ ] Ensure base64 payload is stored and a retrievable URL/ID is returned.
- [ ] Task: Refactor `POST /api/generate-speech` to use `AssetService`.
  - [ ] Write integration tests for new response shape.
- [ ] Task: Refactor `POST /api/generate-video` to use `AssetService`.
  - [ ] Write integration tests for new response shape.
- [ ] Task: Add backward-compat flag (`?inline=true`) for callers that still need data URLs during migration.
  - [ ] Write tests for both inline and stored response modes.
- [ ] Task: Measure — User Manual Verification 'Phase 3: Update Generation Routes'

## Phase 4: Asset API & Gallery UI

- [ ] Task: Implement `GET /api/assets` with query params (`modality`, `from`, `to`, `limit`, `offset`).
  - [ ] Write tests for filtering, pagination, and response shape.
- [ ] Task: Implement `GET /api/assets/:id` for single asset metadata.
  - [ ] Write tests for found and not-found cases.
- [ ] Task: Implement `GET /api/assets/:id/download` — redirect to presigned URL or proxy filesystem blob.
  - [ ] Write tests for download behavior per adapter.
- [ ] Task: Build `/gallery` page in the playground UI.
  - [ ] Component tests for filter controls, asset cards, and empty states.
  - [ ] Manual verification: generate assets and confirm they appear in the gallery.
- [ ] Task: Measure — User Manual Verification 'Phase 4: Asset API & Gallery UI'

## Phase 5: Cleanup & Documentation

- [ ] Task: Remove dead base64 response helpers if no longer used.
  - [ ] Update or remove outdated route tests.
- [ ] Task: Add `.env.example` entries for all new storage configuration variables.
- [ ] Task: Document the storage adapter interface and how to add new backends.
- [ ] Task: Run full test suite and verify no regressions.
