# Track: Serverless-Ready State Persistence

## Problem
The current JobQueue (in-memory Map) and CircuitBreaker (JSON file persistence) lose state on server restart or in serverless environments (Vercel cold starts).

## Goal
Replace in-memory and filesystem-dependent state with SQLite-backed persistence that survives restarts and works in serverless contexts.

## Acceptance Criteria
- [ ] JobQueue persists jobs to SQLite with status, retry count, and timestamps
- [ ] CircuitBreaker state survives restarts via SQLite instead of JSON file
- [ ] All existing queue and circuit breaker tests pass with new persistence layer
- [ ] Graceful fallback to in-memory when SQLite is unavailable
- [ ] Build passes, lint clean

## Out of Scope
- Distributed locking across multiple serverless instances
- Redis or external queue systems
