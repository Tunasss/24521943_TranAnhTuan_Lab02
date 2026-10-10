/**
 * @file test-state.js
 * @description Unit tests for useState dispatcher, cursor reset, and root event delegation.
 */

// Mock minimal DOM environment for Node.js testing
globalThis.document = {
  createTextNode(text) {
    return {
      nodeType: 3,
      nodeValue: String(text),
      textContent: String(text),
      parentNode: null
    };
  },
  createElement(tag) {
    const listeners = {};
    const attributes = {};
    const children = [];
    const element = {
      nodeType: 1,
      tagName: tag.toUpperCase(),
      attributes,
      listeners,
      children,
      parentNode: null,
      dataset: {},
      setAttribute(k, v) {
        attributes[k] = String(v);
        if (k.startsWith('data-')) {
          const prop = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          this.dataset[prop] = String(v);
        }
      },
      getAttribute(k) {
        return attributes[k];
      },
      addEventListener(type, fn) {
        listeners[type] = listeners[type] || [];
        listeners[type].push(fn);
      },
      removeEventListener(type, fn) {
        if (listeners[type]) {
          listeners[type] = listeners[type].filter((cb) => cb !== fn);
        }
      },
      appendChild(child) {
        child.parentNode = this;
        children.push(child);
        return child;
      },
      replaceChildren(...newChildren) {
        children.length = 0;
        newChildren.forEach((child) => {
          child.parentNode = this;
          children.push(child);
        });
      },
      contains(target) {
        let curr = target;
        while (curr) {
          if (curr === this) return true;
          curr = curr.parentNode;
        }
        return false;
      },
      closest(selector) {
        let curr = this;
        const attrMatch = selector.match(/^\[([a-zA-Z0-9-]+)\]$/);
        const attrName = attrMatch ? attrMatch[1] : null;

        while (curr) {
          if (attrName && curr.attributes && curr.attributes[attrName] !== undefined) {
            return curr;
          }
          if (curr.tagName && curr.tagName === selector.toUpperCase()) {
            return curr;
          }
          curr = curr.parentNode;
        }
        return null;
      },
      querySelector(sel) {
        function search(node) {
          if (!node || !node.children) return null;
          for (const child of node.children) {
            if (child.tagName === sel.toUpperCase() || (child.attributes && child.attributes[sel])) {
              return child;
            }
            const found = search(child);
            if (found) return found;
          }
          return null;
        }
        return search(this);
      },
      // Helper to dispatch event upwards
      dispatchEvent(event) {
        event.target = this;
        let curr = this;
        while (curr) {
          if (curr.listeners[event.type]) {
            curr.listeners[event.type].forEach((fn) => fn(event));
          }
          curr = curr.parentNode;
        }
      }
    };
    return element;
  }
};

import {
  useState,
  getStateStore,
  createElement,
  renderApp,
  handlerRegistry
} from './reactive-engine.js';

console.log('--- Test 1: Hook slot allocation & initial values ---');
const container = document.createElement('div');
let renderCount = 0;
let exposedSetCount = null;
let exposedSetText = null;

function CounterApp() {
  renderCount++;
  const [count, setCount] = useState(0);
  const [text, setText] = useState('initial');
  exposedSetCount = setCount;
  exposedSetText = setText;

  return createElement('div', { id: 'app-root' },
    createElement('span', null, `Count: ${count}`),
    createElement('span', null, `Text: ${text}`),
    createElement('button', {
      onClick: () => setCount((prev) => prev + 1)
    }, 'Increment')
  );
}

renderApp(CounterApp, container);
console.assert(renderCount === 1, 'Render count should be 1 after initial render');
console.assert(getStateStore()[0] === 0, 'Slot 0 should hold 0');
console.assert(getStateStore()[1] === 'initial', 'Slot 1 should hold "initial"');
console.log('✓ Initial render passed. Store:', getStateStore());

console.log('--- Test 2: setState with value triggers re-render ---');
exposedSetCount(5);
console.assert(renderCount === 2, 'Render count should be 2 after setCount(5)');
console.assert(getStateStore()[0] === 5, 'Slot 0 should now be 5');
console.log('✓ Direct value update passed. Store:', getStateStore());

console.log('--- Test 3: setState with updater function ---');
exposedSetCount((prev) => prev + 10);
console.assert(renderCount === 3, 'Render count should be 3 after updater function');
console.assert(getStateStore()[0] === 15, 'Slot 0 should now be 15');
console.log('✓ Functional updater passed. Store:', getStateStore());

console.log('--- Test 4: Object.is equality prevents unnecessary re-render ---');
exposedSetCount(15); // Same value
console.assert(renderCount === 3, `Render count should stay 3, got ${renderCount}`);
console.log('✓ Object.is bail-out passed (no extra re-render on identical value)');

console.log('--- Test 5: Multiple independent slots isolation ---');
exposedSetText('updated');
console.assert(renderCount === 4, 'Render count should be 4 after setText');
console.assert(getStateStore()[0] === 15, 'Slot 0 must remain 15 when updating slot 1');
console.assert(getStateStore()[1] === 'updated', 'Slot 1 should be "updated"');
console.log('✓ Slot isolation passed. Store:', getStateStore());

console.log('\n--- Test 6: Root Event Delegation Invariants ---');
const buttonNode = container.querySelector('BUTTON');
console.assert(buttonNode !== null, 'FAIL: Button element not found in DOM');

// Check 1: Button must NOT have any direct event listener attached
const buttonListenerCount = Object.keys(buttonNode.listeners).length;
console.assert(
  buttonListenerCount === 0,
  `FAIL: Button has direct listeners (${buttonListenerCount}), expected 0`
);
console.log('✓ Zero direct listeners on button element (DONT-03 satisfied)');

// Check 2: Button has data-handler-id and data-event attributes
console.assert(
  buttonNode.getAttribute('data-handler-id') !== undefined,
  'FAIL: Button missing data-handler-id attribute'
);
console.assert(
  buttonNode.getAttribute('data-event') === 'click',
  'FAIL: Button data-event is not "click"'
);
console.log('✓ data-handler-id and data-event attributes present on button');

// Check 3: Container has exactly ONE click listener attached
const containerClickListeners = container.listeners['click'] || [];
console.assert(
  containerClickListeners.length === 1,
  `FAIL: Container should have exactly 1 click listener, got ${containerClickListeners.length}`
);
console.log('✓ Exactly one root click listener on container (DO-04 satisfied)');

// Check 4: Handler registry contains entry for handlerId
const handlerId = buttonNode.getAttribute('data-handler-id');
console.assert(
  handlerRegistry.has(handlerId),
  `FAIL: handlerRegistry missing entry for handlerId ${handlerId}`
);
console.log('✓ handlerRegistry holds callback mapping for ID', handlerId);

// Check 5: Dispatching click from button bubbles to root and triggers state update
const prevCount = getStateStore()[0];
buttonNode.dispatchEvent({ type: 'click' });
console.assert(
  getStateStore()[0] === prevCount + 1,
  `FAIL: Click event did not increment count. Expected ${prevCount + 1}, got ${getStateStore()[0]}`
);
console.log('✓ Root event delegation successfully handled click event (new count:', getStateStore()[0], ')');

// Check 6: Root listener count remains 1 even after re-rendering
console.assert(
  (container.listeners['click'] || []).length === 1,
  'FAIL: Listener accumulated on re-render'
);
console.log('✓ No listener accumulation on root container across re-renders (DONT-07 satisfied)');

console.log('\nAll tests PASSED successfully!');
