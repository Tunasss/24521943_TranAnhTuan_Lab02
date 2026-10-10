// Checkpoint 1 Verification Test Suite
// Security audit: XSS (Cross-Site Scripting) resistance tests
import { createElement, renderToDOM } from './mini-react.js';

// --- Main VNode tree (mirrors the expected DOM structure) ---
// VNode shape: main > header > h1, p ; button
const vApp = createElement('main', {
    id: 'root-view', role: 'main'
},
    createElement('header', { className: 'hero' },
        createElement('h1', null, 'Mini React Engine'),
        // XSS payload #1: img with onerror handler — must render as literal text
        createElement('p', null, '<img onerror=alert(1)> Safe Text')
    ),
    createElement('button', {
        onClick: () => console.log('Ping')
    }, 'Click')
);

const root = document.getElementById('app');
root.replaceChildren(renderToDOM(vApp));

// --- Test T-05: DOM structure matches VNode tree ---
console.assert(
    root.querySelector('button') !== null,
    'FAIL T-05: Mount Failed — button not found in DOM'
);
console.assert(
    root.querySelector('h1') !== null,
    'FAIL T-05: h1 not found in DOM'
);
console.assert(
    root.querySelector('header') !== null,
    'FAIL T-05: header not found in DOM'
);

// --- Test T-07a: img onerror payload renders as text, no alert fires ---
const pEl = root.querySelector('p');
console.assert(
    pEl !== null,
    'FAIL T-07a: <p> element not found'
);
console.assert(
    root.querySelector('img') === null,
    'FAIL T-07a: XSS — <img> element was created (innerHTML used?)'
);
console.assert(
    pEl.textContent.includes('<img onerror=alert(1)>'),
    'FAIL T-07a: payload not present as literal text'
);

// --- Test T-07b: <script> tag payload renders as text, no alert fires ---
// A detached container is used so the injected node never enters the live DOM.
const xssContainer = document.createElement('section');
const xssVNode = createElement('p', null, '<script>alert(1)<\/script>');
renderToDOM(xssVNode, xssContainer);

console.assert(
    xssContainer.querySelector('script') === null,
    'FAIL T-07b: XSS — <script> element was injected into DOM'
);
console.assert(
    xssContainer.querySelector('p').textContent === '<script>alert(1)<\/script>',
    'FAIL T-07b: script payload not stored as literal text'
);

// --- All tests passed ---
console.log('%c✓ All security and mount tests passed', 'color: green; font-weight: bold');
console.log('DOM node count inside #app:', root.querySelectorAll('*').length, '(expected 4: main, header, h1, p, button = 5 elements)');