# Track: Provider Failover and Fallback Routing

## Overview

Add automatic provider failover for AI API calls. When the primary provider (OpenRouter) returns errors or rate limits, the system retries with fallback providers (OpenAI, Anthropic direct). Includes health checks, circuit breaker pattern, and configurable provider priority.

## Functional Requirements

### Provider Health Monitoring
- Track per-provider success/failure rates over a sliding window.
- Expose health status (healthy, degraded, down) per provider.
- Record latency, error codes, and rate-limit headers for each call.

### Circuit Breaker
- Implement three states: closed (normal), open (failing, reject immediately), half-open (probe with limited traffic).
- Transition closed → open after configurable consecutive failures.
- Transition open → half-open after a cooldown period.
- Transition half-open → closed on successful probe; half-open → open on failure.
- Per-provider circuit breaker instances.

### Fallback Chain Configuration
- Define an ordered list of providers per request type (e.g., text generation, image generation).
- Configuration via `providers.json` or environment variables.
- Allow per-request override of the fallback chain.
- Support weighting/priority so that traffic prefers the cheapest/fastest provider.

### Retry with Backoff
- On provider failure, retry the next provider in the chain.
- Exponential backoff between retries with configurable base and max delay.
- Cap total retry attempts across all providers.
- Distinguish retryable errors (429, 503, timeouts) from terminal errors (401, 400).

### Provider-Specific Error Classification
- Map provider-specific HTTP status codes and error bodies to a shared error taxonomy.
- Classify errors as retryable, rate-limited, auth-failed, or invalid-request.
- Surface classification in logs and metrics.

### Metrics and Logging
- Log each failover event with provider, error, and chosen fallback.
- Track aggregate metrics: failover count, per-provider error rate, circuit breaker state changes.
- Structured JSON logging for observability.

## Non-Functional Requirements

- Failover must not add more than 200ms overhead for the happy path (primary succeeds).
- Circuit breaker state must survive in-process restarts (persist to disk or use in-memory with cold-start defaults).
- All provider interactions must be typed with Zod schemas.

## Acceptance Criteria

- [ ] Circuit breaker transitions through closed/open/half-open states correctly.
- [ ] Fallback chain retries the next provider on retryable errors.
- [ ] Terminal errors (401, 400) stop retrying immediately.
- [ ] Rate-limit errors (429) trigger fallback with appropriate backoff.
- [ ] Health status reflects recent success/failure rates.
- [ ] Failover events are logged with structured JSON.
- [ ] Provider priority is configurable and respected.
- [ ] Tests cover all circuit breaker state transitions.
- [ ] Tests cover fallback chain exhaustion (all providers fail).

## Out of Scope

- Distributed circuit breaker (shared state across processes).
- Automatic provider cost optimization.
- Provider response caching.
