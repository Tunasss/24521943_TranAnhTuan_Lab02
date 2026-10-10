# TASK_DECOMPOSITION.md — Work Breakdown Structure (WBS)

**Project:** Resilient State Machine & Skeleton Loader  
**Standard:** Web Content Accessibility Guidelines (WCAG) 2.0 Level AA for all user interface states  
**Total Budget:** 35 minutes  
**Reference:** `project-rules.md` — rule identifiers correspond to that specification  

---

## Work Package 1 — TypeScript Types & Exhaustiveness Check

Establish the immutable type foundation modeling the 4-state lifecycle as a discriminated union and implement compile-time exhaustiveness checking.

| ID | Task | Input | Output | Acceptance Criteria | Minutes |
|----|------|-------|--------|---------------------|---------|
| 1.1 | Define `FeedItem` interface and `FeedState` 4-state discriminated union (`IDLE`, `LOADING`, `SUCCESS`, `ERROR`) | TypeScript (TS) module file | Exported `FeedItem` and `FeedState` types | States are mutually exclusive; `items` is accessible only when `status === 'SUCCESS'`; zero `any` keywords used (DO-01, DO-03, DONT-01, DONT-02) | 2 |
| 1.2 | Implement `assertNever(x: never): never` utility and state action types for the machine | Types from 1.1 | Exported `assertNever` function and action union | Unhandled state in a switch block triggers TypeScript compiler error TS2345; runtime unexpected call throws descriptive error (DO-02) | 3 |

**Work Package 1 Total: 5 minutes**

---

## Work Package 2 — Mock `fetchFeed` with Latency and Failure Simulation

Create a simulated network service that mimics real-world latency, transient HTTP (HyperText Transfer Protocol) network errors, and supports request cancellation.

| ID | Task | Input | Output | Acceptance Criteria | Minutes |
|----|------|-------|--------|---------------------|---------|
| 2.1 | Create sample feed mock dataset and simulated asynchronous latency helper | Raw mock feed items | Promise-based delay returning feed items | Resolves after configurable delay (e.g., 800ms to 1500ms) with realistic post records (DO-06) | 2 |
| 2.2 | Implement probabilistic failure rate (e.g., 30% chance) and integrate `AbortSignal` cancellation support | Function from 2.1 | Exported `fetchFeed(signal?: AbortSignal)` | Rejects with `NetworkError` when simulated failure triggers; rejects immediately with `DOMException('Aborted', 'AbortError')` when signal aborts (DO-04, DO-06) | 4 |

**Work Package 2 Total: 6 minutes**

---

## Work Package 3 — State Transitions with Race-Condition Guard

Implement the core resilient state machine hook managing transitions across the 4 lifecycle states with strict concurrency controls.

| ID | Task | Input | Output | Acceptance Criteria | Minutes |
|----|------|-------|--------|---------------------|---------|
| 3.1 | Implement state reducer/hook handling transitions: `FETCH_START`, `FETCH_SUCCESS`, `FETCH_ERROR` | Types from WP 1 | Functional state management hook | Valid transitions update state immutably; impossible state combinations cannot be constructed (DO-01, DO-03) | 3 |
| 3.2 | Implement active request identifier token and `AbortController` cancellation for consecutive requests | Hook from 3.1 | Race-condition guarded fetch dispatcher | Discard stale responses if a newer fetch was started before the previous completed; previous request is aborted (DO-04, DONT-05) | 3 |
| 3.3 | Add component unmount guard to abort pending requests and prevent state updates on unmounted elements | Hook from 3.2 | Cleanup effect in hook | Unmounting component mid-flight aborts pending fetch and avoids React memory leak warnings (DO-05, DONT-03) | 2 |

**Work Package 3 Total: 8 minutes**

---

## Work Package 4 — Skeleton CSS & Accessible Loading State

Build visual skeleton placeholder cards with gentle pulse animations, honoring accessibility live region attributes and reduced motion preferences.

| ID | Task | Input | Output | Acceptance Criteria | Minutes |
|----|------|-------|--------|---------------------|---------|
| 4.1 | Construct skeleton placeholder card elements with semantic container and accessibility attributes | HTML/JSX structure | Skeleton feed layout with `aria-busy="true"` and `role="status"` | Assistive technologies announce loading status politely without repeating on every pulse tick (DO-07) | 3 |
| 4.2 | Implement CSS pulse/shimmer animation with `@media (prefers-reduced-motion: reduce)` override | `style.css` stylesheet | Animated skeleton styles with reduced-motion fallback | Skeleton cards pulse under normal settings; pulse halts and renders static placeholder with gentle opacity when reduced motion is preferred (DO-10, DONT-06) | 3 |

**Work Package 4 Total: 6 minutes**

---

## Work Package 5 — Error UI with "Retry Connection" Button

Render informative error states with immediate assistive technology announcements and a keyboard-accessible recovery mechanism.

| ID | Task | Input | Output | Acceptance Criteria | Minutes |
|----|------|-------|--------|---------------------|---------|
| 5.1 | Implement error display container marked with `role="alert"` (assertive live region) | Error state payload | Accessible error notice element | Screen readers announce failure immediately upon transition to `ERROR` state (DO-08, DONT-07) | 2 |
| 5.2 | Build interactive **"Retry Connection"** button with descriptive label and visible focus outline | Button element and retry handler | Styled, keyboard-accessible retry control | Clicking or pressing Enter/Space re-triggers the state machine to `LOADING`; focus ring meets 3:1 contrast ratio against background (DO-09, DO-11, DO-12) | 3 |

**Work Package 5 Total: 5 minutes**

---

## Work Package 6 — Manual & Automated Verification

Execute comprehensive quality checks verifying race-condition defense, unmount safety, contrast compliance, and assistive technology behavior.

| ID | Task | Input | Output | Acceptance Criteria | Minutes |
|----|------|-------|--------|---------------------|---------|
| 6.1 | Test rapid consecutive clicks on "Retry Connection" and slow network emulation to verify stale response rejection | Assembled application | Verified behavior log | Final state strictly mirrors the latest request result; no flickering or overwritten newer data (DO-04, §8.2) | 2 |
| 6.2 | Verify reduced motion emulation in browser DevTools and execute contrast check across all 4 states | Running application | Verification checklist and audit evidence | Pulse animation completely stops when `prefers-reduced-motion: reduce` is active; text contrast ratio >= 4.5:1 confirmed (DO-10, DO-11, §8.3) | 3 |

**Work Package 6 Total: 5 minutes**

---

## Summary

| Work Package | Description | Allocated Minutes |
|---|---|---|
| WP 1 | TypeScript Types & Exhaustiveness Check | 5 |
| WP 2 | Mock `fetchFeed` with Latency and Failure Simulation | 6 |
| WP 3 | State Transitions with Race-Condition Guard | 8 |
| WP 4 | Skeleton CSS & Accessible Loading State | 6 |
| WP 5 | Error UI with "Retry Connection" Button | 5 |
| WP 6 | Manual & Automated Verification | 5 |
| **Total** | | **35** |

---

## Traceability Matrix

| Deliverable | project-rules.md Rules | WCAG 2.0 Success Criteria |
|---|---|---|
| Discriminated union (`FeedState`) | DO-01, DO-03, DONT-01, DONT-02 | — |
| `assertNever` exhaustiveness guard | DO-02, DONT-04 | — |
| Race condition & stale response guard | DO-04, DONT-03, DONT-05 | — |
| AbortController & unmount cleanup | DO-05, DONT-03 | — |
| Mock `fetchFeed` API | DO-06 | — |
| Loading state live region (`aria-busy`, `role="status"`) | DO-07 | 4.1.3 Status Messages |
| Error state live region (`role="alert"`) | DO-08, DONT-09 | 4.1.3 Status Messages |
| Accessible "Retry Connection" button | DO-09, DO-12 | 2.1.1 Keyboard; 2.4.7 Focus Visible |
| Reduced motion media query (`prefers-reduced-motion`) | DO-10, DONT-06 | 2.2.2 Pause, Stop, Hide |
| Contrast compliance (>= 4.5:1 text, >= 3:1 UI) | DO-11, DONT-07, DONT-08 | 1.4.3 Contrast (Minimum); 1.4.11 Non-text Contrast |
| Conventional Commits & atomic milestones | DO-14, DONT-12, §7.2 | — |
