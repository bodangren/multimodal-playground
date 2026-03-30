# Project Workflow

## Guiding Principles

1. **The Plan is the Source of Truth:** All implementation work must map to `plan.md`.
2. **The API Contract Comes First:** Public compatibility decisions must be written in `spec.md` and reflected in tests before implementation.
3. **Test-Driven Development:** Write failing tests before building handlers, adapters, or config layers.
4. **High Coverage For Core Paths:** Target at least 80% coverage for contract, auth, config, and normalization modules.
5. **Operator Safety Over Convenience:** Changes that affect auth, logging, or provider secrets require explicit review in docs and tests.
6. **Non-Interactive By Default:** Prefer deterministic commands and `CI=true` where a tool might enter watch mode.

## Standard Task Workflow

1. Select the next task in `plan.md`.
2. Mark the task `[~]` before starting.
3. Write failing tests for the task.
4. Run only the relevant tests and confirm they fail.
5. Implement the minimum code to make those tests pass.
6. Refactor only after the task is green.
7. Run coverage, lint, typecheck, and targeted integration checks for the touched surface.
8. If a shortcut is taken, record it in `tech-debt.md`.
9. Commit the code change with an auditable message.
10. Attach a git note summarizing the task, changed files, and rationale.
11. Mark the task `[x]` with the commit SHA in `plan.md`.
12. Commit the plan update separately.

## Phase Completion Verification And Checkpointing Protocol

At the end of every phase:

1. Identify files changed since the previous phase checkpoint.
2. Verify all code files added in the phase have corresponding tests.
3. Announce and run the exact automated verification commands.
4. If failures appear, attempt at most two focused fixes before stopping for user input.
5. Produce a manual verification plan with commands, endpoint calls, and expected outcomes.
6. Wait for explicit user confirmation before treating the phase as manually verified.
7. Create a checkpoint commit and attach a git note with automated and manual verification evidence.
8. Record the checkpoint SHA on the phase heading in `plan.md`.
9. Commit the plan update separately.

## Quality Gates

Before marking a task complete, verify:

- [ ] Targeted tests pass.
- [ ] Coverage for new or changed core modules is above 80%.
- [ ] `pnpm lint` passes.
- [ ] `pnpm typecheck` passes.
- [ ] Public handlers validate inputs and sanitize outputs.
- [ ] No secrets are logged or returned in error payloads.
- [ ] Documentation is updated when public behavior changes.

## Development Commands

### Setup

```bash
pnpm install
```

### Daily Development

```bash
pnpm dev
CI=true pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

### Targeted Verification

```bash
CI=true pnpm vitest run path/to/test-file.test.ts
CI=true pnpm vitest run --coverage
```

### Before Committing

```bash
pnpm lint
pnpm typecheck
CI=true pnpm test
pnpm build
```

## Testing Requirements

### Contract Tests

- Validate OpenAI-compatible request and response shapes.
- Cover success, validation failure, auth failure, unknown model, and upstream error paths.
- Assert that provider-specific details do not leak unexpectedly.

### Adapter Tests

- Mock upstream providers by default.
- Verify model alias resolution, fallback behavior, and normalized image outputs.
- Test binary and base64 handling explicitly.

### Integration Tests

- Exercise route handlers end to end with mocked providers.
- Keep live-provider tests opt-in and clearly tagged.

## Review Priorities

1. Contract compatibility.
2. Security and secret handling.
3. Clear failure behavior.
4. Provider abstraction quality.
5. Documentation accuracy.
