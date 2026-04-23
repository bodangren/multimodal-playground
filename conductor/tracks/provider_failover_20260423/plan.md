# Implementation Plan: Provider Failover and Fallback Routing

## Phase 1: Provider Health Module

- [x] Task: Define provider health types and interfaces.
  - [x] Create `ProviderHealth` type with status, success rate, latency stats.
  - [x] Define `HealthWindow` for sliding-window tracking.
  - [x] Write tests for health status calculation from recorded outcomes.
- [x] Task: Implement health tracking.
  - [x] Record success/failure/latency per call.
  - [x] Compute rolling health status from the window.
  - [x] Write tests for window expiry and threshold transitions.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Provider Health Module' (Protocol in workflow.md) — CHECKPOINT: 8ef6a98

## Phase 2: Circuit Breaker

- [x] Task: Define circuit breaker states and transitions.
  - [x] Create `CircuitBreaker` class with closed/open/half-open FSM.
  - [x] Configure failure threshold, cooldown, and probe count.
  - [x] Write tests for all state transitions (closed→open, open→half-open, half-open→closed, half-open→open).
- [x] Task: Implement per-provider circuit breaker instances.
  - [x] Integrate circuit breaker with health module.
  - [x] Persist state to disk for restart survival.
  - [x] Write tests for state persistence and cold-start defaults.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Circuit Breaker' (Protocol in workflow.md) — CHECKPOINT: 8ef6a98

## Phase 3: Fallback Routing and Retry

- [x] Task: Define provider error classification.
  - [x] Map HTTP status codes to retryable/terminal/rate-limited taxonomy.
  - [x] Add provider-specific error body parsing.
  - [x] Write tests for classification of known error patterns.
- [x] Task: Implement fallback chain with retry and backoff.
  - [x] Build ordered provider chain from config.
  - [x] Add exponential backoff between retries.
  - [x] Cap total attempts across all providers.
  - [x] Write tests for chain exhaustion and backoff timing.
- [x] Task: Integrate circuit breaker into fallback routing.
  - [x] Skip providers with open circuit breakers.
  - [x] Log failover events with structured JSON.
  - [x] Write tests for circuit breaker integration with fallback.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Fallback Routing and Retry' (Protocol in workflow.md)

## Phase 4: Configuration and Integration Testing

- [x] Task: Add provider priority configuration.
   - [x] Create `providers.json` schema with Zod validation.
   - [x] Support environment variable overrides.
   - [x] Write tests for config loading and validation.
- [x] Task: Integrate failover into generation routes.
   - [x] Replace direct provider calls with failover-aware wrapper.
   - [x] Ensure existing synchronous paths remain functional.
   - [x] Write integration tests simulating multi-provider failures.
- [x] Task: Add metrics and observability.
   - [x] Track failover count, per-provider error rate, circuit breaker state changes.
   - [x] Write tests for metric recording.
- [x] Task: Conductor - User Manual Verification 'Phase 4: Configuration and Integration Testing' (Protocol in workflow.md) — CHECKPOINT: dffe06f
