# Implementation Plan: Advanced Provider Routing with Cost Optimization

## Phase 1: Cost Model and Configuration [checkpoint: 35c26a6]

- [x] Task: Define cost schema with input/output token pricing.
  - [x] Add CostConfig interface with model pricing per modality.
  - [x] Add Zod validation schema for cost configuration.
  - [x] Add test fixtures for cost data structures.
- [x] Task: Add environment variable support for cost configuration.
  - [x] Support COST_<PROVIDER>_<MODEL>_INPUT and COST_<PROVIDER>_<MODEL>_OUTPUT variables.
  - [x] Add parser for comma-separated cost configuration.
  - [x] Add tests for cost environment variable parsing.

## Phase 2: Cost-Aware Routing Engine

- [x] Task: Extend FallbackChain to consider cost in selection.
  - [x] Add cost-aware provider selection alongside health checks.
  - [x] Add threshold for maximum acceptable cost per request.
  - [x] Add tests for cost-based provider selection.
- [x] Task: Add cost limit enforcement per request.
  - [x] Add optional costLimit parameter to execute calls.
  - [x] Skip providers that would exceed cost limit.
  - [x] Add tests for cost limit enforcement.

## Phase 3: Cost Tracking and Reporting

- [x] Task: Add cost accumulation to provider metrics.
  - [x] Track input/output token counts per call.
  - [x] Calculate cost per provider from configured pricing.
  - [x] Add tests for cost accumulation in metrics.
- [x] Task: Add cost savings reporting.
  - [x] Compare actual routing cost vs single-provider baseline.
  - [x] Report total savings in getFailoverMetrics output.
  - [x] Add tests for cost savings calculation.

## Phase 4: Integration and Verification

- [x] Task: Integrate cost routing into ProviderExecutor.
  - [x] Ensure all existing provider health features still work.
  - [x] Add integration tests for cost-aware execution.
- [x] Task: Verify backwards compatibility.
  - [x] Ensure cost features disabled when not configured.
  - [x] Run full test suite.
  - [x] Update tracks registry.