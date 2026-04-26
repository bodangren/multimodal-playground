# Implementation Plan: Usage Analytics & Rate Limiting

## Phase 1: Usage Event Schema & Storage

- [ ] Task: Define SQLite schema for usage_events table (modality, api_key_hash, tokens, latency_ms, cost_estimate, timestamp)
  - [ ] Write migration script
  - [ ] Add index on (api_key_hash, timestamp) for fast lookups
- [ ] Task: Create UsageRepository with insert and query methods
  - [ ] Write unit tests for insert, query by time range, query by modality
- [ ] Task: Create UsageTracker service that wraps repository calls
  - [ ] Write tests for tracking generation requests end-to-end
- [ ] Task: Measure - User Manual Verification 'Phase 1: Usage Event Schema & Storage'

## Phase 2: Rate Limiting Middleware

- [ ] Task: Implement sliding window rate limiter using SQLite
  - [ ] Write tests for window boundary conditions
  - [ ] Write tests for concurrent request handling
- [ ] Task: Create rate limit middleware for API routes
  - [ ] Add X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers
  - [ ] Write tests for middleware response headers and 429 behavior
- [ ] Task: Add rate limit configuration via environment variables (RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SECONDS)
  - [ ] Write tests for config loading and default values
- [ ] Task: Measure - User Manual Verification 'Phase 2: Rate Limiting Middleware'

## Phase 3: Usage Dashboard & Analytics

- [ ] Task: Create /api/admin/usage endpoint with query parameters (modality, from, to, api_key)
  - [ ] Write tests for query parameter parsing and response shape
- [ ] Task: Add usage summary aggregation (total requests, total cost, avg latency by modality)
  - [ ] Write tests for aggregation accuracy
- [ ] Task: Create simple usage dashboard page in the playground UI
  - [ ] Write component tests for chart rendering
- [ ] Task: Measure - User Manual Verification 'Phase 3: Usage Dashboard & Analytics'

## Phase 4: Quota Management

- [ ] Task: Implement daily quota tracking per API key
  - [ ] Write tests for quota reset at midnight UTC
  - [ ] Write tests for quota exceeded behavior
- [ ] Task: Add soft limit warnings in response headers when quota > 80%
  - [ ] Write tests for warning threshold logic
- [ ] Task: Integrate quota check with rate limiting middleware
  - [ ] Write integration tests for combined rate limit + quota enforcement
- [ ] Task: Measure - User Manual Verification 'Phase 4: Quota Management'
