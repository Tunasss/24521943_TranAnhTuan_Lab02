# Task Decomposition: Mini-React VNode and Mounting Engine

**Document type:** Work Breakdown Structure (WBS)\
**Project:** Mini-React VNode (Virtual Node) and Mounting Engine\
**Total estimated time:** 35 minutes\
**Governed by:** [project-rules.md](./project-rules.md)

## Table of Contents

1. [Work Package 1 — Setup](#1-work-package-1--setup)
2. [Work Package 2 — createElement and createTextElement](#2-work-package-2--createelement-and-createtextelement)
3. [Work Package 3 — renderToDOM](#3-work-package-3--rendertodom)
4. [Work Package 4 — XSS Verification](#4-work-package-4--xss-verification)
5. [Work Package 5 — DevTools Audit](#5-work-package-5--devtools-audit)
6. [Work Package 6 — Git Commits](#6-work-package-6--git-commits)
7. [Time Summary](#7-time-summary)

---

## 1. Work Package 1 — Setup

**Objective:** Create the project directory structure, initialize version control, and configure the code-quality tools so that all subsequent work packages start from a clean, reproducible baseline.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Minutes |
|---|---|---|---|---|---|
| 1.1 | Create the project folder structure (`src/`, `tests/`, `docs/`) | Empty working directory | Folder tree with `src/vnode.js`, `src/renderer.js`, `tests/vnode.test.js`, `tests/renderer.test.js`, and `docs/` | All folders and placeholder files exist; `ls` (list files) confirms the structure with no extra files | 1 |
| 1.2 | Initialize a Git (version control) repository with `git init` | Project folder | Hidden `.git/` directory; empty initial commit | Running `git status` shows a clean working tree on the `main` branch | 1 |
| 1.3 | Create `package.json` with `npm init -y` and install a test runner (for example, Vitest or Jest) as a development dependency | `package.json` scaffold | `node_modules/` directory; `package.json` with `devDependencies` listing the chosen test runner | Running `npm test` launches the test runner without errors, even with zero test files | 2 |
| 1.4 | Add an ESLint (JavaScript linter) configuration file (`.eslintrc.json`) with `no-eval`, `no-script-url`, and `no-unsanitized` rules enabled | Installed ESLint package | `.eslintrc.json` with at least the three required rules | Running `npx eslint src/` returns zero errors on empty source files | 1 |
| 1.5 | Create `project-rules.md` at the repository root (or verify it already exists) | This document and the existing rules file | `project-rules.md` present in the root directory | File is readable; its heading reads "Project Rules: Mini-React VNode and Mounting Engine" | 0 |

**Work Package 1 subtotal: 5 minutes**

---

## 2. Work Package 2 — createElement and createTextElement

**Objective:** Implement the two VNode factory functions from scratch in `src/vnode.js` so that callers can describe a UI tree using plain JavaScript objects.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Minutes |
|---|---|---|---|---|---|
| 2.1 | Write JSDoc (JavaScript Documentation) comment blocks for both functions before writing any implementation code | Function signatures and parameter descriptions | Documented stubs in `src/vnode.js` with `@param` and `@returns` tags | Running `npx jsdoc src/vnode.js` produces HTML documentation with no warnings | 1 |
| 2.2 | Implement `createTextElement(text)` to return a VNode with `type: "TEXT_ELEMENT"`, `props: { nodeValue: text }`, and `children: []` | A primitive string or number value | A plain JavaScript object matching the VNode schema | Unit test T-01: `createTextElement("hello")` returns `{ type: "TEXT_ELEMENT", props: { nodeValue: "hello" }, children: [] }` — test passes | 2 |
| 2.3 | Implement `createElement(type, props, ...children)` to return a VNode; wrap each primitive child with `createTextElement` | A tag-name string, a props object (or `null`), and zero or more children | A plain JavaScript object with `type`, `props`, and a `children` array | Unit test T-02: `createElement("p", null, "Hi")` returns an object where `children[0].type === "TEXT_ELEMENT"` — test passes | 3 |
| 2.4 | Handle `null` and `undefined` children by filtering them out inside `createElement` | A child value of `null` or `undefined` | No entry in the `children` array for that child | Unit test T-03: `createElement("section", null, null, "visible")` produces a `children` array of length 1 — test passes | 1 |
| 2.5 | Export both functions from `src/vnode.js` using ES Module (ECMAScript Module) `export` syntax | Implemented functions | Named exports `createElement` and `createTextElement` | Importing `{ createElement, createTextElement }` from `"./vnode.js"` in a test file resolves without errors | 1 |

**Work Package 2 subtotal: 8 minutes**

---

## 3. Work Package 3 — renderToDOM

**Objective:** Implement `renderToDOM(vnode, container)` in `src/renderer.js` so that a VNode tree is mounted onto a real DOM (Document Object Model) container with no orphan nodes and a structure that mirrors the VNode tree exactly.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Minutes |
|---|---|---|---|---|---|
| 3.1 | Write JSDoc comment blocks for `renderToDOM` before writing any implementation code | Function signature and parameter descriptions | Documented stub in `src/renderer.js` with `@param` and `@returns` tags | Running `npx jsdoc src/renderer.js` produces HTML documentation with no warnings | 1 |
| 3.2 | Implement the text-node branch: when `vnode.type === "TEXT_ELEMENT"`, call `document.createTextNode(vnode.props.nodeValue)` and append to `container` | A text VNode | A DOM text node appended to `container`; the function returns that text node | Unit test T-04: rendering `createTextElement("hello")` into a `<section>` produces one text node whose `nodeValue` is `"hello"` — test passes | 2 |
| 3.3 | Implement the element branch: call `document.createElement(vnode.type)`, apply props as attributes or event listeners, recurse over `vnode.children`, append to `container`, and return the element | An element VNode with props and children | A fully populated DOM subtree appended to `container`; the function returns the root element | Unit test T-05: rendering `createElement("p", { id: "intro" }, "Hi")` into a `<main>` produces a `<p id="intro">` with one text-child — test passes | 3 |
| 3.4 | Verify that the returned node count equals the VNode count (no orphan nodes) | A multi-level VNode tree | A DOM tree whose node count matches the VNode count | Unit test T-06: a three-level VNode tree (`<article>` > `<header>` > text) renders exactly three nodes, confirmed by querying `container.querySelectorAll("*").length + container.childNodes.length` | 2 |
| 3.5 | Export `renderToDOM` from `src/renderer.js` using ES Module `export` syntax | Implemented function | Named export `renderToDOM` | Importing `{ renderToDOM }` from `"./renderer.js"` in a test file resolves without errors | 1 |

**Work Package 3 subtotal: 9 minutes**

---

## 4. Work Package 4 — XSS Verification

**Objective:** Confirm that the renderer resists Cross-Site Scripting (XSS) — a class of injection attack — by demonstrating that a malicious child string is always stored as inert text, never as executable markup.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Minutes |
|---|---|---|---|---|---|
| 4.1 | Write unit test T-07: render a VNode whose child is the raw string `"<script>alert(1)</script>"` into a detached DOM container | The XSS payload string passed as a child to `createElement` | An automated test file entry in `tests/renderer.test.js` | Test file is syntactically valid and recognized by the test runner | 1 |
| 4.2 | Assert that the container contains zero `<script>` elements after rendering | Rendered DOM container | A passing assertion: `container.querySelectorAll("script").length === 0` | Test T-07, assertion A: `querySelectorAll("script").length` equals `0` — test passes | 1 |
| 4.3 | Assert that the raw XSS payload string appears verbatim as `.textContent` of the container | Rendered DOM container | A passing assertion on `.textContent` | Test T-07, assertion B: `container.textContent` equals `"<script>alert(1)</script>"` exactly (angle brackets preserved as literal characters) — test passes | 1 |
| 4.4 | Run ESLint on `src/renderer.js` and confirm zero occurrences of `innerHTML`, `outerHTML`, or `insertAdjacentHTML` | `src/renderer.js` | ESLint output with zero errors or warnings | `npx eslint src/renderer.js` exits with code 0; no `no-unsanitized` rule violations appear | 1 |

**Work Package 4 subtotal: 4 minutes**

---

## 5. Work Package 5 — DevTools Audit

**Objective:** Open the rendered output in a browser and use the browser's built-in Developer Tools (DevTools) to confirm that the DOM tree is correct, semantic, and free of orphan nodes.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Minutes |
|---|---|---|---|---|---|
| 5.1 | Create a minimal `index.html` that imports `src/vnode.js` and `src/renderer.js` as ES Modules and renders a sample VNode tree using only semantic elements from the approved list in `project-rules.md` Section 5.2 | Implemented source files | A working `index.html` that renders without JavaScript console errors | Opening `index.html` in a browser shows the rendered tree with no errors in the Console panel | 2 |
| 5.2 | Inspect the DOM tree in the browser's Elements panel and verify that every rendered element corresponds to a VNode; confirm no orphan nodes exist outside the mount container | Rendered `index.html` | A screenshot or written observation noting the node count | Node count in the Elements panel matches the VNode tree count; no stray nodes outside `#root` (or equivalent mount container) | 2 |
| 5.3 | Run the browser's built-in Accessibility (a11y) inspector or a tool such as axe DevTools (browser extension) against the rendered page and confirm zero critical accessibility violations | Rendered `index.html` | Accessibility audit report | Zero critical or serious violations reported; any warnings are documented with justification | 2 |

**Work Package 5 subtotal: 6 minutes**

---

## 6. Work Package 6 — Git Commits

**Objective:** Produce a clean, traceable Git history by creating one Conventional Commit per milestone, following the format defined in `project-rules.md` Section 6.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Minutes |
|---|---|---|---|---|---|
| 6.1 | Stage and commit the project scaffold (Work Package 1 output) with the message `chore: initialize project structure and linting config` | All files from Work Package 1 | Git commit M-01 | `git log --oneline` shows M-01 as the first commit; message matches the Conventional Commits format exactly | 0.5 |
| 6.2 | Stage and commit `src/vnode.js` and its tests with the message `feat(vnode): implement createTextElement function`, then repeat with `feat(vnode): implement createElement function` | Work Package 2 output | Git commits M-02 and M-03 | `git log --oneline` shows two separate commits for M-02 and M-03 in chronological order | 1 |
| 6.3 | Stage and commit `src/renderer.js` and its tests with the message `feat(renderer): implement renderToDOM mounting function` | Work Package 3 output | Git commit M-04 | `git log --oneline` shows M-04; `git diff HEAD~1 HEAD --stat` lists only renderer files | 0.5 |
| 6.4 | Stage and commit the XSS test additions with the message `test(security): add XSS injection resistance test` | Work Package 4 output | Git commit M-05 | `git log --oneline` shows M-05; running `npm test` after checkout of M-05 passes all tests | 0.5 |
| 6.5 | Stage and commit `index.html` and any DevTools notes with the message `test(html): add semantic element rendering tests` | Work Package 5 output | Git commit M-06 | `git log --oneline` shows M-06; no lint errors are introduced | 0.5 |
| 6.6 | Stage and commit finalized JSDoc comments and this `TASK_DECOMPOSITION.md` file with the message `docs: add JSDoc comments to all public functions` | Finalized documentation | Git commit M-07 | `git log --oneline` shows M-07 as the final commit; `git log --oneline | wc -l` equals 7 (seven total milestone commits) | 1 |

**Work Package 6 subtotal: 4 minutes** *(0.5 + 1 + 0.5 + 0.5 + 0.5 + 1 = 4 minutes)*

---

## 7. Time Summary

The table below aggregates estimated time across all six work packages. The total must not exceed 35 minutes.

| Work Package | Title | Estimated Minutes |
|---|---|---|
| WP-1 | Setup | 5 |
| WP-2 | createElement and createTextElement | 8 |
| WP-3 | renderToDOM | 9 |
| WP-4 | XSS Verification | 4 |
| WP-5 | DevTools Audit | 6 |
| WP-6 | Git Commits | 4 |
| **Total** | | **35** |

> [!IMPORTANT]
> If any individual task takes longer than its estimate, the assignee must note the actual time and the reason in a Git commit message body or in a brief comment in the relevant source file. This data is used to improve future estimates.

---

*This document is governed by the rules in [project-rules.md](./project-rules.md). Do not alter the Definition of Done (Section 7 of that file) without updating the Acceptance Criteria in this document accordingly.*
