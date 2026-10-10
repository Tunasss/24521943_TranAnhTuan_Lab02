# TASK_DECOMPOSITION.md — Work Breakdown Structure (WBS)

**Project:** Reactive State Machine (RSM) and Event Delegation Hub  
**Standard:** Web Content Accessibility Guidelines (WCAG) 2.0 Level AA for all interactive controls  
**Total Budget:** 40 minutes  
**Reference:** `project-rules.md` — all rule IDs cited below map to that document  

---

## Work Package 1 — `stateStore` and `resetCursor`

Build the closure-based state store module and verify that the cursor resets correctly before every render cycle.

| ID | Task | Input | Output | Acceptance Criteria | Minutes |
|----|------|-------|--------|---------------------|---------|
| 1.1 | Declare `store` array and `cursor` integer inside a module-level closure | Empty JavaScript (JS) module file | `const store = []; let cursor = 0;` inside a closure | `store` and `cursor` are not accessible from outside the module scope (DO-01, DONT-02) | 2 |
| 1.2 | Implement `useState(initialValue)` function that reads from and writes to `store[cursor]` | Closure from 1.1 | `useState` function that initialises `store[cursor]` on first call and returns the current value | First call with `initialValue = 'hello'` stores `'hello'` at `store[0]`; second call stores at `store[1]` (DO-01) | 3 |
| 1.3 | Return `[value, setter]` tuple from `useState`; setter must call `render()` after writing to the store | `useState` from 1.2 | `[value, setter]` destructurable tuple | `const [v, set] = useState(0); set(1);` causes `render` to be called and `store[0] === 1` (DO-02) | 2 |
| 1.4 | Implement `resetCursor()` — sets `cursor = 0` — and call it as the **first statement** of every `render()` invocation | `render` function shell | `cursor` equals `0` at the start of every render | After two renders each calling two `useState` hooks, `store.length === 2` and `cursor === 2` at render end, then resets to `0` at next render start (DO-01, section 4.3) | 2 |
| 1.5 | Write unit tests: slot isolation, cursor reset, and immutable update | Completed 1.1-1.4 | Passing test suite output | Tests for slot isolation, cursor reset, and immutable update all pass; no `console.log` in production paths (DO-13, DONT-11) | 3 |

**Work Package 1 Total: 12 minutes**

---

## Work Package 2 — `useState` Dispatcher with Re-render

Extend the setter returned by `useState` so that every state mutation triggers a full, synchronous re-render cycle, and enforce the immutable update pattern.

| ID | Task | Input | Output | Acceptance Criteria | Minutes |
|----|------|-------|--------|---------------------|---------|
| 2.1 | Implement immutable setter: `setter(nextValue)` writes `store[slotIndex] = nextValue` then calls `render()` | `useState` from WP 1 | Setter function captured over `slotIndex` via closure | `setter([...prev, item])` stores a **new** array reference; `setter(prev)` where `prev` is unchanged does not create a new reference (DO-03, DONT-04) | 2 |
| 2.2 | Verify that calling `setter` from inside a conditional, loop, or callback is guarded against — add a JSDoc (JavaScript Documentation) `@throws` note warning developers | Setter from 2.1 | JSDoc comment on `useState` | JSDoc block contains `@param`, `@returns`, and a `@throws` note; no conditional `useState` call exists in any render path (DO-10, DONT-05) | 2 |
| 2.3 | Confirm multiple independent `useState` calls in one render each maintain isolated slots after repeated setter invocations | Two `useState` calls in a single render | Stable slot values across five re-renders | `useState(0)` at slot 0 and `useState('all')` at slot 1: calling slot-0 setter never corrupts slot-1 value and vice versa (section 8.1) | 2 |
| 2.4 | Add JSDoc comments with `@param` and `@returns` tags to `useState` and `resetCursor` | Source from 2.1-2.3 | Documented source file | Every exported function has a complete JSDoc block; editor IntelliSense resolves type hints (DO-10, DO-11) | 2 |

**Work Package 2 Total: 8 minutes**

---

## Work Package 3 — Root Event Delegation

Register exactly one `'click'` listener on the root container, wire it to a handler registry keyed by `data-action` attributes, and ensure it is properly removed on teardown.

| ID | Task | Input | Output | Acceptance Criteria | Minutes |
|----|------|-------|--------|---------------------|---------|
| 3.1 | Register `container.addEventListener('click', handleEvent)` **once**, outside `render()` | HTML root container element | Single listener registration line | Opening DevTools — Event Listeners panel on `container` shows exactly one `click` entry at any point after multiple renders (DO-04, DONT-07) | 2 |
| 3.2 | Implement `handleEvent(event)`: traverse to nearest ancestor with `[data-action]` via `event.target.closest('[data-action]')`; look up action in registry; call matched handler | Listener from 3.1 | `handleEvent` function | Clicking a button with `data-action="add-task"` invokes `registry['add-task']`; clicking a non-interactive area returns without error (DO-05, section 5.3) | 2 |
| 3.3 | Build handler registry object with entries for all five actions: `add-task`, `toggle-task`, `filter-all`, `filter-active`, `filter-done` | `handleEvent` from 3.2 | Registry object with five keys | Registry contains exactly the five keys; each key uses kebab-case; attempting `registry['unknown']` returns `undefined` without throwing (DO-05, section 5.4) | 2 |
| 3.4 | Add `data-id` attribute to each task's DOM (Document Object Model) element; handler for `toggle-task` reads `target.dataset.id` | Registry from 3.3 | `toggle-task` handler that uses `data-id` | Clicking the toggle button of task with `id = 'abc'` reads `'abc'` from `dataset.id` and updates only that task's `done` property immutably (section 5.5, DO-03) | 1 |
| 3.5 | Implement teardown: expose a `destroy()` function that calls `container.removeEventListener('click', handleEvent)` | Listener from 3.1 | `destroy()` function | After `destroy()`, clicking any button produces no handler invocations; Event Listeners panel shows zero `click` entries on `container` (DO-14, section 8.2) | 1 |

**Work Package 3 Total: 8 minutes**

---

## Work Package 4 — Reactive Task Manager with Filter Toggles

Wire the state store and event delegation hub together into a rendered Task Manager User Interface (UI) that adds tasks, toggles completion, and filters the list — with full WCAG 2.0 Level AA accessibility on all interactive controls.

| ID | Task | Input | Output | Acceptance Criteria | Minutes |
|----|------|-------|--------|---------------------|---------|
| 4.1 | Implement `render()`: call `resetCursor()` first, then call `useState` for tasks array and active filter string | WP 1 + WP 2 | Render function shell | `cursor === 0` is the first operation; two `useState` calls follow unconditionally at the top level; no `useState` inside any `if` or loop (section 4.3, DONT-05) | 1 |
| 4.2 | Build the task list DOM nodes using `document.createTextNode` only; render filtered subset based on current filter value | Render shell from 4.1 | `<ul>` with `<li>` children, no `innerHTML` | Passing `<script>alert(1)</script>` as a task title renders as literal text node; no `<script>` tag appears in the DOM; DevTools Elements panel confirms `<ul>` and `<li>` structure (DO-06, DO-07, section 6.4, section 8.3) | 2 |
| 4.3 | Render three filter toggle buttons ("All", "Active", "Done") with `data-action` attributes; set `aria-pressed="true"` on the active filter and `aria-pressed="false"` on the others on every render | Render function from 4.2 | Three `<button>` elements with `aria-pressed` | Switching filter via click: previously active button has `aria-pressed="false"`, newly active button has `aria-pressed="true"`; verified programmatically via `getAttribute` (DO-08, DONT-09, section 6.2) | 2 |
| 4.4 | Add `<label for="task-input">` linked to `<input id="task-input">` for the new-task text field | HTML and render function | Label-input pair | `document.querySelector('label[for="task-input"]')` returns a non-null element; placeholder text is **in addition to**, not a replacement for, the label (section 6.5, section 8.4) | 1 |
| 4.5 | Apply CSS (Cascading Style Sheets) visible focus ring to all interactive elements; confirm contrast ratio is at least 3:1 | `index.css` stylesheet | Focus styles for `button` and `input` | No `outline: none` or `outline: 0` without an equivalent custom focus style; manual keyboard tab through all controls shows a clearly visible ring; contrast ratio verified via browser DevTools color picker (DO-09, section 6.3) | 1 |
| 4.6 | Verify "Add Task" button has descriptive visible text label; all action buttons meet button-label rule | Rendered HTML | Accessible button markup | Every `<button>` has non-empty visible text or an `aria-label`; axe DevTools browser extension reports zero critical violations on the Task Manager page (DO-07, section 6.1, section 8.4) | 1 |

**Work Package 4 Total: 8 minutes**

---

## Work Package 5 — Orphan Listener Verification

Prove, through tooling and automated tests, that no child element accumulates its own `click` listener across multiple re-renders, and that the root listener count stays exactly one.

| ID | Task | Input | Output | Acceptance Criteria | Minutes |
|----|------|-------|--------|---------------------|---------|
| 5.1 | Open DevTools — Elements — Event Listeners panel; trigger 10 sequential re-renders (e.g., add 10 tasks); inspect `container` and each `<button>` for listener count | Running application after WP 3-4 | Screenshot of Event Listeners panel | `container` shows exactly one `click` listener; every `<button>` and `<li>` shows zero direct listeners (DONT-03, section 8.2) | 1 |
| 5.2 | Write an automated test: after N renders, assert `getEventListeners(container).click.length === 1` using Chrome DevTools Protocol (CDP) or a testing harness that exposes listener counts | Test harness | Passing assertion | Test fails if a second listener is added to `container`; test passes for N = 1, 5, and 20 renders (DONT-07, DO-13) | 2 |
| 5.3 | Write an automated test: assert no child element returned by `container.querySelectorAll('button, input, li')` has any registered `click` listener | Test harness | Passing assertion for all child elements | All child elements have zero direct `click` listeners after 20 renders; test is committed with the evidence in `evidence/` directory (DONT-03, DO-13) | 1 |
| 5.4 | Call `destroy()`; verify listener removal; add evidence screenshot to `evidence/` directory | `destroy()` from WP 3.5 | Screenshot and test assertion | After `destroy()`, `getEventListeners(container).click` is `undefined` or empty; screenshot saved as `evidence/listener-removal.png` (DO-14, section 7.3) | 1 |
| 5.5 | Compile all evidence (XSS screenshot, DOM structure screenshot, listener-removal screenshot, axe audit report) into `evidence/` and finalize commit 4 with message `test(audit): add XSS and accessibility verification evidence` | Completed WP 1-5.4 | `evidence/` directory + commit 4 | `git log --oneline` shows exactly four commits matching section 7.2; all evidence files are present; no `console.log` or `debugger` in any committed file (DO-12, DONT-10, DONT-11, section 8.6, section 8.7) | 3 |

**Work Package 5 Total: 8 minutes**

---

## Summary

| Work Package | Description | Allocated Minutes |
|---|---|---|
| WP 1 | `stateStore` and `resetCursor` | 12 |
| WP 2 | `useState` dispatcher with re-render | 8 |
| WP 3 | Root event delegation | 8 |
| WP 4 | Reactive Task Manager with filter toggles | 8 |
| WP 5 | Orphan listener verification | 8 |
| **Total** | | **44** |

> **Budget note:** The work packages sum to 44 minutes, 4 minutes over the 40-minute target.
> Recommended mitigation: overlap evidence capture in WP 5.5 with implementation in WP 4 (save 2 min), and condense WP 1.5 and WP 2.2 by writing tests inline during coding (save 2 min).

---

## Traceability Matrix

| Deliverable | project-rules.md Rules | WCAG 2.0 Success Criteria |
|---|---|---|
| Closure store + cursor reset | DO-01, DO-02, DONT-02 | — |
| Immutable setters | DO-03, DONT-04 | — |
| Root listener (one only) | DO-04, DONT-03, DONT-07, DO-14 | — |
| Handler registry + `data-action` | DO-05, sections 5.3-5.5 | — |
| `createTextNode` (no `innerHTML`) | DO-06, DONT-01 | — |
| Button text labels | DO-07 | 4.1.2 Name, Role, Value |
| `aria-pressed` on filter toggles | DO-08, DONT-09 | 1.4.1 Use of Color; 4.1.2 Name, Role, Value |
| Visible focus ring, contrast ratio at least 3:1 | DO-09 | 2.4.7 Focus Visible; 1.4.11 Non-text Contrast |
| JSDoc on all exports | DO-10, DO-11 | — |
| Conventional Commits (four atomic) | DO-12, DONT-10, section 7.2 | — |
| Automated tests (five scenarios) | DO-13 | — |
| Label-input association | section 6.5 | 1.3.1 Info and Relationships |
| `<ul>` / `<li>` task list semantics | section 6.4 | 1.3.1 Info and Relationships |
