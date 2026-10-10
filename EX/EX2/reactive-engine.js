/**
 * @file reactive-engine.js
 * @description Storage layer for the Reactive State Machine (RSM).
 * Provides the underlying state array, cursor pointer, and reset utilities.
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
