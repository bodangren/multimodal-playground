# Spec: Usage Analytics & Rate Limiting

## Problem

The ai-image-generator serves as an internal gateway for multiple local projects. Currently there is no visibility into usage patterns, no per-user quotas, and no protection against runaway generation costs. The job queue is in-memory only and the CircuitBreaker uses JSON file persistence, neither of which scale beyond a single dev server.

## Goals

1. Track per-modality usage metrics (requests, tokens, latency, cost estimates)
2. Implement configurable rate limits per API key or user
3. Add quota management with soft limits and alerts
4. Provide a simple usage dashboard for cost visibility

## Non-Goals

- Full billing integration (internal tool, not SaaS)
- Real-time streaming analytics
- Multi-tenant isolation

## Approach

- Use SQLite for usage event storage (consistent with existing stack)
- Middleware layer for rate limiting that plugs into existing API routes
- Lightweight admin endpoint for usage queries
- Rate limit headers in API responses (X-RateLimit-Remaining, etc.)

## Success Criteria

- All API routes return rate limit headers
- Usage events logged for every generation request
- Admin can query usage by modality, time range, and API key
- Rate limits configurable via environment variables
