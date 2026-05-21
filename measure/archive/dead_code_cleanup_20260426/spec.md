# Dead Code Cleanup

## Problem
The codebase contains unused OpenAI provider helpers (`getOpenAIProvider`, `getSpeechModel`, `getTranscriptionModel`) that are never called in production. This dead code increases cognitive load and maintenance burden.

## Solution
Remove all dead OpenAI provider code and consolidate duplicate error classification logic between `queue/types` and `provider/error-classifier`.

## Acceptance Criteria
- [ ] Remove `getOpenAIProvider`, `getSpeechModel`, `getTranscriptionModel` functions
- [ ] Consolidate duplicate error classification into single module
- [ ] All existing tests pass
- [ ] No regressions in provider routing
