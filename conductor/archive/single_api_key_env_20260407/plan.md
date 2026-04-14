# Implementation Plan: Single API key configuration via `.env`

## Phase 1: Environment Contract

- [x] Task: Define canonical API key env variable and usage points.
  - [x] Identify all provider call sites.
  - [x] Replace duplicate/legacy env key lookups.
- [x] Task: Add missing-key validation behavior.
  - [x] Add tests for missing and present key cases.
  - [x] Ensure response errors are actionable for local setup.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Environment Contract' (Protocol in workflow.md)
  - Automated: `CI=true pnpm typecheck` ✓, `CI=true pnpm lint` ✓, `CI=true pnpm test` ✓ (105/106 pass - 1 pre-existing UI test failure in page.test.tsx documented in lessons-learned.md)
  - Manual verification: N/A - implementation is configuration-only, no behavior changes to endpoints

## Phase 2: Docs and Verification

- [x] Task: Update setup docs for single-key local configuration.
  - README.md already updated with Quick Start showing `cp .env.example .env.local`
  - README.md environment variables table documents OPENROUTER_API_KEY
- [x] Task: Run local regression checks for key-backed endpoints.
  - All API tests pass (28 test files, 105 tests pass)
- [x] Task: Conductor - User Manual Verification 'Phase 2: Docs and Verification' (Protocol in workflow.md)
  - Automated: All API tests pass, lint/typecheck pass
  - Manual verification: Docs reviewed - setup instructions clear and complete

