# Product Definition

## Initial Concept

Build a Vercel-hosted multimodal AI playground and internal gateway that exposes server-side routes for text, structured output, image generation, speech generation, transcription, and video generation. The project should use AI SDK v6, prefer OpenRouter where that provider abstraction supports the modality cleanly, and remain usable as a stable backend for local tools and game projects.

## Problem

Local development projects need reliable access to modern generative models for game assets, infographics, narration, transcription, and other media workflows. The developer is based in China and cannot depend on direct local access to every provider or model. Existing templates focus either on a single modality or on demo-first UX instead of a modular server-side playground and gateway that can validate capabilities, normalize outputs, and support local project integrations.

## Target Users

- Primary: the repository owner building local game projects and developer tools.
- Secondary: a small number of trusted internal projects that need the same OpenAI-compatible image endpoint and shared model aliases.

## Product Goals

1. Provide modular server-side helpers and API routes for six modalities: text, structured output, image, speech, transcription, and video.
2. Prefer OpenRouter-backed models where they are supported cleanly, while allowing fallback providers for missing modalities or unsupported model shapes.
3. Offer a simple internal playground UI for manual verification without exposing provider secrets to the browser.
4. Keep the architecture reusable so local projects can later consume the same helpers or API routes as a backend service.

## Core MVP Capabilities

- Shared provider initialization in one server-only module.
- Text generation with `generateText()`.
- Structured output generation using `generateText()` plus `output` and Zod-backed schemas.
- Image generation with experimental AI SDK image APIs and model discovery support.
- Speech generation with experimental AI SDK speech APIs.
- Audio transcription with experimental AI SDK transcription APIs.
- Video generation with experimental AI SDK video APIs.
- One internal API route per modality with normalized JSON errors.
- One internal UI page with forms and outputs for each modality.
- Local verification scripts for each modality plus image-model discovery.

## Product Principles

- Server-side first over browser-first.
- Prefer OpenRouter first, but do not force it for unsupported modalities.
- Keep provider initialization centralized and explicit.
- Favor deterministic failure messages over silent provider-specific behavior.
- Protect upstream credentials; callers must never receive direct provider secrets.
- Treat experimental modality APIs as capability-dependent and verify result shapes at runtime.

## Non-Goals For MVP

- Streaming UI.
- Agentic tool-calling workflows.
- Image editing with masks or file-based edits.
- Multi-image batching beyond basic experimentation.
- Production auth, user persistence, or billing.
- Long-term media storage or asset management.

## Success Criteria

- The text path returns valid freeform output.
- The structured path returns schema-conformant data validated by Zod.
- The image path can generate and save a real image.
- The speech path can generate and save a real audio file.
- The transcription path can return transcript text from a fixture audio file.
- The video path can return or save a usable video result.
- Every internal API route returns normalized JSON or normalized media metadata.
- The internal page can exercise each modality manually without exposing secrets client-side.
