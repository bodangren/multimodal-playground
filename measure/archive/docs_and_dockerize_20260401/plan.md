# Implementation Plan: API Documentation and Podman Containerization

## Phase 1: Document Internal API Endpoints

- [x] Task: Document `/api/generate-text` endpoint.
  - Document POST request with `prompt` and optional `modelId`
  - Include curl example and response shape
- [x] Task: Document `/api/generate-image` endpoint.
  - Document POST request with `prompt` and optional `modelId`
  - Include curl example and response shape
- [x] Task: Document `/api/generate-speech` endpoint.
  - Document POST request with `text`, optional `voice` and `modelId`
  - Include curl example and response shape
- [x] Task: Document `/api/transcribe` endpoint.
  - Document POST request with multipart `audio` file and optional `modelId`
  - Include curl example and response shape
- [x] Task: Document `/api/generate-video` endpoint.
  - Document POST request with `prompt` and optional `modelId`
  - Include curl example and response shape
- [x] Task: Document `/api/generate-structured` endpoint.
  - Document POST request with `prompt`, `schema`, and optional `modelId`
  - Include curl example and response shape

## Phase 2: Document OpenAI-Compatible Endpoints

- [x] Task: Document `/api/v1/chat/completions` endpoint.
  - Document POST request with `model`, `messages`, optional `stream`, `response_format`
  - Include curl example with Bearer token auth
  - Note: streaming returns 501 (not yet supported)
- [x] Task: Document `/api/v1/images/generations` endpoint.
  - Document POST request with `model`, `prompt`, optional `n`, `size`
  - Include curl example with Bearer token auth
- [x] Task: Document `/api/v1/audio/speech` endpoint.
  - Document POST request with `model`, `input`, `voice`, optional `format`
  - Include curl example with Bearer token auth
- [x] Task: Document `/api/v1/audio/transcriptions` endpoint.
  - Document POST request with multipart `file` and optional `model`, `response_format`
  - Include curl example with Bearer token auth
- [x] Task: Document `/api/v1/models` endpoint.
  - Document GET request for listing available models
  - Include curl example with Bearer token auth

## Phase 3: Docker/Podman Configuration

- [x] Task: Create `.dockerignore` file.
  - Exclude node_modules, .next, coverage, output, dist, .env.local, *.log, *.tsbuildinfo
- [x] Task: Create `Dockerfile` (multi-stage build).
  - Stage 1: Install dependencies with pnpm
  - Stage 2: Build Next.js standalone output
  - Stage 3: Run minimal Node.js image with standalone output
  - Expose port 3030
- [x] Task: Add Podman build and run instructions to README.
  - `podman build -t ai-image-generator .`
  - `podman run -p 3030:3030 -e OPENROUTER_API_KEY=your-key ai-image-generator`

## Phase 4: Write Complete README.md

- [x] Task: Write README.md with all sections.
  - Project overview and goals
  - Quick start (local dev with pnpm)
  - Environment variables
  - API reference (internal endpoints + OpenAI-compatible endpoints)
  - Container deployment (Podman instructions)
  - Testing commands

## Phase 5: Verification

- [x] Task: Run lint, typecheck, and tests.
- [x] Task: Update tracks registry.
