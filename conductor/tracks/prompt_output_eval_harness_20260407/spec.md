# Track: Prompt/Output Evaluation Harness

## Overview

Build a local evaluation harness for comparing prompt inputs and model outputs across revisions to catch regressions early.

## Functional Requirements

- Define fixture format for prompts, expected traits, and assertions.
- Run evaluations against selected generation endpoints.
- Produce a concise pass/fail report with diffs or diagnostics.
- Support deterministic replay where possible.

## Non-Functional Requirements

- Harness should run as a local developer command.
- Results should be easy to interpret and version-control.

## Acceptance Criteria

- [ ] Fixture format is documented and validated.
- [ ] Harness runs against at least one text and one image-related flow.
- [ ] Report output identifies regressions clearly.
- [ ] Harness can be run in CI or local non-interactive mode.

## Out of Scope

- Human preference ranking systems.
- External benchmark hosting.

