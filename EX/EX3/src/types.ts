/**
 * @file types.ts
 * @description Type definitions for the Resilient State Machine.
 * Defines the data contracts and the 4-state discriminated union lifecycle.
 */

/**
 * Data item representing a feed or list entry.
 */
export interface Item {
  id: number;
  title: string;
}

/**
 * Discriminated union representing the complete 4-state asynchronous lifecycle.
 * Eliminates impossible states at compile time (e.g. data present in LOADING or simultaneous error and success).
 *
 * @template T - The payload data type when in SUCCESS state.
 */
export type ViewState<T> =
  | { status: 'IDLE' }
  | { status: 'LOADING' }
  | { status: 'SUCCESS'; data: T }
  | { status: 'ERROR'; error: string };

/**
 * Exhaustive pattern matching helper ensuring all discriminated union states
 * are handled at compile time.
 *
 * @param x - Value asserted to be of type never.
 * @returns {never}
 */
export function assertNever(x: never): never {
  throw new Error(`Unexpected state encountered: ${JSON.stringify(x)}`);
}
