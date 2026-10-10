/**
 * @file reactive-engine.js
 * @description Reactive State Machine (RSM) engine and mounting layer.
 * Implements closure-based state management, custom useState hook,
 * Virtual Node (VNode) creation, and DOM (Document Object Model) mounting.
 *
 * Rules in force:
 * - DO-01: useState closure over single stateStore array and cursor integer.
 * - DO-02: Returns [value, setter] tuple, setter triggers re-render.
 * - DO-03: Immutable state updates.
 * - DO-06: document.createTextNode for all text nodes; no innerHTML.
 * - DO-10: JSDoc comments on all exported functions.
 * - DO-11: Expand abbreviations on first use.
 */

// ============================================================================
// Why hooks must be called in the same order on every render pass:
//
// In this closure-based state engine (similar to React, a JavaScript User
// Interface (UI) library), state values are stored sequentially in an internal
// array (stateStore) and indexed by an integer pointer (cursor).
//
// Hook invocations do not use explicit keys, names, or identifiers to locate
// their state slot. Instead, they rely purely on execution order:
// - The 1st hook call reads from and writes to slot index 0.
// - The 2nd hook call reads from and writes to slot index 1, and so on.
//
// If a hook is called conditionally (inside an `if` statement), inside a loop,
// or after an early return:
// 1. A condition evaluating to false skips that hook invocation during a render.
// 2. All subsequent hook calls in that pass advance the cursor differently,
//    reading from or overwriting the wrong slots in stateStore.
// 3. This mismatch corrupts state values across render cycles, leading to
//    unpredictable state desynchronization and hard-to-trace bugs.
//
// Therefore, hooks must always be executed unconditionally at the top level
// of the render function in the exact same sequence on every render.
// ============================================================================

let stateStore = [];
let cursor = 0;

/** @type {Function|null} */
let currentComponent = null;

/** @type {HTMLElement|null} */
let currentContainer = null;

/**
 * Resets the state store cursor to zero.
 * Must be invoked as the first statement of every render cycle to ensure
 * subsequent hook calls map to their designated sequential slots.
 *
 * @returns {void}
 */
export function resetCursor() {
  cursor = 0;
}

/**
 * Returns a shallow copy of the internal state store for debugging and testing purposes.
 *
 * @returns {Array<unknown>} An array representing the current state slots in the store.
 */
export function getStateStore() {
  return [...stateStore];
}

/**
 * Schedules a re-render cycle by re-invoking renderApp with the active component and container.
 *
 * @returns {void}
 */
export function scheduleRender() {
  if (currentComponent && currentContainer) {
    renderApp(currentComponent, currentContainer);
  }
}

/**
 * Custom useState hook maintaining state in an ordered closure store.
 *
 * @param {unknown|(() => unknown)} initial
 *   Initial state value or a function returning the initial value.
 * @returns {[unknown, (next: unknown|((prev: unknown) => unknown)) => void]}
 *   A tuple containing the current state value and a state dispatcher function.
 */
export function useState(initial) {
  const index = cursor;
  cursor++;

  if (stateStore[index] === undefined) {
    stateStore[index] = typeof initial === 'function' ? initial() : initial;
  }

  /**
   * Dispatches a state update. If the value changes (checked via Object.is),
   * updates the store slot and schedules a re-render.
   *
   * @param {unknown|((prev: unknown) => unknown)} next - Next state value or updater function.
   * @returns {void}
   */
  const setState = (next) => {
    const nextValue = typeof next === 'function' ? next(stateStore[index]) : next;
    if (!Object.is(stateStore[index], nextValue)) {
      stateStore[index] = nextValue;
      scheduleRender();
    }
  };

  return [stateStore[index], setState];
}

/**
 * Creates a text Virtual Node (VNode) wrapping a primitive value.
 *
 * @param {string|number} text - The text content to wrap.
 * @returns {{ type: 'TEXT_ELEMENT', props: { nodeValue: string, children: [] } }}
 *   A text VNode object.
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
 * Creates an element Virtual Node (VNode) describing a DOM element.
 *
 * @param {string} type - HTML (HyperText Markup Language) tag name.
 * @param {Object|null} props - Key-value pairs for attributes and properties.
 * @param {...(Object|string|number|null|undefined|boolean)} children - Child VNodes or primitive values.
 * @returns {{ type: string, props: Object & { children: Object[] } }}
 *   A normalized VNode object.
 */
export function createElement(type, props, ...children) {
  const flatChildren = children.flat();

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
 * Mounts a Virtual Node (VNode) tree onto a real DOM node using safe DOM methods.
 * Uses document.createTextNode for text to prevent Cross-Site Scripting (XSS).
 *
 * @param {Object} vnode - The VNode to render.
 * @param {Node|null} container - Target DOM node to append the rendered element to.
 * @returns {Node} The newly created DOM node.
 */
export function renderToDOM(vnode, container) {
  let domNode;

  if (vnode.type === 'TEXT_ELEMENT') {
    domNode = document.createTextNode(vnode.props.nodeValue);
  } else {
    domNode = document.createElement(vnode.type);

    Object.entries(vnode.props).forEach(([name, value]) => {
      if (name === 'children') {
        return;
      }

      if (name === 'className') {
        domNode.className = value;
      } else if (name.startsWith('on') && typeof value === 'function') {
        const eventType = name.slice(2).toLowerCase();
        domNode.addEventListener(eventType, value);
      } else {
        domNode.setAttribute(name, value);
      }
    });

    vnode.props.children.forEach((child) => {
      renderToDOM(child, domNode);
    });
  }

  if (container) {
    container.appendChild(domNode);
  }

  return domNode;
}

/**
 * Renders the application component into the DOM container.
 * Stores Component and container references for subsequent reactive updates,
 * resets cursor, generates the VNode tree, and replaces container children.
 *
 * @param {Function} Component - The root component function returning a VNode.
 * @param {HTMLElement} container - The host DOM container.
 * @returns {void}
 */
export function renderApp(Component, container) {
  currentComponent = Component;
  currentContainer = container;

  resetCursor();
  const vnode = Component();
  container.replaceChildren();
  renderToDOM(vnode, container);
}
