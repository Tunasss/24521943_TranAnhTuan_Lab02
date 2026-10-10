# Project Rules: Reactive State Machine and Event Delegation Hub

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [What the AI Must Do](#2-what-the-ai-must-do)
3. [What the AI Must Not Do](#3-what-the-ai-must-not-do)
4. [State Management Rules](#4-state-management-rules)
5. [Event Delegation Rules](#5-event-delegation-rules)
6. [Accessibility Rules for the Task Manager User Interface](#6-accessibility-rules-for-the-task-manager-user-interface)
7. [Git and Commit Rules](#7-git-and-commit-rules)
8. [Definition of Done](#8-definition-of-done)

---

## 1. Purpose and Scope

### 1.1 Purpose

This document is a **code of conduct for Artificial Intelligence (AI) assistants** working on the **Reactive State Machine (RSM) and Event Delegation Hub** project. It defines mandatory rules, prohibited behaviors, and quality standards that every AI assistant must follow when generating, reviewing, refactoring, or documenting code for this project.

The goal is to ensure that:

- State is managed through a single, controlled closure store — no untracked global mutable state.
- The Document Object Model (DOM) event system uses exactly one root listener, never per-element listeners.
- The Task Manager user interface (UI) meets Web Content Accessibility Guidelines (WCAG) 2.0 Level AA for interactive controls.
- All code is secure, readable, and maintainable.

### 1.2 Project Description

This project implements two interrelated systems from scratch:

- **Custom `useState` hook** — a closure-based state store that maintains an ordered queue of state slots, a cursor that resets before each render, and an immutable update pattern (no direct mutation of state values).
- **Event Delegation Hub** — a single event listener registered on the root container that intercepts all user interactions and dispatches them through a handler registry, eliminating the need for per-element listeners.

These systems power a **Task Manager UI** that allows users to add, complete, and filter tasks.

### 1.3 Scope

These rules apply to all AI-generated output in this project, including:

- JavaScript source files
- HTML (HyperText Markup Language) structure
- CSS (Cascading Style Sheets) styles
- Test code
- Documentation and README (Read Me) files
- Git commit messages

---

## 2. What the AI Must Do

The following table lists all mandatory rules. Each rule has a unique identifier (ID) for traceability.

| ID | Rule | Reason |
| --- | --- | --- |
| DO-01 | Implement `useState` as a closure over a single `store` array and a `cursor` integer. The cursor must reset to zero before every re-render call. | Ensures that each hook call always reads from and writes to the same slot across renders, which is the fundamental contract of the hook call-order rule. |
| DO-02 | Return a `[value, setter]` tuple from every `useState` call, where `setter` triggers a full re-render cycle. | Mirrors the React (JavaScript UI library) API so the pattern is familiar and testable. |
| DO-03 | Perform all state updates immutably: replace arrays with new arrays, replace objects with new objects using the spread operator or `Object.assign`. Never mutate the existing state value in place. | Mutation of state values breaks equality checks used to detect change and causes subtle, hard-to-reproduce bugs. |
| DO-04 | Register exactly one `'click'` event listener on the root container element using `container.addEventListener('click', handleEvent)`. | One listener handles all interactions with zero per-element overhead, satisfying the Event Delegation requirement. |
| DO-05 | Resolve every event handler through a **handler registry** — a plain JavaScript object or `Map` keyed by a `data-action` string attribute set on each interactive element. | Decouples element identity from handler logic; adding a new action requires only a new registry entry, not a new listener. |
| DO-06 | Use `document.createTextNode` for all text content rendered to the DOM (Document Object Model). Never use `innerHTML`, `outerHTML`, or `insertAdjacentHTML`. | Prevents Cross-Site Scripting (XSS) attacks by ensuring user-supplied strings are always treated as data, not markup. |
| DO-07 | Give every `<button>` element a visible, descriptive text label. | Screen readers announce button labels to users who cannot see the screen; an unlabeled button is inaccessible. |
| DO-08 | Add `aria-pressed="true"` or `aria-pressed="false"` to every filter toggle button and update the attribute on each re-render to reflect current state. | The `aria-pressed` attribute communicates toggle state to assistive technologies without relying on color or position alone. |
| DO-09 | Ensure every interactive element has a visible `:focus` outline in the CSS. Do not use `outline: none` or `outline: 0` without providing an equivalent visible alternative. | Visible focus indicators are required by WCAG (Web Content Accessibility Guidelines) 2.0 Success Criterion 2.4.7 (Focus Visible). |
| DO-10 | Document every exported function and module with JSDoc (JavaScript Documentation) comment blocks that include `@param` and `@returns` tags. | Enables editor IntelliSense (intelligent code completion) and makes the API self-documenting. |
| DO-11 | Expand every abbreviation on its first use in comments and documentation (for example: "Cross-Site Scripting (XSS)"). | Ensures readers of all backgrounds can understand the codebase without external references. |
| DO-12 | Follow the Conventional Commits specification for every Git commit message. | Enables automated changelog generation and makes the project history searchable and auditable. |
| DO-13 | Write at least one automated test for each of: `useState` slot isolation, cursor reset, immutable update, event registry dispatch, and XSS resistance. | Automated tests provide repeatable, machine-verifiable proof that each rule is enforced. |
| DO-14 | Remove the root event listener with `container.removeEventListener` when the application is torn down or unmounted. | Prevents memory leaks and stale handler references in long-running single-page applications. |

---

## 3. What the AI Must Not Do

The following table lists all prohibited behaviors. Violating any of these rules constitutes a failed deliverable.

| ID | Rule | Reason |
| --- | --- | --- |
| DONT-01 | Never use `innerHTML`, `outerHTML`, or `insertAdjacentHTML` to insert dynamic content into the DOM. | These APIs parse raw HTML strings and can execute injected scripts, creating a direct XSS vulnerability. |
| DONT-02 | Never store state in a plain global variable (for example `let tasks = []` at module scope outside the closure store). | Uncontrolled global mutable state bypasses the store's cursor mechanism, causing slot misalignment and unpredictable renders. |
| DONT-03 | Never call `addEventListener` on individual child elements (for example buttons or list items) inside the render function. | Per-element listeners accumulate on every re-render, causing memory leaks and duplicate handler calls. |
| DONT-04 | Never mutate a state value directly (for example `state.tasks.push(newTask)`). Always create a new array or object. | In-place mutation skips the setter function, meaning the cursor never advances and re-render is never triggered. |
| DONT-05 | Never call `useState` inside a conditional statement (`if`), a loop (`for`, `while`), or a nested callback. | Hook call order must be identical on every render; any branching breaks cursor alignment, causing wrong state to be read from the store. |
| DONT-06 | Never set event handlers as HTML attribute strings (for example `onclick="handleClick()"`). | Attribute-based handlers are evaluated by the browser as JavaScript strings and create an XSS surface equivalent to `innerHTML`. |
| DONT-07 | Never add more than one root event listener of the same event type on the root container. | Multiple root listeners cause every event to be dispatched multiple times, producing duplicate state updates and visual glitches. |
| DONT-08 | Never use `eval()`, `new Function()`, or `setTimeout(string)` anywhere in the codebase. | Dynamic code evaluation is an XSS vector and makes code behavior unpredictable and unauditable. |
| DONT-09 | Never remove or suppress an `aria-pressed` attribute from a filter toggle button. | Removing the attribute makes the toggle state invisible to screen readers, violating WCAG 2.0 Success Criterion 4.1.2 (Name, Role, Value). |
| DONT-10 | Never use vague commit messages such as "fix", "update", or "WIP" (Work In Progress). | Vague messages make it impossible to understand project history or trace regressions. |
| DONT-11 | Never commit code containing `console.log`, `debugger`, or other debugging artifacts in production paths. | Debug statements pollute console output and may leak sensitive state information. |
| DONT-12 | Never introduce third-party state management libraries (for example Redux or MobX) for the core state logic. | The purpose of this exercise is to implement the hook pattern from scratch; external libraries defeat the learning objective. |

---

## 4. State Management Rules

This section defines the precise invariants the AI must enforce when implementing the custom `useState` hook.

### 4.1 Closure Store Architecture

The store must be implemented as a module-level closure containing:

- `store` — an array that holds one state slot per `useState` call made during a single render pass.
- `cursor` — an integer index that points to the current slot. It starts at `0` and increments by `1` for each `useState` call.

```js
// Correct closure store architecture.
const store = [];   // Persistent across renders.
let cursor = 0;     // Reset to 0 before every render.
```

### 4.2 Hook Call Order Rule

The order in which `useState` is called within a render function must be **identical on every render**. The AI must:

- Never call `useState` inside an `if`, `else`, `for`, `while`, or `try` block.
- Never call `useState` inside an event handler or asynchronous callback.
- Always call every `useState` at the top level of the render function, unconditionally.

This rule exists because the cursor is the only mechanism by which `useState` knows which slot to read. Any branch that skips or adds a call shifts all subsequent cursors by one, causing wrong state values to be returned.

### 4.3 Cursor Reset Before Each Render

The render function must set `cursor = 0` as its **first statement**, before any component code runs.

```js
function render() {
  cursor = 0; // Always first — resets hook call alignment.
  // ... component code follows
}
```

Failure to reset the cursor means that on a second render, the first `useState` call reads from slot `N` (where `N` is the number of hooks called in the previous render) instead of slot `0`.

### 4.4 No Global Mutable State Outside the Store

All application state must live inside the `store` array. The following are prohibited at module scope:

- `let tasks = []`
- `let filter = 'all'`
- Any `var` or `let` variable that changes after initialization and affects rendering.

Configuration constants (values that never change after module load, for example `const MAX_TASKS = 100`) are permitted at module scope.

### 4.5 Immutable Update Pattern

Every state setter call must produce a **new value** rather than modifying the existing value. Required patterns:

| State type | Correct immutable pattern | Prohibited mutable pattern |
| --- | --- | --- |
| Array — add item | `setter([...prev, newItem])` | `prev.push(newItem); setter(prev)` |
| Array — remove item | `setter(prev.filter(i => i.id !== id))` | `prev.splice(index, 1); setter(prev)` |
| Array — update item | `setter(prev.map(i => i.id === id ? { ...i, done: true } : i))` | `prev[index].done = true; setter(prev)` |
| Object — update field | `setter({ ...prev, filter: 'active' })` | `prev.filter = 'active'; setter(prev)` |
| Primitive | `setter(prev + 1)` | `prev++; setter(prev)` |

---

## 5. Event Delegation Rules

Event delegation means that a **single listener on a parent element** handles events that bubble up from all descendant elements. This project uses exactly one `'click'` listener on the root container.

### 5.1 One Root Listener

The AI must register the root listener exactly once, outside the render function:

```js
// Correct: registered once, outside render.
container.addEventListener('click', handleEvent);

function render() {
  cursor = 0;
  // ... renders child elements — no addEventListener calls inside here
}
```

Placing `addEventListener` inside `render` means a new listener is added on every re-render, causing the handler to fire `N` times after `N` renders.

### 5.2 Zero Listeners on Child Elements

No interactive child element (`<button>`, `<input>`, `<a>`) may have its own event listener added directly. All interaction must bubble to the root listener.

### 5.3 Handler Registry

The root handler function must resolve which action to perform by reading a `data-action` attribute from the event target (or its closest ancestor with that attribute). The action string is then looked up in a registry object.

```js
// Required registry pattern.
const registry = {
  'add-task':      () => { /* ... */ },
  'toggle-task':   (el) => { /* ... */ },
  'filter-all':    () => { /* ... */ },
  'filter-active': () => { /* ... */ },
  'filter-done':   () => { /* ... */ },
};

function handleEvent(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return; // Click was on a non-interactive area.
  const action = target.dataset.action;
  if (registry[action]) {
    registry[action](target, event);
  }
}
```

### 5.4 `data-action` Naming Convention

All `data-action` attribute values must use **kebab-case** (lowercase words separated by hyphens). Examples: `add-task`, `toggle-task`, `filter-active`. This ensures consistent, predictable keys in the registry.

### 5.5 Task Identity via `data-id`

When an action needs to identify a specific task (for example `toggle-task`), the element must carry a `data-id` attribute containing the task's unique identifier. The handler reads `target.dataset.id` to find the correct task in state.

---

## 6. Accessibility Rules for the Task Manager User Interface

The Task Manager UI must meet WCAG (Web Content Accessibility Guidelines) 2.0 Level AA for all interactive controls.

### 6.1 Buttons Must Have Descriptive Text Labels

Every `<button>` element must have a visible text label that describes its action. Labels such as "Add", "Complete", "All", "Active", and "Done" are acceptable. Icon-only buttons must include an `aria-label` attribute with a descriptive text equivalent.

**Correct:**

```html
<button data-action="add-task">Add Task</button>
```

**Prohibited:**

```html
<button data-action="add-task">+</button>  <!-- No text meaning; needs aria-label -->
```

### 6.2 `aria-pressed` on Filter Toggle Buttons

Each filter toggle button (All, Active, Done) must have an `aria-pressed` attribute that reflects the currently active filter on every render:

- `aria-pressed="true"` — this filter is currently selected.
- `aria-pressed="false"` — this filter is not currently selected.

The attribute must be set programmatically in the render function, not hardcoded in HTML. Relying solely on a CSS class or color to show the active filter violates WCAG 2.0 Success Criterion 1.4.1 (Use of Color).

### 6.3 Visible Focus Indicator

All interactive elements must display a clearly visible focus ring when focused via keyboard. The AI must:

- Never write `outline: none` or `outline: 0` in CSS without providing a custom, equally visible focus style.
- Use a minimum contrast ratio of 3:1 between the focus indicator color and the surrounding background (WCAG 2.0 Success Criterion 1.4.11, Non-text Contrast).

### 6.4 Task List Semantics

The task list must use a `<ul>` (unordered list) element with `<li>` (list item) children. This communicates list structure to screen readers, which announce the number of items and allow navigation by item.

### 6.5 Form Input Label Association

The text input for entering a new task must have an associated `<label>` element linked via the `for` attribute matching the input's `id`. A placeholder attribute alone is not a sufficient label because it disappears when the user starts typing.

---

## 7. Git and Commit Rules

### 7.1 Conventional Commits Format

Every commit must follow the **Conventional Commits** specification (version 1.0.0):

```
<type>(<optional scope>): <short description>

[optional body]

[optional footer(s)]
```

### 7.2 The Four Mandatory Atomic Commits

This project requires exactly **four atomic commits**, one per milestone. An atomic commit contains only the changes belonging to that milestone — no unrelated files.

| Commit Number | Milestone | Required Commit Message |
| --- | --- | --- |
| 1 | Custom `useState` hook with closure store, cursor reset, and immutable setter | `feat(state): implement useState hook with closure store` |
| 2 | Event Delegation Hub — root listener, handler registry, `data-action` dispatch | `feat(events): implement event delegation hub with registry` |
| 3 | Task Manager UI render function — add, toggle, filter tasks; `aria-pressed` on filters | `feat(ui): implement task manager render with accessibility` |
| 4 | XSS verification tests, accessibility audit evidence, README documentation | `test(audit): add XSS and accessibility verification evidence` |

### 7.3 Rules for Each Commit

- **Commit 1** must contain only the state module file and its unit tests. It must not include any DOM rendering code.
- **Commit 2** must contain only the event hub module and its unit tests. It must not touch the state module.
- **Commit 3** must contain the render function and updated HTML. All `aria-pressed` attributes must be present and correct before this commit is made.
- **Commit 4** must contain test result screenshots in the `evidence/` directory and the completed README. No functional code changes are permitted in this commit.

### 7.4 Prohibited Commit Patterns

- Do not squash all four milestones into one commit.
- Do not split a single milestone across multiple commits.
- Do not use vague messages (DONT-10).
- Do not commit files containing `console.log` or `debugger` statements (DONT-11).

---

## 8. Definition of Done

A milestone or the project as a whole is considered **Done** only when all of the following criteria are met. The AI must verify each item before declaring work complete.

### 8.1 State Management Correctness

- `useState` returns the correct `[value, setter]` tuple on the first render.
- After a setter call, the render function re-executes with `cursor` reset to `0`.
- Multiple independent `useState` calls in the same render function each maintain their own isolated slot; calling one setter does not affect another slot's value.
- All state updates use immutable patterns from Section 4.5; no direct mutation of state arrays or objects is present anywhere in the codebase.
- No application state is stored in any variable outside the closure store (Section 4.4).

### 8.2 Event Delegation Correctness

- Exactly one `'click'` listener exists on the root container at any point in time.
- No child element carries its own event listener.
- The handler registry contains entries for all five actions: `add-task`, `toggle-task`, `filter-all`, `filter-active`, `filter-done`.
- Clicking an element with no `data-action` attribute does not throw an error.
- The root listener is removed when the application is unmounted.

### 8.3 Security

- Passing `<script>alert(1)</script>` as a task title renders it as literal text; no `<script>` element appears in the DOM.
- Passing `<img onerror=alert(1)>` as a task title renders as literal text; no alert fires.
- No use of `innerHTML`, `outerHTML`, `eval()`, or `new Function()` appears anywhere in the codebase.
- ESLint (JavaScript linter) reports zero `no-unsanitized` violations.

### 8.4 Accessibility

- Every `<button>` has a descriptive text label or `aria-label` attribute.
- Every filter toggle button has `aria-pressed` set to `"true"` or `"false"` on each render.
- Every interactive element has a visible focus outline; no `outline: none` without an equivalent style is present.
- The task list uses `<ul>` and `<li>` elements.
- The new-task `<input>` has an associated `<label>` linked via `for` and `id`.
- An automated accessibility audit tool (for example axe DevTools browser extension) reports zero critical violations.

### 8.5 Code Quality

- All exported functions have JSDoc comments with `@param` and `@returns` tags.
- No linting errors or warnings are present (unless suppressed with an explicit, commented justification).
- No `console.log`, `debugger`, or debugging statements remain in production code paths.
- No third-party state management libraries are present in `package.json`.

### 8.6 Version Control

- Exactly four commits are present in the project history, matching the messages in Section 7.2.
- No vague commit messages are present.
- `git log --oneline` shows four lines, one per milestone.

### 8.7 Documentation

- All abbreviations are expanded on first use in every source file and documentation file.
- The README describes how to run the project and execute the test suite.
- The `evidence/` directory contains at least two screenshots: one showing the XSS payload rendered as text, and one showing the Elements panel with the correct DOM structure.
- This `project-rules.md` file is present at the repository root and has not been altered without explicit approval.
