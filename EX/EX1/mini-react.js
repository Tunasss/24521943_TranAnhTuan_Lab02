/**
 * @file mini-react.js
 * @description Mini-React VNode (Virtual Node) and Mounting Engine.
 * Implements three functions from scratch:
 *   - createTextElement — wraps a primitive value in a text VNode
 *   - createElement     — VNode factory for element nodes
 *   - renderToDOM       — mounts a VNode tree onto a real DOM container
 *
 * Rules in force (see project-rules.md):
 *   DO-04  : Use document.createTextNode, never innerHTML.
 *   DO-11  : Expand all abbreviations on first use.
 *   DONT-05: VNodes are immutable after creation; do not mutate them.
 *   DONT-11: No third-party libraries for core logic.
 */

/**
 * Creates a Virtual Node (VNode) — a plain JavaScript object that
 * describes a DOM (Document Object Model) element node.
 *
 * Child normalization rules (applied left-to-right after flattening):
 *   - Strings and numbers are wrapped with createTextElement.
 *   - null, undefined, and boolean values are dropped silently.
 *   - VNode objects (plain objects) are kept as-is.
 *
 * The returned object is immutable by convention; do not mutate it
 * after creation (project-rules.md DONT-05).
 *
 * @param {string} type
 *   The HTML tag name for the element (for example "section" or "button").
 *   Must be a valid HTML5 (HyperText Markup Language version 5) tag string.
 * @param {Object|null} props
 *   Key-value pairs representing HTML attributes and event listeners,
 *   or null when there are no props to set.
 * @param {...(Object|string|number|null|undefined|boolean)} children
 *   Zero or more child VNodes or primitive values. Arrays are flattened
 *   one level so JSX-style mapped lists work without an extra wrapper.
 * @returns {{ type: string, props: Object & { children: Object[] } }}
 *   A plain VNode object whose props.children array contains only
 *   normalized VNode objects.
 */
export function createElement(type, props, ...children) {
  // Flatten one level so callers can spread arrays of children naturally.
  const flatChildren = children.flat();

  // Normalize each child: wrap primitives, drop non-renderable values.
  const normalizedChildren = flatChildren
    .filter((child) => child !== null && child !== undefined && child !== true && child !== false)
    .map((child) =>
      typeof child === 'string' || typeof child === 'number'
        ? createTextElement(child)
        : child
    );

  return {
    type,
    props: {
      ...(props || {}),
      children: normalizedChildren,
    },
  };
}

/**
 * Creates a text VNode (Virtual Node) — a plain object with the sentinel
 * type "TEXT_ELEMENT". The renderer recognizes this sentinel and calls
 * document.createTextNode instead of document.createElement, which
 * ensures the value is always treated as data, never as HTML markup.
 * This is the primary Cross-Site Scripting (XSS) defense in the engine
 * (project-rules.md DO-04 and Section 4).
 *
 * @param {string|number} text
 *   The text content to wrap. The value is coerced to a string with
 *   String() so numbers render correctly without extra handling.
 * @returns {{ type: "TEXT_ELEMENT", props: { nodeValue: string, children: [] } }}
 *   A plain text VNode object. The children array is always empty because
 *   text nodes cannot have children in the DOM.
 */
export function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: String(text),
      children: [],
    },
  };
}

/**
 * Mounts a VNode (Virtual Node) tree onto a real DOM (Document Object Model)
 * node by recursively creating and appending DOM nodes that mirror the VNode
 * tree structure exactly. Every VNode produces exactly one DOM node — no
 * orphan nodes are ever created (project-rules.md DO-03).
 *
 * --- XSS (Cross-Site Scripting) safety explanation ---
 * When the VNode type is "TEXT_ELEMENT", this function calls
 * document.createTextNode(value) instead of setting innerHTML.
 * createTextNode treats its argument as raw character data: the browser
 * never parses it as HTML, so angle brackets, script tags, and event
 * attributes in the string are rendered literally on screen and cannot
 * execute. By contrast, assigning to innerHTML hands the string to the
 * HTML parser, which would create real <script> or <img onerror=...>
 * nodes — a classic XSS vector. Using createTextNode is therefore the
 * single most important security rule in this engine (DO-04).
 *
 * Prop handling rules (applied to every non-"children" prop key):
 *   - "className"        → assigned directly to el.className (maps the
 *                          JSX (JavaScript XML) convention to the DOM property).
 *   - Keys starting with "on" (e.g. "onClick", "onKeyDown")
 *                        → attached with addEventListener using the lowercase
 *                          event name (slice off "on", toLowerCase).
 *                          Never set as HTML attribute strings (DONT-06).
 *   - Everything else    → set with setAttribute so the value is always
 *                          treated as a plain string, not executable code.
 *
 * @param {Object} vnode
 *   The VNode to render. Must have a `type` string and a `props` object
 *   whose `children` array contains child VNodes.
 * @param {Node|null} container
 *   The existing DOM node to append the new node into.
 *   Pass null to create a detached node (useful in tests).
 * @returns {Node} The newly created DOM node.
 */
export function renderToDOM(vnode, container) {
  let domNode;

  if (vnode.type === 'TEXT_ELEMENT') {
    // --- XSS-safe text rendering (DO-04) ---
    // createTextNode never parses HTML; even a payload like
    // '<script>alert(1)</script>' becomes harmless character data.
    domNode = document.createTextNode(vnode.props.nodeValue);
  } else {
    // Create the element node using the VNode type as the tag name.
    domNode = document.createElement(vnode.type);

    // Apply every prop except the internal "children" array.
    Object.entries(vnode.props).forEach(([name, value]) => {
      if (name === 'children') {
        // "children" is an internal VNode field, not a DOM attribute.
        return;
      }

      if (name === 'className') {
        // Map JSX (JavaScript XML) className convention to the DOM property.
        domNode.className = value;
      } else if (name.startsWith('on') && typeof value === 'function') {
        // Convert "onClick" → "click", "onKeyDown" → "keydown", etc.
        // Using addEventListener (not an attribute string) satisfies DONT-06.
        const eventType = name.slice(2).toLowerCase();
        domNode.addEventListener(eventType, value);
      } else {
        // All other props become plain HTML attributes.
        // setAttribute always produces a string value, which is safe.
        domNode.setAttribute(name, value);
      }
    });

    // Recursively render and append each child in order (DO-07).
    // Depth-first, left-to-right traversal ensures the DOM tree mirrors
    // the VNode tree with no orphan nodes.
    vnode.props.children.forEach((child) => {
      renderToDOM(child, domNode);
    });
  }

  // Append to the parent container if one was provided.
  if (container) {
    container.appendChild(domNode);
  }

  // Return the node so callers can inspect or further attach it (DO-12).
  return domNode;
}
