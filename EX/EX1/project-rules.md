# Project Rules: Mini-React VNode and Mounting Engine

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [What the AI Must Do](#2-what-the-ai-must-do)
3. [What the AI Must Not Do](#3-what-the-ai-must-not-do)
4. [Security Rules](#4-security-rules)
5. [Semantic HTML Rules](#5-semantic-html-rules)
6. [Git and Commit Rules](#6-git-and-commit-rules)
7. [Definition of Done](#7-definition-of-done)

---

## 1. Purpose and Scope

### 1.1 Purpose

This document is a **code of conduct for Artificial Intelligence (AI) assistants** working on the **Mini-React VNode (Virtual Node) and Mounting Engine** project. It establishes mandatory rules, prohibited behaviors, and quality standards that every AI assistant must follow when generating, reviewing, refactoring, or documenting code for this project.

The goal of these rules is to ensure that:

- All delivered code is secure, readable, and maintainable.
- The Virtual DOM (Document Object Model) implementation is correct and predictable.
- No orphan nodes appear in the rendered DOM tree.
- The project remains accessible and standards-compliant.

### 1.2 Scope

These rules apply to **all AI-generated output** in this project, including but not limited to:

- Source code files (JavaScript, HTML, CSS)
- Inline code suggestions within an editor
- Code review comments
- Documentation and README files
- Git commit messages

These rules govern the implementation of the three core functions:

- `createElement(type, props, ...children)` — creates a Virtual Node (VNode) object.
- `createTextElement(text)` — wraps a primitive value in a text VNode.
- `renderToDOM(vnode, container)` — mounts a VNode tree onto a real DOM container.

---

## 2. What the AI Must Do

The following table lists all mandatory rules the AI assistant must follow. Each rule has a unique identifier (ID) for traceability.

| ID | Rule | Reason |
|---|---|---|
| DO-01 | Implement `createElement` to return a plain JavaScript object with `type`, `props`, and `children` fields. | Ensures a predictable, inspectable VNode structure that other functions can consume reliably. |
| DO-02 | Implement `createTextElement` to wrap any primitive value (string or number) in a VNode with `type: "TEXT_ELEMENT"` and a `nodeValue` prop. | Allows the renderer to treat text and element nodes uniformly without special-casing every leaf node. |
| DO-03 | Implement `renderToDOM` to recursively walk the VNode tree and produce exactly one real DOM node per VNode. | Guarantees a one-to-one correspondence between the VNode tree and the DOM tree, preventing orphan or duplicate nodes. |
| DO-04 | Use `document.createTextNode(value)` exclusively to create text nodes in the DOM. | Prevents Cross-Site Scripting (XSS) attacks by treating the value as data, not markup. See Section 4 for details. |
| DO-05 | Use `document.createElement(type)` to create element nodes, where `type` is a valid HTML tag string. | Ensures the browser interprets the element correctly and links it to the right prototype chain. |
| DO-06 | Set element attributes and event listeners through `element.setAttribute(name, value)` or the `addEventListener` API, not through `innerHTML`. | Avoids HTML injection and keeps attribute handling predictable across all browsers. |
| DO-07 | Append every child node to its parent via `parent.appendChild(child)` before moving to the next sibling. | Maintains depth-first, left-to-right tree order so the rendered DOM matches the VNode tree exactly. |
| DO-08 | Use semantic HTML5 (HyperText Markup Language version 5) elements — such as `<main>`, `<section>`, `<header>`, `<footer>`, `<article>`, `<nav>`, `<button>`, and `<p>` — when constructing VNode trees in examples and tests. | Produces accessible, meaningful markup that screen readers and search engines can interpret correctly. |
| DO-09 | Write unit tests that pass a string containing `<script>alert(1)</script>` as a child and assert that no script element is injected into the DOM. | Provides automated, repeatable proof that the XSS protection in DO-04 is effective. |
| DO-10 | Follow Conventional Commits format for every Git commit message (for example: `feat: add createElement function`). | Enables automated changelog generation and makes project history searchable. |
| DO-11 | Expand every abbreviation on its first use in comments and documentation (for example: "Virtual DOM (Document Object Model)"). | Ensures all readers, regardless of background, can understand the codebase without external references. |
| DO-12 | Return the newly created DOM node from `renderToDOM` so that callers can inspect or attach it after mounting. | Makes the function composable and easier to test in isolation. |
| DO-13 | Handle `null` and `undefined` children gracefully by skipping them without throwing an error. | Mirrors the behavior expected of a production-grade renderer and prevents runtime crashes from optional children. |
| DO-14 | Document every public function with a JSDoc (JavaScript Documentation) comment block that includes `@param` and `@returns` tags. | Enables editor IntelliSense (intelligent code completion) and makes the API self-documenting. |

---

## 3. What the AI Must Not Do

The following table lists all prohibited behaviors. Violating any of these rules constitutes a failed deliverable.

| ID | Rule | Reason |
|---|---|---|
| DONT-01 | Never use `innerHTML`, `outerHTML`, or `insertAdjacentHTML` to insert content into the DOM. | These properties parse raw HTML strings and can execute injected scripts, creating a direct XSS vulnerability. |
| DONT-02 | Never use `eval()`, `new Function()`, or `setTimeout(string)` to execute dynamically constructed strings. | Dynamic code evaluation is a common attack vector and makes code behavior unpredictable and unauditable. |
| DONT-03 | Never produce orphan nodes — that is, nodes created via `document.createElement` or `document.createTextNode` that are never appended to a parent. | Orphan nodes consume memory, never appear on screen, and indicate a logic error in the tree-walking algorithm. |
| DONT-04 | Never use `<div>` as a structural replacement for semantic elements (a practice known as "div-soup"). | Divs carry no accessible role, so screen readers and assistive technologies cannot interpret the page structure. |
| DONT-05 | Never mutate the VNode object after it has been created. | VNodes must be treated as immutable snapshots; mutation causes reconciliation bugs when diffing future trees. |
| DONT-06 | Never set event handler attributes as HTML attribute strings (for example, `onclick="doSomething()"`). | String-based event handlers are parsed as JavaScript by the browser and create an XSS surface identical to `innerHTML`. |
| DONT-07 | Never commit code that contains `console.log`, `debugger`, or other debugging artifacts in production paths. | Debug statements pollute the console output and may leak sensitive state in production environments. |
| DONT-08 | Never skip writing or updating tests when adding new functionality. | Untested code is unverified code; every new feature must have at least one corresponding test case before the milestone is closed. |
| DONT-09 | Never use vague commit messages such as "fix stuff", "update", or "WIP" (Work In Progress). | Vague messages make it impossible to understand project history, trace regressions, or generate meaningful changelogs. |
| DONT-10 | Never ignore or suppress linting errors without an explicit, commented justification. | Suppressing lint rules silently hides real bugs and erodes confidence in code quality tooling. |
| DONT-11 | Never introduce third-party libraries for the core VNode and rendering logic. | The entire purpose of this project is to implement these features from scratch; external libraries defeat that learning objective. |
| DONT-12 | Never return `undefined` implicitly from `renderToDOM`. Always return the created DOM node. | An implicit `undefined` return breaks the composability requirement stated in DO-12 and causes silent failures. |

---

## 4. Security Rules

This section focuses on preventing **Cross-Site Scripting (XSS)** — a class of attack where malicious scripts are injected into a web page and executed in another user's browser.

### 4.1 The XSS Threat in a VNode Renderer

A VNode renderer that accepts arbitrary strings as children is a natural XSS target. If a child string such as `<script>alert(1)</script>` is ever treated as HTML markup, the browser will parse and execute the embedded script. This must never happen.

### 4.2 Mandatory Safe Text Insertion

**Rule:** The AI must always use `document.createTextNode(value)` to render string children into the DOM.

**Rule:** The AI must never use `element.innerHTML = value` or any equivalent API to insert text content.

**Correct implementation:**

```js
// Safe: the browser treats the string as data, not markup.
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: { nodeValue: text },
    children: [],
  };
}

function renderToDOM(vnode, container) {
  let domNode;

  if (vnode.type === "TEXT_ELEMENT") {
    // createTextNode encodes all HTML special characters automatically.
    domNode = document.createTextNode(vnode.props.nodeValue);
  } else {
    domNode = document.createElement(vnode.type);
    // Apply non-children props as attributes.
    Object.entries(vnode.props || {}).forEach(([name, value]) => {
      if (name.startsWith("on")) {
        const eventType = name.slice(2).toLowerCase();
        domNode.addEventListener(eventType, value);
      } else {
        domNode.setAttribute(name, value);
      }
    });
    // Recursively render children.
    vnode.children.forEach((child) => renderToDOM(child, domNode));
  }

  container.appendChild(domNode);
  return domNode;
}
```

**Prohibited implementation:**

```js
// PROHIBITED: never do this. Parses the string as HTML and executes scripts.
element.innerHTML = vnode.props.nodeValue;
```

### 4.3 XSS Test Requirement

The AI must produce or maintain a test that verifies the following behavior:

1. Call `renderToDOM` with a child whose value is the string `<script>alert(1)</script>`.
2. Assert that no `<script>` element exists anywhere in the container after rendering.
3. Assert that the raw string appears as a text node (that is, as `.textContent`), not as parsed HTML.

Passing this test is a prerequisite for the Definition of Done described in Section 7.

---

## 5. Semantic HTML Rules

### 5.1 Why Semantics Matter

Semantic HTML elements communicate the *meaning* and *role* of content to browsers, search engines, and assistive technologies such as screen readers. Using a `<div>` where a `<button>` is appropriate, for example, removes the built-in keyboard accessibility and accessible role that the `<button>` element provides for free.

"Div-soup" — a markup pattern where `<div>` elements are used for every structural purpose — is **banned** in this project.

### 5.2 Approved Elements

The following elements are approved for use in VNode trees:

| Element | Appropriate Use |
|---|---|
| `<main>` | The primary content area of a page; used once per page. |
| `<section>` | A thematic grouping of content with its own heading. |
| `<article>` | A self-contained piece of content (for example, a card or a post). |
| `<header>` | Introductory content for a page or section. |
| `<footer>` | Closing content for a page or section. |
| `<nav>` | A set of navigation links. |
| `<h1>` through `<h6>` | Headings in strict hierarchical order; do not skip levels. |
| `<p>` | A paragraph of text. |
| `<ul>` and `<ol>` | Unordered and ordered lists, respectively. |
| `<li>` | A list item inside `<ul>` or `<ol>`. |
| `<button>` | Any interactive control that triggers an action. |
| `<a>` | Navigation to another page or resource; must have descriptive link text. |
| `<label>` | A label associated with a form control via the `for` attribute. |
| `<input>` | A form input control; must always have an associated `<label>`. |
| `<form>` | A group of related form controls. |
| `<figure>` and `<figcaption>` | An illustration, diagram, or code sample with its caption. |

### 5.3 The div and span Exception

`<div>` and `<span>` may be used **only** when no semantic element is appropriate — for example, as a layout wrapper with no inherent meaning. In all such cases, the AI must add an `aria-label` or `role` attribute to provide an accessible name. The AI must include a comment explaining why no semantic element was suitable.

---

## 6. Git and Commit Rules

### 6.1 Commit Message Format

Every commit must follow the **Conventional Commits** specification (version 1.0.0). The format is:

```
<type>(<optional scope>): <short description>

[optional body]

[optional footer(s)]
```

Approved `type` values for this project:

| Type | When to Use |
|---|---|
| `feat` | Adding a new function, feature, or capability. |
| `fix` | Correcting a bug or incorrect behavior. |
| `test` | Adding or updating test cases only. |
| `docs` | Updating documentation, comments, or README files only. |
| `refactor` | Restructuring code without changing external behavior. |
| `chore` | Maintenance tasks such as updating configuration files. |
| `style` | Formatting changes that do not affect logic (whitespace, semicolons). |

### 6.2 One Commit per Milestone

The AI must produce exactly **one commit per project milestone**. Milestones for this project are defined as follows:

| Milestone ID | Milestone Name | Expected Commit Message Example |
|---|---|---|
| M-01 | Project scaffold and configuration | `chore: initialize project structure and linting config` |
| M-02 | Implement `createTextElement` | `feat(vnode): implement createTextElement function` |
| M-03 | Implement `createElement` | `feat(vnode): implement createElement function` |
| M-04 | Implement `renderToDOM` | `feat(renderer): implement renderToDOM mounting function` |
| M-05 | XSS resistance test | `test(security): add XSS injection resistance test` |
| M-06 | Semantic HTML integration tests | `test(html): add semantic element rendering tests` |
| M-07 | Full documentation pass | `docs: add JSDoc comments to all public functions` |

The AI must not squash unrelated changes into a single commit, nor split a single milestone into multiple commits, unless a commit exceeds a reasonable size and a `refactor` sub-commit is explicitly justified.

### 6.3 Branch Naming

Feature branches must follow the pattern `<type>/<short-slug>`, for example:

- `feat/create-element`
- `test/xss-resistance`
- `docs/jsdoc-pass`

### 6.4 Pull Request Requirements

Every pull request must include:

1. A title that matches its commit message.
2. A description that references the milestone ID it closes (for example: "Closes M-03").
3. At least one passing automated test before the request may be merged.

---

## 7. Definition of Done

A milestone or feature is considered **Done** only when all of the following criteria are met. The AI must verify each item before declaring work complete.

### 7.1 Functional Correctness

- `createElement(type, props, ...children)` returns a plain object with the correct `type`, `props`, and `children` fields.
- `createTextElement(text)` returns a VNode with `type: "TEXT_ELEMENT"` and `props.nodeValue` set to the given text.
- `renderToDOM(vnode, container)` produces a DOM subtree that matches the VNode tree structure node-for-node with no orphan nodes.
- Passing `null` or `undefined` as a child does not throw an error and produces no DOM node for that child.

### 7.2 Security

- Passing `<script>alert(1)</script>` as a child string results in a text node, not a parsed `<script>` element.
- The automated XSS test (Section 4.3) passes without modification.
- No use of `innerHTML`, `outerHTML`, `eval()`, or `new Function()` appears anywhere in the codebase.

### 7.3 Semantic Markup

- All example and test VNode trees use semantic elements from the approved list in Section 5.2.
- No bare `<div>` is used where a semantic element is appropriate.
- Any `<div>` or `<span>` used for layout includes an accessible `role` or `aria-label` attribute and a comment explaining its necessity.

### 7.4 Code Quality

- All public functions are documented with JSDoc comments including `@param` and `@returns` tags.
- No linting errors or warnings are present (unless suppressed with an explicit, commented justification).
- No `console.log`, `debugger`, or other debugging statements remain in production code paths.
- No third-party libraries are used for the core VNode or rendering logic.

### 7.5 Testing

- At least one unit test exists for each of the three core functions.
- The XSS resistance test passes.
- All tests pass in a clean environment with no prior state.

### 7.6 Version Control

- Every completed milestone has exactly one corresponding commit following the Conventional Commits format.
- No vague commit messages (such as "fix stuff" or "update") are present in the project history.
- The branch name follows the `<type>/<short-slug>` naming convention.

### 7.7 Documentation

- All abbreviations are expanded on first use in every source file and documentation file.
- The README (Read Me) file describes how to run the project and execute the tests.
- This `project-rules.md` file is present at the repository root and has not been deleted or altered without explicit approval.
