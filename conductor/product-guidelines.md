# Product Guidelines

## Positioning

This product should read as an internal multimodal engineering tool, not a consumer AI toy. The emphasis is reliability, verification, and clean modality boundaries for developers who need dependable model access from environments with uneven provider availability.

## Voice And Messaging

- Be direct, technical, and concrete.
- Prefer wording like `provider`, `model`, `modality`, `schema`, `metadata`, and `compatibility`.
- Avoid hype-heavy marketing language or vague claims about creativity.
- Error messages should explain what failed, whether the issue is caller-side or upstream, and what to check next.

## UX Priorities

- Testing utility matters more than decorative polish.
- Each modality should have its own focused form, output area, and failure message.
- When a request cannot be fulfilled, fail fast with a structured response instead of vague retries.
- Show warnings and provider metadata when they are safe to expose.
- Favor simple operator screens and dense information layouts over showcase aesthetics.

## Visual Direction

- Industrial and lab-like rather than playful.
- Strong contrast, dense information hierarchy, and deliberate typography.
- Avoid generic purple-on-white AI branding.
- Use sections, cards, and monospace metadata blocks to keep modality outputs easy to compare.

## Compatibility Rules

- Keep route-level request and response contracts explicit and narrowly scoped.
- Prefer normalized app-level outputs over raw provider payloads for image, speech, and video.
- Clearly document intentional deviations when a provider or experimental API forces them.
- Do not leak provider-specific fields into the public contract unless they are namespaced or clearly optional.

## Security Rules

- Never display or log raw upstream provider secrets.
- Browser code must call internal API routes only.
- Sanitize logs and error payloads before returning them to clients.
