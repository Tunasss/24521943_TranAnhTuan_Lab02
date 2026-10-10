# Project Rules: Resilient State Machine & Skeleton Loader

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [What the AI Must Do](#2-what-the-ai-must-do)
3. [What the AI Must Not Do](#3-what-the-ai-must-not-do)
4. [TypeScript Type Safety Rules](#4-typescript-type-safety-rules)
5. [Asynchronous Safety Rules](#5-asynchronous-safety-rules)
6. [Accessibility Rules for the User Interface](#6-accessibility-rules-for-the-user-interface)
7. [Git and Commit Rules](#7-git-and-commit-rules)
8. [Definition of Done](#8-definition-of-done)

---

## 1. Purpose and Scope

### 1.1 Purpose

This document establishes the **code of conduct for Artificial Intelligence (AI) assistants** working on the **Resilient State Machine & Skeleton Loader** project. It specifies mandatory requirements, forbidden practices, and strict quality guidelines that every AI assistant must respect when creating, modifying, or testing code in this repository.

The core objectives are:

- Model application asynchronous lifecycles via a strict **four-state finite state machine** (`IDLE`, `LOADING`, `SUCCESS`, `ERROR`) using TypeScript (TS) discriminated unions.
- Eliminate race conditions and memory leaks by ensuring stale asynchronous responses are disregarded and ongoing network requests can be cancelled via an `AbortController`.
- Provide a smooth visual experience using an animated **Skeleton Loader** while honoring assistive technology and user motion preferences.
- Achieve full compliance with **Web Content Accessibility Guidelines (WCAG) 2.0 Level AA** for written content, live regions, contrast, and animations.

### 1.2 Project Description

The project implements a resilient news/post feed component in TypeScript:
- **Resilient State Machine**: Represents asynchronous states without impossible states (e.g. data existing while in loading state without explicit typing, or simultaneous error and success).
- **Mock Feed Service (`fetchFeed`)**: Simulates real-world network conditions including artificial latency (delay) and simulated randomized failure rates.
- **Race Condition & Unmount Guard**: Discards stale promise completions when a newer request is dispatched or when the component unmounts.
- **Skeleton Loader UI**: Displays skeleton card placeholders with a subtle pulse animation that gracefully falls back to a static presentation when `prefers-reduced-motion` is active.
- **Error State & Recovery**: Presents clear error notifications with an accessible **"Retry Connection"** action button.

### 1.3 Scope

These standards apply to all deliverables, including TypeScript source files (`.ts`, `.tsx`), Cascading Style Sheets (CSS), HyperText Markup Language (HTML), documentation, and Git commit messages.

---

## 2. What the AI Must Do

The following table details all mandatory rules. Every rule carries a unique identifier (ID) for verification.

| ID | Rule | Reason |
| --- | --- | --- |
| DO-01 | Model state exclusively as a **discriminated union** of four distinct states: `IDLE`, `LOADING`, `SUCCESS`, and `ERROR` using a shared discriminant property (e.g., `status`). | Eliminates impossible states at compile time; prevents reading payload in `LOADING` or `ERROR` without explicit checking. |
| DO-02 | Implement exhaustive pattern matching in all state-to-view render functions with a `never` exhaustiveness check in the default branch. | Guarantees that adding or altering a state variant triggers a compile-time error if any view branch is unhandled. |
| DO-03 | Maintain strict TypeScript type safety with zero use of the `any` keyword. Use `unknown`, generic parameters, or explicit interfaces for unknown data. | Prevents silent type checking bypasses, preserving the entire type-checking contract. |
| DO-04 | Guard asynchronous state updates against race conditions by tracking active request identifiers or an `AbortController`. | Ensures fast responses from older requests never overwrite newer responses from later user actions. |
| DO-05 | Cancel ongoing requests or abort handlers upon component unmount and ignore pending promise settlements. | Prevents updating unmounted component state and prevents browser memory leaks. |
| DO-06 | Implement a simulated feed API (Application Programming Interface) (`fetchFeed`) with configurable network latency (delay) and a probabilistic error trigger. | Facilitates deterministic reproduction and automated testing of transient network faults. |
| DO-07 | Set `aria-busy="true"` on the feed container and supply an element with `role="status"` during the `LOADING` state. | Informs screen readers and assistive technologies that dynamic content is actively loading. |
| DO-08 | Mark error announcements with `role="alert"` or `aria-live="assertive"` to immediately notify assistive tech users when an error occurs. | WCAG 2.0 Level AA requirement (Success Criterion 4.1.3 Status Messages) for critical system notifications. |
| DO-09 | Provide a visible, keyboard-accessible **"Retry Connection"** button in the `ERROR` state with an explicit text label. | Empowers users to recover from transient failures without requiring a full browser refresh. |
| DO-10 | Respect the `@media (prefers-reduced-motion: reduce)` media query by disabling or dampening skeleton pulse animations. | Satisfies WCAG 2.0 Success Criterion 2.2.2 (Pause, Stop, Hide) and accommodates users with vestibular disorders. |
| DO-11 | Ensure all text and interactive user interface controls meet a minimum contrast ratio of **4.5:1** for regular text and **3:1** for UI components against adjacent backgrounds. | Guarantees legibility per WCAG 2.0 Success Criterion 1.4.3 (Contrast Minimum). |
| DO-12 | Provide visible, high-contrast `:focus-visible` focus indicators for all interactive controls (buttons, links). | Meets WCAG 2.0 Success Criterion 2.4.7 (Focus Visible). |
| DO-13 | Expand every abbreviation on its initial appearance in comments and documentation (e.g., "Virtual Node (VNode)"). | Ensures clear understanding across varied technical and domain backgrounds. |
| DO-14 | Format all Git commit messages in adherence to the Conventional Commits specification. | Preserves an auditable, machine-readable project history. |

---

## 3. What the AI Must Not Do

The following table specifies prohibited behaviors. Committing any prohibited item results in immediate deliverable rejection.

| ID | Rule | Reason |
| --- | --- | --- |
| DONT-01 | Never use the `any` type or `as any` type casting anywhere in the TypeScript codebase. | Breaks TypeScript safety guarantees and introduces latent runtime type errors. |
| DONT-02 | Never represent state using separate, uncoordinated boolean flags (e.g., `{ isLoading: boolean, isError: boolean, data: FeedItem[] \| null, error: Error \| null }`). | Creates impossible combinations such as `isLoading === true` and `isError === true` simultaneously. |
| DONT-03 | Never perform a state update after a component has unmounted or after a newer request has been initiated. | Generates React memory leak warnings and causes stale data race conditions. |
| DONT-04 | Never suppress TypeScript compiler errors with `@ts-ignore` or `@ts-nocheck` without explicit documented authorization. | Hides legitimate compiler diagnostics, degrading codebase resilience. |
| DONT-05 | Never rely on uncancelled promises without an unmount or sequence guard when executing asynchronous side effects. | Results in race conditions where delayed slow responses override newer fast responses. |
| DONT-06 | Never play continuous, non-stoppable animations without respecting the user's `prefers-reduced-motion` settings. | Induces dizziness, nausea, and disorientation for users with vestibular motion sensitivities. |
| DONT-07 | Never use color alone to differentiate between success, loading, and error states. | Violates WCAG 2.0 Success Criterion 1.4.1 (Use of Color); inaccessible to color-blind users. |
| DONT-08 | Never use `outline: none` or `outline: 0` in CSS without providing an equally visible replacement focus ring. | Deprives keyboard-only users of visual navigation tracking. |
| DONT-09 | Never hardcode raw user error objects directly into DOM text without safe string sanitization. | Can expose private stack traces or lead to unhandled rendering crashes. |
| DONT-10 | Never leave `console.log`, `debugger`, or temporary inspection hooks in production code paths. | Clutters browser consoles and may leak runtime operational data. |
| DONT-11 | Never introduce heavy external state libraries (e.g., Redux, MobX, XState) for this component. | Defeats the foundational objective of mastering native TypeScript state machine patterns. |
| DONT-12 | Never make Git commits with vague messages (e.g., "fix", "update", "wip"). | Obscures change history and impairs regression tracking. |

---

## 4. TypeScript Type Safety Rules

### 4.1 Discriminated Union Architecture

The state lifecycle must be strictly typed as a union of object types discriminated by a literal `status` field:

```typescript
export interface FeedItem {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  timestamp: string;
}

export type FeedState =
  | { readonly status: 'IDLE' }
  | { readonly status: 'LOADING' }
  | { readonly status: 'SUCCESS'; readonly items: readonly FeedItem[] }
  | { readonly status: 'ERROR'; readonly error: string };
```

### 4.2 Exhaustive Switch Matching

Every reducer or rendering function branching on `state.status` must implement exhaustive pattern matching verified by a `never` guard:

```typescript
export function assertNever(x: never): never {
  throw new Error(`Unexpected object encountered: ${JSON.stringify(x)}`);
}

export function renderFeedState(state: FeedState): JSX.Element {
  switch (state.status) {
    case 'IDLE':
      return <IdleView />;
    case 'LOADING':
      return <LoadingSkeletonView />;
    case 'SUCCESS':
      return <FeedListView items={state.items} />;
    case 'ERROR':
      return <ErrorView message={state.error} />;
    default:
      return assertNever(state);
  }
}
```

### 4.3 Zero `any` Policy

All incoming data from `fetchFeed` must be validated or typed with explicit contracts. Use `unknown` with type predicates (`isFeedItem(val: unknown): val is FeedItem`) or typed interfaces, never `any`.

---

## 5. Asynchronous Safety Rules

### 5.1 Race Condition Prevention

When multiple fetch operations occur (e.g. repeated user clicks on "Retry Connection" or filter toggles), the state machine must ensure that **only the latest request updates the state**:

1. **Option A (Sequential Request ID Token)**:
   A monotonic integer counter increments on each fetch call. The response callback checks `if (requestId === currentRequestId.current)` before applying any state update.
2. **Option B (AbortController)**:
   An active `AbortController` instance is aborted prior to initiating a new fetch:
   ```typescript
   if (abortControllerRef.current) {
     abortControllerRef.current.abort();
   }
   const controller = new AbortController();
   abortControllerRef.current = controller;
   ```

### 5.2 Unmount Safety

Components initiating asynchronous actions must clean up their effects when unmounting. Any resolved or rejected promise that finishes after unmount must be silently discarded without invoking state dispatchers.

---

## 6. Accessibility Rules for the User Interface

The feed component must satisfy WCAG 2.0 Level AA across all states:

### 6.1 Loading State & Skeleton Loader

- The loading container must include `aria-busy="true"` and an accessible live status announcement (`role="status"`, `aria-live="polite"`).
- Skeleton placeholder cards must contain descriptive accessible text or an `aria-label="Loading feed content"` so screen reader users are informed of the background activity.
- Skeleton pulse animations must be paused or replaced by static styling when the user enables reduced motion:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .skeleton-card {
      animation: none !important;
      opacity: 0.7;
    }
  }
  ```

### 6.2 Error Announcement & Recovery

- When transitioning to `ERROR`, the error container must have `role="alert"` (which defaults to `aria-live="assertive"`), prompting assistive technology to immediately read the message.
- The **"Retry Connection"** control must be a native `<button>` element with clear descriptive text and a high-contrast focus indicator.

### 6.3 Contrast & Focus Visibility

- Contrast between body text and card background must exceed **4.5:1**.
- Contrast between interactive borders, focus rings, and backgrounds must exceed **3:1**.
- All interactive elements must exhibit a clearly defined `:focus-visible` ring with at least `2px` width and offset.

---

## 7. Git and Commit Rules

### 7.1 Conventional Commits

Commits must use the Conventional Commits format (`type(scope): description`).

### 7.2 Five Mandatory Atomic Milestones

| Step | Scope | Commit Message | Content |
| --- | --- | --- | --- |
| 1 | `types` | `feat(types): define resilient 4-state discriminated union` | FeedState, FeedItem, FeedAction types, assertNever helper |
| 2 | `api` | `feat(api): implement mock fetchFeed with latency and failure` | Mock fetchFeed with AbortSignal support and randomized error |
| 3 | `state` | `feat(state): implement feed state machine with race guard` | State machine hook/reducer, AbortController cancellation |
| 4 | `ui` | `feat(ui): implement skeleton loader and accessible views` | Skeleton CSS, prefers-reduced-motion, aria-busy, role="status" |
| 5 | `verify`| `test(verify): add automated resilience and accessibility tests` | Unit tests for race condition, unmount guard, error retry |

---

## 8. Definition of Done

A deliverable is marked **Done** only when all conditions are fulfilled:

### 8.1 Type Safety Correctness
- `FeedState` models all 4 states (`IDLE`, `LOADING`, `SUCCESS`, `ERROR`) as a discriminated union.
- `assertNever` verifies exhaustive coverage across all state switches at compile time.
- TypeScript compiler (`tsc --noEmit`) passes with zero errors and zero `any` usage.

### 8.2 Asynchronous Robustness
- Rapidly clicking "Retry" does not cause stale responses to override newer results.
- Triggering an unmount during `LOADING` produces no warnings or unhandled exceptions.
- `AbortController` cleanly terminates pending mock requests.

### 8.3 Accessibility Compliance
- Loading state announces `aria-busy="true"` and `role="status"`.
- Error state announces `role="alert"` and exposes a working "Retry Connection" button.
- CSS disables skeleton animations under `@media (prefers-reduced-motion: reduce)`.
- All text meets 4.5:1 contrast; interactive controls meet 3:1 contrast and focus visibility.

### 8.4 Version Control & Cleanliness
- Git log reflects atomic Conventional Commits matching Section 7.2.
- No `console.log` or debugging leftovers in production paths.
- All abbreviations are expanded on first use.
