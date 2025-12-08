## Learning Guide (Angular Frontend)

Purpose: keep the code clean while leaving a clear learning trail for Angular and application development. Use this guide when adding features, refactoring, or reviewing code.

### How to explain changes
- Prefer short “what/why” notes in PR descriptions or task updates; keep code comments minimal and only where intent is non-obvious.
- When touching a file, add 2–4 sentences describing the reasoning (architecture impact, trade-offs, future extension points).
- Reference existing docs instead of duplicating: see `docs/PRD.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/PROGRESS.md`.
- If introducing patterns, link to the Angular docs you followed (routing, forms, DI, RxJS, etc.).

### Angular topics to cover in explanations
- Component design: inputs/outputs, change detection assumptions, smart vs. presentational splits.
- Routing: lazy-loaded routes, guards, resolver rationale, and navigation flow.
- Dependency Injection: service responsibilities, provided scopes, and why a service owns the logic.
- State & data flow: where state lives (component vs service), immutability expectations, and how updates propagate.
- HTTP & interceptors: error handling strategy, retry/backoff decisions, auth header handling.
- Forms: template vs reactive choice, validation rules, and user feedback.
- RxJS: chosen operators, cancellation patterns, and how streams are composed.
- Error & loading UX: how errors surface to the user; consistent loading indicators.
- Testing: what to unit test vs. component test; key cases added or still missing.

### UI library note
Current UI work uses Google’s library (e.g., Angular Material). Document the chosen components, theming decisions, and any accessibility considerations. Avoid GCore UI Kit specifics until access is available.

### Commenting guidelines
- Code comments: only where intent is subtle (e.g., non-obvious RxJS flow, guard condition). Describe the “why”, not the “what”.
- Keep learning notes in docs or PR descriptions, not inside component templates or styles.

### Suggested template for a change note
- Goal: what user outcome or behavior you’re delivering.
- Approach: key Angular constructs used (module/route/service/component) and why.
- Data flow: where data comes from, how it is stored, and how UI reacts.
- Risks/Follow-ups: edge cases not covered, tests to add, or debt to track.
