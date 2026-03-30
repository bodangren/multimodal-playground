# Tech Stack

## Architecture Summary

The project will be a Next.js App Router application deployed on Vercel. It will provide a small internal multimodal playground plus reusable server-side helpers and API routes for text, structured output, image generation, speech generation, transcription, and video generation. The architecture will prefer OpenRouter via `@openrouter/ai-sdk-provider` where that provider abstraction supports the target modality cleanly, and it will allow fallback provider packages for gaps.

## Runtime And Framework

- TypeScript in strict mode.
- Node.js 20+ for local development and Vercel-compatible Node runtime in deployment.
- Next.js App Router on Vercel for route handlers, server components, and the internal testing page.

## AI And Provider Layer

- `ai` (AI SDK v6) as the primary abstraction layer.
- `zod` for structured output schemas and request validation.
- `@openrouter/ai-sdk-provider` as the preferred provider package.
- Additional provider packages are allowed only when OpenRouter does not support a required modality or result shape cleanly.
- A shared `src/lib/provider.ts` module will centralize provider initialization and model selection helpers.

### Modality Rules

- Text and structured output are the baseline capabilities.
- Structured output must use `generateText()` with the `output` property rather than building new default code around deprecated `generateObject()`.
- Image generation, speech generation, transcription, and video generation are experimental AI SDK surfaces and must be treated as capability-dependent.
- OpenRouter model discovery should be used for image-capable models.
- Video should be planned as a likely fallback-provider path unless later verification shows a clean OpenRouter route.

## Internal API Surface

- `POST /api/generate-text`
- `POST /api/generate-structured`
- `POST /api/generate-image`
- `POST /api/generate-speech`
- `POST /api/transcribe`
- `POST /api/generate-video`

## Validation And Safety

- Zod for schemas, request parsing, and environment validation.
- Centralized normalization to keep upstream payload differences out of route handlers.
- Secrets remain server-side only.
- Browser code may call internal API routes only.
- Every route returns normalized JSON errors with the shape `{ "error": "message" }`.

## Configuration

- `.env.local` for local development and Vercel environment variables for deployment.
- Required initial secret: `OPENROUTER_API_KEY`.
- Optional fallback-provider secrets may be added later for TTS, STT, or video if OpenRouter coverage is insufficient.

## Testing And Quality

- Vitest for unit and route tests.
- `tsx` scripts for local verification of each modality.
- Mock or capability-gated tests for experimental media APIs.
- Fixture-based transcription verification.
- Output artifacts written under an `output/` directory during local verification.

## Tooling

- ESLint for static analysis.
- TypeScript compiler for strict type checking.
- `dotenv` for local script execution where needed.
- `pnpm` as the default package manager.

## Deployment Shape

- Single Vercel project.
- Internal playground page at `app/page.tsx`.
- Server routes usable by browser UI and later by trusted local projects.

## Deferred Until Later

- Streaming UI.
- Auth or per-user persistence.
- Production storage for large media files.
- Advanced retry orchestration and provider failover policy.
