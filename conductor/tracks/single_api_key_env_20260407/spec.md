# Track: Single API key configuration via `.env`

## Problem

This project is local-only and should not implement multi-user authentication or rate limiting. It only needs one API key sourced from environment configuration.

## Goal

Use a single API key from `.env` (or `.env.local`) as the sole credential for upstream model/provider calls.

## Scope

- Define one canonical environment variable for the API key.
- Validate key presence at startup or request handling boundaries.
- Document local setup and failure behavior when key is missing.
- Ensure no auth middleware or quota logic is introduced.

## Out of Scope

- User authentication flows.
- Per-user API keys.
- Request throttling or rate-limiting systems.

## Acceptance Criteria

- [ ] One environment variable is used as the only API key source.
- [ ] Missing-key error path is explicit and actionable.
- [ ] README/setup docs clearly describe local key configuration.
- [ ] Existing API flows continue to work with the configured key.

