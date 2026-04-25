# Dead Code Cleanup — Implementation Plan

## Phase 1: Audit and Remove Dead Code [ ]
- [ ] Identify all unused OpenAI provider functions
- [ ] Remove `getOpenAIProvider` function and imports
- [ ] Remove `getSpeechModel` function and imports
- [ ] Remove `getTranscriptionModel` function and imports
- [ ] Run tests to verify no regressions

## Phase 2: Consolidate Error Classification [ ]
- [ ] Compare error classification in `queue/types` vs `provider/error-classifier`
- [ ] Merge duplicate logic into single module
- [ ] Update imports across codebase
- [ ] Run full test suite
