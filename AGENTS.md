<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TableOps AI Agent Guidelines & Operating Instructions

This repository defines guidelines and workflows for AI coding agents operating on the **TableOps** codebase — a modern Virtual Tabletop (VTT) and D&D companion application built with Next.js 16 (App Router + Turbopack), React 19, Tailwind CSS v4, Supabase (PostgreSQL) + Prisma, and TypeScript.

The instructions below integrate the capabilities and principles of the active skill suite installed in `.agents/skills/`:
- **`react-best-practices`**: Vercel engineering performance optimization guidelines
- **`improve-codebase-architecture`**: Deep module design, locality, and architectural refactoring
- **`tdd`**: Test-driven development (red-green loop, pre-agreed seams, vertical slicing, anti-pattern avoidance)
- **`supabase` & `supabase-postgres-best-practices`**: Supabase client patterns, security, and PostgreSQL best practices
- **`grill-me`**: Socratic pre-implementation stress-testing and decision trees
- **`rtk`**: CLI proxy and token-conscious shell execution
- **`caveman`**: Terse, high-density communication mode

---

## 1. Pre-Implementation & Decision Validation (`grill-me`)

Before writing non-trivial features, refactoring architecture, or changing the database schema:

1. **Stress-test the Plan**:
   - Map complex features as a **design tree** where every decision branches into downstream sub-decisions.
   - Work the tree in **rounds** of frontier questions (questions whose prerequisites are already settled).
   - Format questions clearly with recommended answers:
     ```markdown
     ❓ **Q1** - **<decision title>**: <context and options>
     ➡️ <recommended choice based on current architecture>
     ```
   - Do not assume answers to ambiguous user requirements — ask first.

2. **Fact-Finding Responsibility**:
   - Finding facts is the agent's job, never the user's. Inspect existing files, Prisma schema (`prisma/schema.prisma`), `PLAN.md`, and `STYLEGUIDE.md` before asking questions.
   - Only ask the user for business or UX decisions, not for codebase facts discoverable via tools.

3. **Alignment**:
   - Confirm shared understanding before writing code.
   - Keep implementations aligned with the chunked roadmap in [`PLAN.md`](./PLAN.md).

---

## 2. Codebase Architecture & Modular Design (`improve-codebase-architecture`)

1. **Deep Modules Over Shallow Wrappers**:
   - Strive for deep modules: simple, robust interfaces hiding substantial internal logic.
   - Avoid creating shallow helper wrappers that simply pass arguments through without adding leverage.
   - Apply the **deletion test**: if deleting an abstraction concentrates complexity rather than reducing it, keep it; if deleting it just moves code around, eliminate the unnecessary layer.

2. **Locality & Seams**:
   - Keep related state and logic physically close to where it is used (**Locality**).
   - Define clean seams between domain layers:
     - `src/lib/` for core business logic, math (dice rolls), and database operations.
     - `src/components/` for UI rendering and localized user interactions.
     - `src/app/api/` for HTTP endpoints and Server Actions.
   - Avoid leaking persistence or database concerns directly into UI components.

3. **Domain Vocabulary**:
   - Use consistent D&D and TableOps domain terminology (`character`, `initiative`, `encounter`, `monster`, `turn`, `round`, `dice`, `campaign`).

---

## 3. Test-Driven Development (`tdd`)

When building new features, business rules, or fixing bugs, apply the **Red → Green** loop:

1. **The Red → Green Loop**:
   - **Red before Green**: Write the failing test first, then write only enough code to pass it.
   - Do not anticipate future tests or add speculative code.
   - **One slice at a time**: Work in **vertical slices** (tracer bullets: one seam → one test → one minimal implementation → repeat) rather than writing bulk tests first (horizontal slicing).
   - Refactoring belongs to the review stage, not during the red → green cycle.

2. **Seams: Where Tests Go**:
   - A **seam** is the public boundary tested: the interface where observable behavior is verified without reaching inside.
   - **Test only at pre-agreed seams**: Confirm the public interface and seams before writing tests.
   - Tests verify behavior through public interfaces, not implementation details. A good test reads like a specification (e.g., `"wizard calculates spell slots correctly for level 5"`) and survives refactors because it does not care about internal structure.

3. **Mocking Boundaries**:
   - Mock **only at external system boundaries**:
     - External network APIs (e.g. D&D 5e SRD API, third-party endpoints).
     - Time, clock, and randomness/dice seeds (when deterministic results are needed).
   - **Never mock**:
     - Internal collaborators, your own classes, domain entities, or anything you control.
   - **Design for mockability**:
     - Use dependency injection (pass external clients in).
     - Prefer SDK-style interfaces over generic fetchers so mocks remain simple and single-purpose.

4. **Anti-Patterns to Avoid**:
   - **Implementation-coupled**: Mocking internal collaborators, testing private methods, or verifying via side channels (e.g. checking raw DB rows instead of public interface). Tell: test breaks when you refactor without behavior changes.
   - **Tautological**: Assertion recomputes the expected value the same way the code does (`expect(add(a, b)).toBe(a + b)`). Expected values must come from an independent ground truth: known literals, D&D rules tables, or worked examples.
   - **Horizontal slicing**: Writing all tests first, then implementation. Bulk tests verify imagined behavior rather than user-facing capabilities.

---

## 4. React & Next.js Performance Standards (`react-best-practices`)

Follow Vercel's 70 performance rules prioritized by impact:

### Priority 1: Eliminating Waterfalls (CRITICAL)
- **`async-parallel`**: Use `Promise.all()` or parallel execution for independent data fetching operations.
- **`async-defer-await`**: Do not await promises at the top of a function if their result is only needed inside a conditional branch.
- **`async-cheap-condition-before-await`**: Evaluate synchronous or cheap conditions (e.g. auth checks, cache hit, feature flags) before awaiting expensive remote calls.
- **`async-suspense-boundaries`**: Use `<Suspense>` boundaries to stream slow UI components rather than blocking entire page renders.

### Priority 2: Bundle Size Optimization (CRITICAL)
- **`bundle-barrel-imports`**: Avoid re-exporting everything through large barrel files (`index.ts`). Import components and utilities directly from their defining files.
- **`bundle-dynamic-imports`**: Lazy-load heavy, conditionally rendered components (e.g. dice 3D canvases, large modals, rich text editors) via `next/dynamic`.
- **`bundle-analyzable-paths`**: Keep import paths statically analyzable to support tree-shaking and Turbopack bundler optimizations.

### Priority 3: Server & Client Data Management (HIGH)
- **`server-cache-react`**: Use `React.cache()` for per-request deduplication of data fetching in Server Components.
- **`server-auth-actions`**: Validate inputs and authenticate user identity in every Server Action and Route Handler.
- **Client State**:
  - Keep client state as local as possible.
  - Avoid storing derived state in `useState`; compute it synchronously during render.
  - Use `useCallback` and `useMemo` deliberately where reference equality prevents expensive re-renders, not indiscriminately.

---

## 5. Design & Styling System (`STYLEGUIDE.md`)

- **Strict Token Adherence**:
  - NEVER hardcode arbitrary hex color values (e.g., `#6b21a8`, `#1e293b`) directly in component classes or inline styles.
  - Always use theme tokens defined in [`src/app/globals.css`](./src/app/globals.css) and [`src/lib/theme.ts`](./src/lib/theme.ts):
    - Backgrounds: `bg-background`, `bg-card`, `bg-card-hover`, `bg-card-secondary`, `bg-input`
    - Typography: `text-foreground`, `text-muted`, `text-accent`, `text-primary-accent`
    - Borders: `border-border`, `border-border-subtle`, `border-primary/30`
    - Accents & Status: `tableops-gold`, `tableops-crimson`, `tableops-emerald`, `tableops-amethyst`, `tableops-azure`
- **Component Patterns**:
  - Use the established utility patterns in [`STYLEGUIDE.md`](./STYLEGUIDE.md): `dnd-card`, `dnd-card-glow`, `dnd-input`, `dnd-btn-primary`, `dnd-btn-secondary`, `dnd-badge`.
  - Maintain the immersive tabletop dark fantasy visual style across all pages and components.

---

## 6. Token Efficiency & Shell Workflow (`rtk`)

- **CLI Optimization**:
  - When executing shell exploration or repetitive status commands, leverage `rtk` wrappers when appropriate to filter noise and preserve context window tokens:
    - `rtk git status`
    - `rtk read <file>`
    - `rtk grep <pattern>`
    - `rtk test`
    - `rtk lint`
  - Track savings with `rtk gain`.

---

## 7. Communication Style & Voice Modes (`caveman`)

- **Default Mode**:
  - Concise, professional, GitHub-flavored markdown.
  - Create clickable markdown links for all mentioned files (`file:///path/to/file` or relative repo paths).
  - Highlight key decisions and open questions clearly.

- **Caveman Mode (`/caveman`, "caveman mode", "be brief")**:
  - When activated by user: eliminate all filler, fluff, and conversational pleasantries.
  - Deliver answer first, keep every technical fact, file path, command, and diff.
  - Remain in terse mode until instructed otherwise ("normal mode", "stop caveman").

---

## 8. Verification & Quality Gates

Before concluding any implementation task:
1. **Lint Check**: Run `npm run lint` and ensure 0 errors (Biome).
2. **Unit & Integration Tests**: Run `npm test` and ensure all tests pass (Vitest).
3. **E2E Tests**: Run `npm run test:e2e` when touching user-facing flows or navigation (Playwright).
4. **Build Check**: Run `npm run build` to verify Turbopack and TypeScript type correctness.
5. **Database & Schema**: Ensure Prisma schema changes are reflected with `npx prisma generate` and migrations.
6. **Documentation**: Keep [`PLAN.md`](./PLAN.md) updated when tasks/chunks are completed.

