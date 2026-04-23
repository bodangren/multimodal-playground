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
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Provider Health Module' (Protocol in workflow.md)

## Phase 2: Circuit Breaker

- [x] Task: Define circuit breaker states and transitions.
  - [x] Create `CircuitBreaker` class with closed/open/half-open FSM.
  - [x] Configure failure threshold, cooldown, and probe count.
  - [x] Write tests for all state transitions (closed→open, open→half-open, half-open→closed, half-open→open).
- [x] Task: Implement per-provider circuit breaker instances.
  - [x] Integrate circuit breaker with health module.
  - [x] Persist state to disk for restart survival.
  - [x] Write tests for state persistence and cold-start defaults.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Circuit Breaker' (Protocol in workflow.md)

## Phase 3: Fallback Routing and Retry

- [ ] Task: Define provider error classification.
  - [ ] Map HTTP status codes to retryable/terminal/rate-limited taxonomy.
  - [ ] Add provider-specific error body parsing.
  - [ ] Write tests for classification of known error patterns.
- [ ] Task: Implement fallback chain with retry and backoff.
  - [ ] Build ordered provider chain from config.
  - [ ] Add exponential backoff between retries.
  - [ ] Cap total attempts across all providers.
  - [ ] Write tests for chain exhaustion and backoff timing.
- [ ] Task: Integrate circuit breaker into fallback routing.
  - [ ] Skip providers with open circuit breakers.
  - [ ] Log failover events with structured JSON.
  - [ ] Write tests for circuit breaker integration with fallback.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Fallback Routing and Retry' (Protocol in workflow.md)

## Phase 4: Configuration and Integration Testing

- [ ] Task: Add provider priority configuration.
  - [ ] Create `providers.json` schema with Zod validation.
  - [ ] Support environment variable overrides.
  - [ ] Write tests for config loading and validation.
- [ ] Task: Integrate failover into generation routes.
  - [ ] Replace direct provider calls with failover-aware wrapper.
  - [ ] Ensure existing synchronous paths remain functional.
  - [ ] Write integration tests simulating multi-provider failures.
- [ ] Task: Add metrics and observability.
  - [ ] Track failover count, per-provider error rate, circuit breaker state changes.
  - [ ] Write tests for metric recording.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Configuration and Integration Testing' (Protocol in workflow.md)
