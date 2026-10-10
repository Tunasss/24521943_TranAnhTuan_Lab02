# Lab 02: Pair-Programming Chat Transcript with AI Assistant

- **Course:** Web Application Development (MSIS3033.Q21.CTTT.1)
- **Student Name:** Trần Anh Tuấn
- **Student ID:** 24521943
- **Repository:** [https://github.com/Tunasss/24521943_TranAnhTuan_Lab02](https://github.com/Tunasss/24521943_TranAnhTuan_Lab02)
- **AI Assistant:** Antigravity (Advanced Agentic Coding Pair Programmer)
- **Session Date:** October 10, 2026

---

## Table of Contents

1. [Exercise 2: Reactive State Machine and Event Delegation Hub](#1-exercise-2-reactive-state-machine-and-event-delegation-hub)
   - [Phase 2.1: Work Breakdown Structure (TASK_DECOMPOSITION.md)](#phase-21-work-breakdown-structure-task_decompositionmd)
   - [Phase 2.2: Scaffolding (index.html & reactive-engine.js)](#phase-22-scaffolding-indexhtml--reactive-enginejs)
   - [Phase 2.3: Storage Layer (stateStore & resetCursor)](#phase-23-storage-layer-statestore--resetcursor)
   - [Phase 2.4: useState Dispatcher & Mounting Engine](#phase-24-usestate-dispatcher--mounting-engine)
   - [Phase 2.5: Root Event Delegation & Handler Registry](#phase-25-root-event-delegation--handler-registry)
   - [Phase 2.6: Task Manager UI (TaskApp, Filters, WCAG 2.0 AA)](#phase-26-task-manager-ui-taskapp-filters-wcag-20-aa)
   - [Phase 2.7: Checkpoint — Orphan Listener Verification](#phase-27-checkpoint--orphan-listener-verification)
2. [Exercise 3: Resilient State Machine & Skeleton Loader](#2-exercise-3-resilient-state-machine--skeleton-loader)
   - [Phase 3.1: Project Rules & Task Decomposition](#phase-31-project-rules--task-decomposition)
   - [Phase 3.2: TypeScript Types (Item & ViewState Discriminated Union)](#phase-32-typescript-types-item--viewstate-discriminated-union)
   - [Phase 3.3: Mock API (fetchFeed with Latency, 40% Failure & AbortSignal)](#phase-33-mock-api-fetchfeed-with-latency-40-failure--abortsignal)
   - [Phase 3.4: DataFeed State Logic with Race-Condition Guard](#phase-34-datafeed-state-logic-with-race-condition-guard)
   - [Phase 3.5: ESLint & Build Validation (const vs let timeoutId)](#phase-35-eslint--build-validation-const-vs-let-timeoutid)
   - [Phase 3.6: Animated Skeleton Loader & prefers-reduced-motion](#phase-36-animated-skeleton-loader--prefers-reduced-motion)
   - [Phase 3.7: Multi-State UI Completion (IDLE, SUCCESS, ERROR & Retry)](#phase-37-multi-state-ui-completion-idle-success-error--retry)
   - [Phase 3.8: Motion Accessibility Troubleshooting](#phase-38-motion-accessibility-troubleshooting)

---

## 1. Exercise 2: Reactive State Machine and Event Delegation Hub

### Phase 2.1: Work Breakdown Structure (TASK_DECOMPOSITION.md)

**User Prompt:**
> Now write TASK_DECOMPOSITION.md (WBS), 40 minutes total, WCAG 2.0 AA for content. One table per work package (ID, Task, Input, Output, Acceptance Criteria, Minutes). Work packages: 1 stateStore and resetCursor, 2 useState dispatcher with re-render, 3 root event delegation, 4 reactive Task Manager with filter toggles, 5 orphan listener verification.

**AI Actions & Output:**
- Analyzed `EX2/project-rules.md` requirements (closure store, cursor reset, single root listener, `createTextNode` XSS protection, `aria-pressed`, Visible focus ring).
- Generated `EX/EX2/TASK_DECOMPOSITION.md` with 5 detailed work packages and traceability matrix mapping to WCAG 2.0 criteria (1.3.1, 1.4.1, 1.4.11, 2.4.7, 4.1.2).

**Git Commit:**
```bash
git commit -m "chore(ex2): scaffold project files"
```

---

### Phase 2.2: Scaffolding (index.html & reactive-engine.js)

**User Prompt:**
> Bước 2.2. Scaffold. Tạo index.html (semantic, `<main>` chứa `<div id="app">`, module script) và reactive-engine.js rỗng. Viết bằng createElement(...) thay vì JSX.

**AI Actions & Output:**
- Created `EX/EX2/index.html` with semantic landmarks (`<header>`, `<main>`, `<section aria-label="...">`, `<div id="app">`).
- Linked ES Module script: `<script type="module" src="./reactive-engine.js"></script>`.
- Scaffolded `EX/EX2/reactive-engine.js`.

---

### Phase 2.3: Storage Layer (stateStore & resetCursor)

**User Prompt:**
> In reactive-engine.js implement only the storage layer:
> - `let stateStore = []; let cursor = 0;`
> - `export function resetCursor() { cursor = 0; }`
> - `export function getStateStore() for debugging.`
> No useState yet. Add English comments explaining why hooks must be called in the same order on every render.

**AI Actions & Output:**
- Implemented `stateStore`, `cursor`, `resetCursor()`, and `getStateStore()`.
- Added detailed documentation on why hooks rely on fixed call-order invariants rather than named keys to avoid slot misalignment.

**Git Commit:**
```bash
git commit -m "feat(state): implement stateStore and resetCursor engine"
```

---

### Phase 2.4: useState Dispatcher & Mounting Engine

**User Prompt:**
> Implement export function useState(initial):
> - capture const index = cursor; cursor++ ;
> - if stateStore[index] === undefined, set it to initial;
> - setState(next) accepts a value or an updater function(prev), writes to stateStore[index] only if the value changed (Object.is), then calls scheduleRender();
> - return [stateStore[index], setState].
> Also implement renderApp(Component, container), createElement, and renderToDOM. Test with console.log.

**AI Actions & Output:**
- Implemented `useState` with slot capture, initialization, and `Object.is` bail-out equality check.
- Built native VNode engine: `createElement`, `createTextElement`, `renderToDOM` (XSS-safe via `document.createTextNode`).
- Created automated test harness `EX/EX2/test-state.js`.
- Verified in Node.js:
  - ✓ Initial render passed
  - ✓ Direct value update passed
  - ✓ Functional updater passed
  - ✓ Object.is bail-out passed (no unnecessary re-render)
  - ✓ Multi-slot isolation passed

---

### Phase 2.5: Root Event Delegation & Handler Registry

**User Prompt:**
> Modify renderToDOM so that props starting with "on" are NOT attached with addEventListener. Instead:
> - keep a Map called handlerRegistry (cleared at start of every render),
> - give the element data-handler-id="<n>" and data-event="click" and store the function in the registry.
> Then in renderApp attach exactly ONE listener per event type (click) on the root container, only once (guard with a flag).

**AI Actions & Output:**
- Updated `renderToDOM` to assign `data-handler-id` and `data-event`, registering callbacks into `handlerRegistry`.
- Attached a single root listener on `#app` in `renderApp` guarded by `__hasDelegatedListener`.
- Updated `test-state.js` with Test 6:
  - ✓ 0 direct listeners on button element (`DONT-03` satisfied)
  - ✓ Exactly 1 root click listener on container (`DO-04` satisfied)
  - ✓ Click events bubble to root and update state
  - ✓ No listener accumulation across re-renders (`DONT-07` satisfied)

**Git Commit:**
```bash
git commit -m "feat(events): attach root event delegation listener"
```

---

### Phase 2.6: Task Manager UI (TaskApp, Filters, WCAG 2.0 AA)

**User Prompt:**
> Write TaskApp in app.js using my createElement and useState.
> State: tasks (array of { id, text, done }) and filter ('ALL' | 'ACTIVE' | 'DONE').
> UI: `<main>` with `<header><h2>Tasks: {count}</h2></header>`, a `<section>` with three filter `<button>`s using aria-pressed, an "Add Task" `<button>`, and a `<ul>` of `<li>` items, each with a toggle `<button>`. Filtered list must be derived from state, not stored. Seed initial ['Review PR', 'Verify AST'].

**AI Actions & Output:**
- Created `EX/EX2/app.js` with `TaskApp` component.
- Derived `filteredTasks` dynamically from `tasks` and `filter`.
- Created `EX/EX2/style.css` complying with WCAG 2.0 AA (contrast $\ge 4.5:1$, visible focus indicators with 3:1 contrast).
- Created automated test suite `EX/EX2/test-task-app.js`. All 6 tests passed.

---

### Phase 2.7: Checkpoint — Orphan Listener Verification

**User Prompt:**
> Checkpoint: DevTools → Elements → chọn 1 button → tab Event Listeners: không có click trên button, chỉ có trên #app. Hoặc Console: getEventListeners($0) khi chọn button phải rỗng.

**AI Support & Explanation:**
- Explained why `getEventListeners($0)` showed `{click: Array(1)}` when `$0` was unintentionally pointing to `#app`.
- Guided how to inspect the `<button>` element directly or run `getEventListeners(document.querySelector('button'))` returning `{}` (0 listeners).
- Verified container `#app` has exactly 1 listener.

**Git Commit:**
```bash
git commit -m "test(ex2): add orphan listener verification"
```

---

## 2. Exercise 3: Resilient State Machine & Skeleton Loader

### Phase 3.1: Project Rules & Task Decomposition

**User Prompt:**
> Write project-rules.md in English for "Resilient State Machine & Skeleton Loader" (TypeScript, 4-state lifecycle IDLE/LOADING/SUCCESS/ERROR, WCAG 2.0 AA). Code of conduct for AI with DO / MUST NOT tables. Write TASK_DECOMPOSITION.md (WBS), 35 minutes, 6 work packages.

**AI Actions & Output:**
- Created `EX/EX3/project-rules.md` (DO-01 to DO-14, DONT-01 to DONT-12, Discriminated unions, Async safety, Live regions, Reduced motion).
- Created `EX/EX3/TASK_DECOMPOSITION.md` with 6 work packages summing to exactly 35 minutes.

**Git Commit:**
```bash
git commit -m "docs(ex3): add project-rules and task decomposition"
```

---

### Phase 3.2: TypeScript Types (Item & ViewState Discriminated Union)

**User Prompt:**
> Create src/types.ts with: interface Item { id: number; title: string; } and the discriminated union ViewState<T> exactly as: IDLE | LOADING | SUCCESS with data: T | ERROR with error: string. No "any".

**AI Actions & Output:**
- Created `EX/EX3/src/types.ts` with `Item`, `ViewState<T>`, and `assertNever(x: never): never` exhaustiveness helper.

---

### Phase 3.3: Mock API (fetchFeed with Latency, 40% Failure & AbortSignal)

**User Prompt:**
> Create src/api.ts exporting async fetchFeed(signal?: AbortSignal): Promise<Item[]>. Waits 1.5s, fails randomly about 40% of the time with Error('Network unreachable. Please try again.'), rejects with AbortError if signal is aborted. Return 5 sample items.

**AI Actions & Output:**
- Implemented `EX/EX3/src/api.ts` with artificial 1500ms delay, `AbortSignal` listener cleanup, and 40% probabilistic network failure.

**Git Commit:**
```bash
git commit -m "feat(types): add Item and ViewState discriminated union, add mock fetchFeed with delay, random failure and abort"
```

---

### Phase 3.4: DataFeed State Logic with Race-Condition Guard

**User Prompt:**
> Create src/DataFeed.tsx in React + TypeScript.
> 1. Race conditions: store AbortController in useRef. Before each new load, abort previous. Abort on unmount via useEffect cleanup.
> 2. Pass signal to fetchFeed(signal).
> 3. In catch, ignore AbortError. Read message safely: err instanceof Error ? err.message : 'Unknown error'.
> 4. After await, if signal was aborted, do not call setState.
> 5. Render with switch on state.status with exhaustive never check.
> 6. Placeholders for IDLE, LOADING, SUCCESS, ERROR.

**AI Actions & Output:**
- Implemented `EX/EX3/src/DataFeed.tsx` adhering to all 7 criteria without `any`.

---

### Phase 3.5: ESLint & Build Validation (const vs let timeoutId)

**Issue Encountered:**
- ESLint reported: `41:9 error 'timeoutId' is never reassigned. Use 'const' instead prefer-const`.
- When changed to `const timeoutId;` without initializer, TypeScript failed with `TS1155`.

**AI Solution:**
- Restructured `src/api.ts` to initialize `const timeoutId = setTimeout(...)` directly and define `const onAbort` immediately after, closing over `timeoutId`.
- Both `npm run lint` and `npm run build` passed with 0 errors.

**Git Commit:**
```bash
git commit -m "fix(api): use const for timeoutId to satisfy lint"
git commit -m "feat(ui): add DataFeed state logic with race-condition guard"
```

---

### Phase 3.6: Animated Skeleton Loader & prefers-reduced-motion

**User Prompt:**
> Modify src/DataFeed.tsx and create src/DataFeed.css.
> - Add import './DataFeed.css'.
> - Create Skeleton component with 4 rows (`<li className="skeleton-row" aria-hidden="true" />`).
> - LOADING branch: `<section aria-busy="true" role="status" aria-label="Loading feed"><span className="visually-hidden">Loading feed</span><Skeleton /></section>`.
> - In DataFeed.css: `.skeleton-list`, `.skeleton-row` with `@keyframes pulse` and `@media (prefers-reduced-motion: reduce)`.

**AI Actions & Output:**
- Created `EX/EX3/src/DataFeed.css` with screen-reader utility, pulse animation, and reduced-motion fallback.
- Updated `EX/EX3/src/DataFeed.tsx` LOADING branch and mounted `DataFeed` in `EX/EX3/src/App.tsx`.

**Git Commit:**
```bash
git commit -m "feat(ui): add animated skeleton loader"
```

---

### Phase 3.7: Multi-State UI Completion (IDLE, SUCCESS, ERROR & Retry)

**User Prompt:**
> Modify IDLE, SUCCESS and ERROR branches of the switch, and add CSS:
> - ERROR: `<section className="feed-container error-view" role="alert"><h2>Something went wrong</h2><p>{state.error}</p><button className="btn" onClick={loadData}>Retry Connection</button></section>`.
> - IDLE: `<button className="btn" onClick={loadData}>Load Feed</button>`.
> - SUCCESS: `<ul className="feed-list">` with `<li>` showing `item.title`.
> - CSS: `.btn`, `.btn:focus-visible`, `.error-view`, `.feed-list`.

**AI Actions & Output:**
- Updated `src/DataFeed.tsx` and `src/DataFeed.css`.
- Preserved `loadData`, `useRef`, `useEffect`, `Skeleton`, and exhaustive `never` check.
- Contrast verified: Button contrast $> 4.5:1$, Error text contrast $> 11:1$, visible focus outline 3px.

**Git Commit:**
```bash
git commit -m "feat(ui): implement multi-state data component with skeleton feedback"
```

---

### Phase 3.8: Motion Accessibility Troubleshooting

**User Question:**
> "hiện tại nếu mà tôi để bth thì chỉ thấy 4 thanh skeleton đứng yên à"
> `window.matchMedia('(prefers-reduced-motion: reduce)').matches` returned `true`.

**AI Diagnosis & Explanation:**
1. Confirmed that code is 100% compliant with WCAG 2.2.2: Windows OS had *Animation effects* disabled, so the browser correctly respected the user's preference and stopped the animation.
2. Explained how to toggle *Animation effects* in Windows Settings or DevTools Rendering drawer to observe the pulse effect in action.

---

## 3. Final Verification Status

| Project | Check | Result |
|---|---|:---:|
| **EX1** | VNode Mounting & XSS Defense Tests | **PASS (5/5)** |
| **EX2** | Slot Isolation, Cursor Reset, Event Delegation | **PASS (6/6)** |
| **EX2** | TaskApp State, Filters, WCAG 2.0 AA | **PASS (6/6)** |
| **EX3** | TypeScript Compiler (`tsc -b`) | **PASS (0 errors)** |
| **EX3** | ESLint Linter (`eslint .`) | **PASS (0 warnings, 0 errors)** |
| **EX3** | Production Build (`vite build`) | **PASS** |
