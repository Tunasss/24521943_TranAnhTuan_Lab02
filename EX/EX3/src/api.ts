/**
 * @file api.ts
 * @description Simulated Application Programming Interface (API) service for the feed.
 * Simulates artificial network latency, probabilistic network failure, and request aborts.
 */

import type { Item } from './types.ts';

/**
 * 5 sample feed items returned upon a successful simulated network fetch.
 */
const SAMPLE_ITEMS: readonly Item[] = [
  { id: 1, title: 'Understanding Discriminated Unions in TypeScript' },
  { id: 2, title: 'Building Resilient State Machines with Finite States' },
  { id: 3, title: 'Accessible Web Design: WCAG 2.0 AA Guidelines' },
  { id: 4, title: 'Handling Asynchronous Race Conditions with AbortController' },
  { id: 5, title: 'Creating High-Performance Skeleton Loaders with CSS Pulse' },
];

/**
 * Simulates an asynchronous network request to fetch feed items.
 *
 * Behavior:
 * - Waits for 1.5 seconds to emulate network round-trip latency.
 * - Rejects immediately with an AbortError if the provided AbortSignal is or becomes aborted.
 * - Fails probabilistically (~40% chance) with a descriptive network unreachable error.
 * - Returns 5 mock items upon successful completion.
 *
 * @param {AbortSignal} [signal] - Optional AbortSignal to cancel the pending request.
 * @returns {Promise<Item[]>} A Promise resolving to an array of 5 Item objects.
 * @throws {DOMException} When the request is cancelled via the AbortSignal.
 * @throws {Error} When a simulated network failure occurs.
 */
export async function fetchFeed(signal?: AbortSignal): Promise<Item[]> {
  return new Promise<Item[]>((resolve, reject) => {
    // Check if the signal is already aborted before starting
    if (signal?.aborted) {
      return reject(new DOMException('The user aborted a request.', 'AbortError'));
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const onAbort = () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      reject(new DOMException('The user aborted a request.', 'AbortError'));
    };

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }

    timeoutId = setTimeout(() => {
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }

      // Simulate 40% probability of network failure
      if (Math.random() < 0.4) {
        return reject(new Error('Network unreachable. Please try again.'));
      }

      // Return a copy of the 5 sample items
      resolve([...SAMPLE_ITEMS]);
    }, 1500);
  });
}
