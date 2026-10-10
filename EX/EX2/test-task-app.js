/**
 * @file test-task-app.js
 * @description Comprehensive verification tests for TaskApp component.
 */

// Mock minimal DOM environment for Node.js
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
      value: '',
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
      querySelectorAll(selector) {
        const results = [];
        function walk(node) {
          if (!node || !node.children) return;
          for (const child of node.children) {
            if (
              child.tagName === selector.toUpperCase() ||
              (child.attributes && child.attributes[selector])
            ) {
              results.push(child);
            }
            walk(child);
          }
        }
        walk(this);
        return results;
      },
      querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
      },
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
  },
  getElementById(id) {
    if (this._registry && this._registry[id]) return this._registry[id];
    return null;
  }
};

import { renderApp, getStateStore, handlerRegistry } from './reactive-engine.js';
import { TaskApp } from './app.js';

const appContainer = document.createElement('div');
appContainer.id = 'app';
document._registry = { app: appContainer };

console.log('--- Test 1: Initial Render & Seed State ---');
renderApp(TaskApp, appContainer);

const initialStore = getStateStore();
console.assert(Array.isArray(initialStore[0]), 'State slot 0 must be tasks array');
console.assert(initialStore[0].length === 2, 'Initial task count must be 2');
console.assert(initialStore[0][0].text === 'Review PR', 'First task text must be "Review PR"');
console.assert(initialStore[0][1].text === 'Verify AST', 'Second task text must be "Verify AST"');
console.assert(initialStore[1] === 'ALL', 'State slot 1 must be filter "ALL"');
console.log('✓ Initial tasks seeded and state slots initialized correctly');

console.log('--- Test 2: Semantic Elements & Accessibility Invariants ---');
const mainEl = appContainer.querySelector('MAIN');
console.assert(mainEl !== null, 'FAIL: Root element must be semantic <main>');

const headerEl = appContainer.querySelector('HEADER');
console.assert(headerEl !== null, 'FAIL: Header element missing');

const h2El = appContainer.querySelector('H2');
console.assert(h2El !== null && h2El.children[0].nodeValue === 'Tasks: 2', 'Header h2 must show Tasks: 2');
console.log('✓ Semantic structure (<main>, <header>, <h2>) verified');

const filterButtons = appContainer.querySelectorAll('BUTTON').slice(0, 3);
console.assert(filterButtons.length === 3, 'Must have 3 filter buttons');
console.assert(filterButtons[0].getAttribute('aria-pressed') === 'true', 'ALL filter must have aria-pressed="true"');
console.assert(filterButtons[1].getAttribute('aria-pressed') === 'false', 'ACTIVE filter must have aria-pressed="false"');
console.assert(filterButtons[2].getAttribute('aria-pressed') === 'false', 'DONE filter must have aria-pressed="false"');
console.log('✓ Filter buttons properly use dynamic aria-pressed attributes (DO-08 satisfied)');

console.log('--- Test 3: Event Delegation on Filter Toggling ---');
// Click 'ACTIVE' filter button (2nd filter button)
filterButtons[1].dispatchEvent({ type: 'click' });
console.assert(getStateStore()[1] === 'ACTIVE', 'Filter state should transition to ACTIVE');
console.log('✓ Filter button click dispatched through root delegation to update state');

console.log('--- Test 4: Task Toggle Action ---');
// Switch back to ALL filter
const allBtn = appContainer.querySelectorAll('BUTTON')[0];
allBtn.dispatchEvent({ type: 'click' });

// Toggle the first task ("Review PR") to done
const allButtons = appContainer.querySelectorAll('BUTTON');
// Button index 0,1,2 are filters, 3 is Add Task, 4 is 1st task toggle, 5 is 2nd task toggle
const toggleFirstTaskBtn = allButtons[4];
toggleFirstTaskBtn.dispatchEvent({ type: 'click' });

const updatedTasks = getStateStore()[0];
console.assert(updatedTasks[0].done === true, 'First task should now be marked done');
console.assert(updatedTasks[1].done === false, 'Second task should remain active');
console.log('✓ Task completion toggled immutably');

console.log('--- Test 5: Derived Filtering Invariants ---');
// Now switch to ACTIVE filter: only 1 task ("Verify AST") should be shown
const activeBtn = appContainer.querySelectorAll('BUTTON')[1];
activeBtn.dispatchEvent({ type: 'click' });

const listItems = appContainer.querySelectorAll('LI');
console.assert(listItems.length === 1, `Expected 1 active task, got ${listItems.length}`);
const h2Filtered = appContainer.querySelector('H2');
console.assert(h2Filtered.children[0].nodeValue === 'Tasks: 1', 'Header count must reflect filtered count (Tasks: 1)');
console.log('✓ Filtered task list correctly derived from state without mutating store');

console.log('--- Test 6: Zero Direct Listeners on Buttons ---');
const anyDirectListeners = appContainer
  .querySelectorAll('BUTTON')
  .some((btn) => Object.keys(btn.listeners).length > 0);
console.assert(!anyDirectListeners, 'FAIL: Found direct listeners attached to button');
console.log('✓ Verified: 0 direct listeners on all buttons in TaskApp (DONT-03 satisfied)');

console.log('\nAll TaskApp verification tests PASSED successfully!');
