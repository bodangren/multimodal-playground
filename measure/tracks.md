# Project Tracks

This file tracks all major tracks for the project.

---

- [x] **Track: OpenRouter-first multimodal playground MVP**
  *Link: [./archive/multimodal_playground_mvp_20260330/](./archive/multimodal_playground_mvp_20260330/)*
- [x] **Track: OpenAI-compatible API layer**
  *Link: [./archive/openai_compatible_api_20260401/](./archive/openai_compatible_api_20260401/)*
- [x] **Track: Re-enable speech generation UI**
  *Link: [./archive/speech_ui_reenable_20260401/](./archive/speech_ui_reenable_20260401/)*
- [ ] **Track: API documentation and Podman containerization**
  *Link: [./archive/docs_and_dockerize_20260401/](./archive/docs_and_dockerize_20260401/)*
- [x] **Track: Single API key configuration via `.env`**
  *Link: [./archive/single_api_key_env_20260407/](./archive/single_api_key_env_20260407/)*
- [x] **Track: Generation Job Queue and Retry Semantics**
   *Link: [./archive/job_queue_retry_20260407/](./archive/job_queue_retry_20260407/)*
   *Status: Complete*
- [ ] **Track: Prompt/Output Evaluation Harness**
  *Link: [./tracks/prompt_output_eval_harness_20260407/](./tracks/prompt_output_eval_harness_20260407/)*
- [x] **Track: Provider Failover and Fallback Routing**
   *Link: [./archive/provider_failover_20260423/](./archive/provider_failover_20260423/)*
   *Status: Complete*
- [x] **Track: Visual Refresh: Define Unique Identity**
   *Link: [./archive/visual_refresh_20260425/](./archive/visual_refresh_20260425/)*
   *Status: Complete*

- [x] **Track: Prompt/Output Evaluation Harness** *Link: [./archive/prompt_output_eval_harness_20260407/](./archive/prompt_output_eval_harness_20260407/)* — Phase 1 complete (eval fixtures, harness runner, CLI); Phase 2+ deferred

- [ ] **Track: Dead Code Cleanup**
  *Link: [./tracks/dead_code_cleanup_20260426/](./tracks/dead_code_cleanup_20260426/)*
  Remove unused OpenAI provider helpers and consolidate duplicate error classification logic.

- [ ] **Track: Usage Analytics & Rate Limiting**
  *Link: [./tracks/usage_analytics_rate_limiting_20260427/](./tracks/usage_analytics_rate_limiting_20260427/)*
  Track per-modality usage metrics, implement configurable rate limits, add quota management with soft limits.

- [ ] **Track: Persistent Asset Storage & Gallery**
  *Link: [./tracks/persistent_asset_storage_20260502/](./tracks/persistent_asset_storage_20260502/)*
  Replace inline base64 data URLs with persistent object storage, add asset metadata layer, and build a gallery UI for browsing generated media.

- [ ] **Track: Serverless-Ready State Persistence**
  *Link: [./tracks/serverless_state_persistence_20260509/](./tracks/serverless_state_persistence_20260509/)*
  Replace in-memory JobQueue and JSON file CircuitBreaker with SQLite-backed persistence for serverless compatibility.
