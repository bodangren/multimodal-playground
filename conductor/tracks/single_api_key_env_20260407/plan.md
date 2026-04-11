# Implementation Plan: Single API key configuration via `.env`

## Phase 1: Environment Contract

- [x] Task: Define canonical API key env variable and usage points.
  - [x] Identify all provider call sites.
  - [x] Replace duplicate/legacy env key lookups.
- [x] Task: Add missing-key validation behavior.
  - [x] Add tests for missing and present key cases.
  - [x] Ensure response errors are actionable for local setup.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Environment Contract' (Protocol in workflow.md)

## Phase 2: Docs and Verification

- [ ] Task: Update setup docs for single-key local configuration.
- [ ] Task: Run local regression checks for key-backed endpoints.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Docs and Verification' (Protocol in workflow.md)

