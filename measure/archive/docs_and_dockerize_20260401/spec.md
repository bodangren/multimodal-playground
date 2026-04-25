# Track: API Documentation and Podman Containerization

## Problem

The project has no README.md, so external consumers (local tools, game projects, trusted internal projects) have no instructions for connecting to the API. Additionally, there is no container configuration, making deployment and reproducible local setup harder.

## Goal

1. Create a README.md that documents all API endpoints with request/response examples so any client can connect.
2. Add a Dockerfile and Podman-compatible build/run instructions so the app can be containerized and deployed.

## Scope

- Write README.md with:
  - Project overview
  - Required environment variables (`OPENROUTER_API_KEY`)
  - All internal API routes (`/api/generate-text`, `/api/generate-image`, `/api/generate-speech`, `/api/transcribe`, `/api/generate-video`, `/api/generate-structured`) with request/response shapes
  - All OpenAI-compatible routes (`/api/v1/chat/completions`, `/api/v1/images/generations`, `/api/v1/audio/speech`, `/api/v1/audio/transcriptions`, `/api/v1/models`)
  - curl examples for each endpoint
  - Local development setup instructions
- Add `Dockerfile` (multi-stage, using `output: 'standalone'` from Next.js config)
- Add `.dockerignore`
- Add Podman-specific run instructions to README
- Update tracks registry

## Out of Scope

- Changing any API route logic
- Adding new endpoints
- CI/CD pipeline configuration
- Kubernetes or compose files

## Acceptance Criteria

1. README.md exists at project root with complete API documentation
2. Every internal endpoint has a curl example with request and response shape
3. Every OpenAI-compatible endpoint is documented with its OpenAI-equivalent usage
4. Dockerfile builds successfully with `podman build`
5. Container runs with `podman run` on port 3030 with `OPENROUTER_API_KEY` env var
6. `.dockerignore` excludes unnecessary files (node_modules, .next, coverage, etc.)
7. Lint, typecheck, and tests still pass
