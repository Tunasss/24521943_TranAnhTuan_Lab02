/**
 * @file mini-react.js
 * @description Stub module for the Mini-React VNode (Virtual Node) and
 * Mounting Engine. Exports two functions that must be implemented from
 * scratch as part of this lab exercise:
 *   - createElement  — VNode factory
 *   - renderToDOM    — mounts a VNode tree onto a real DOM container
 *
 * Rules in force (see project-rules.md):
 *   DO-04  : Use document.createTextNode, never innerHTML.
 *   DO-11  : Expand all abbreviations on first use.
 *   DONT-11: No third-party libraries for core logic.
 */

/**
 * Creates a Virtual Node (VNode) — a plain JavaScript object that
 * describes a DOM element or text node.
 *
 * @param {string} type - The HTML tag name (for example "section" or "p").
 * @param {Object|null} props - Key-value pairs of HTML attributes and
 *   event listeners, or null when there are no props.
 * @param {...(Object|string|number|null|undefined)} children - Zero or
 *   more child VNodes or primitive values. Primitive values are
 *   automatically wrapped with createTextElement. Null and undefined
 *   values are silently ignored.
 * @returns {{ type: string, props: Object, children: Object[] }} A plain
 *   VNode object.
 */
export function createElement(type, props, ...children) {
  // TODO (Milestone M-03): implement this function.
  // Remove the line below and replace it with the real implementation.
  throw new Error(
    "createElement is not yet implemented. " +
      "See TASK_DECOMPOSITION.md Work Package 2, task 2.3."
  );
}

/**
 * Creates a text VNode — a Virtual Node whose type is the sentinel string
 * "TEXT_ELEMENT". The renderer uses this sentinel to decide whether to call
 * document.createTextNode (safe) instead of document.createElement.
 *
 * @param {string|number} text - The text content to wrap.
 * @returns {{ type: "TEXT_ELEMENT", props: { nodeValue: string|number }, children: [] }}
 *   A plain text VNode object.
 */
export function createTextElement(text) {
  // TODO (Milestone M-02): implement this function.
  // Remove the line below and replace it with the real implementation.
  throw new Error(
    "createTextElement is not yet implemented. " +
      "See TASK_DECOMPOSITION.md Work Package 2, task 2.2."
  );
}

/**
 * Mounts a VNode tree onto a real DOM (Document Object Model) container
 * node. Recursively creates DOM nodes that mirror the VNode tree exactly,
 * with no orphan nodes.
 *
 * Security contract (project-rules.md Section 4):
 *   - Text nodes are created with document.createTextNode, never innerHTML.
 *   - Event listeners are attached with addEventListener, never via
 *     HTML attribute strings such as onclick="...".
 *
 * @param {Object} vnode - The root VNode to render.
 * @param {Element} container - The existing DOM element to append into.
 * @returns {Node} The newly created DOM node that was appended to container.
 */
export function renderToDOM(vnode, container) {
  // TODO (Milestone M-04): implement this function.
  // Remove the line below and replace it with the real implementation.
  throw new Error(
    "renderToDOM is not yet implemented. " +
      "See TASK_DECOMPOSITION.md Work Package 3."
  );
}
