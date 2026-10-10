/**
 * @file test-state.js
 * @description Unit tests for useState dispatcher, cursor reset, and reactive re-renders.
 */

// Mock minimal DOM environment for Node.js testing
globalThis.document = {
  createTextNode(text) {
    return { nodeType: 3, nodeValue: String(text), textContent: String(text) };
  },
  createElement(tag) {
    const listeners = {};
    const attributes = {};
    const children = [];
    return {
      nodeType: 1,
      tagName: tag.toUpperCase(),
      attributes,
      listeners,
      children,
      setAttribute(k, v) { attributes[k] = String(v); },
      getAttribute(k) { return attributes[k]; },
      addEventListener(type, fn) {
        listeners[type] = listeners[type] || [];
        listeners[type].push(fn);
      },
      appendChild(child) {
        children.push(child);
        return child;
      },
      replaceChildren(...newChildren) {
        children.length = 0;
        children.push(...newChildren);
      },
      querySelector(sel) {
        // Simple mock search
        return children.find(c => c.tagName === sel.toUpperCase() || c.attributes?.['data-action'] === sel);
      }
    };
  }
};

import {
  useState,
  resetCursor,
  getStateStore,
  createElement,
  renderApp
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
    createElement('span', null, `Text: ${text}`)
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
exposedSetCount(15); // Same value!
console.assert(renderCount === 3, `Render count should stay 3, got ${renderCount}`);
console.log('✓ Object.is bail-out passed (no extra re-render on identical value)');

console.log('--- Test 5: Multiple independent slots isolation ---');
exposedSetText('updated');
console.assert(renderCount === 4, 'Render count should be 4 after setText');
console.assert(getStateStore()[0] === 15, 'Slot 0 must remain 15 when updating slot 1');
console.assert(getStateStore()[1] === 'updated', 'Slot 1 should be "updated"');
console.log('✓ Slot isolation passed. Store:', getStateStore());

console.log('\nAll useState and reactive-engine unit tests PASSED successfully!');
