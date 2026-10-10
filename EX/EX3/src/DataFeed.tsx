/**
 * @file DataFeed.tsx
 * @description Resilient data feed component managing a 4-state asynchronous lifecycle.
 * Handles race conditions via AbortController, prevents state updates on unmounted components,
 * and uses exhaustive pattern matching for compile-time safety.
 */

import { useState, useRef, useEffect } from 'react';
import type { JSX } from 'react';
import type { Item, ViewState } from './types';
import { fetchFeed } from './api';

/**
 * DataFeed Component.
 * Fetches feed items and renders appropriate views for IDLE, LOADING, SUCCESS, and ERROR states.
 *
 * @returns {JSX.Element} The rendered view according to the current state.
 */
export function DataFeed(): JSX.Element {
  const [state, setState] = useState<ViewState<Item[]>>({ status: 'IDLE' });

  // Store the active AbortController across renders to cancel ongoing requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Unmount cleanup: cancel any pending request to prevent memory leaks and post-unmount updates
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  /**
   * Loads data asynchronously while guarding against race conditions and stale responses.
   */
  const loadData = async (): Promise<void> => {
    // 1. Abort any previous in-flight request before initiating a new one
    abortControllerRef.current?.abort();

    // Create a new AbortController for this fetch request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState({ status: 'LOADING' });

    try {
      // 2. Pass the cancellation signal to the simulated network service
      const items = await fetchFeed(controller.signal);

      // 4. Do not update state if this request was aborted while awaiting response
      if (controller.signal.aborted) {
        return;
      }

      setState({ status: 'SUCCESS', data: items });
    } catch (err: unknown) {
      // 3 & 4. Ignore abort events; do not transition to ERROR state when cancelled
      if (controller.signal.aborted) {
        return;
      }

      if (
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && err.name === 'AbortError')
      ) {
        return;
      }

      // Safely extract error message without using "any"
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState({ status: 'ERROR', error: errorMessage });
    }
  };

  // 5. Exhaustive switch matching on state.status
  switch (state.status) {
    case 'IDLE':
      return (
        <section className="feed-container idle-view" aria-label="Feed section">
          <button type="button" onClick={loadData}>
            Load Feed
          </button>
        </section>
      );

    case 'LOADING':
      return (
        <section
          className="feed-container loading-view"
          aria-busy="true"
          role="status"
          aria-label="Feed loading"
        >
          <p>Loading...</p>
        </section>
      );

    case 'SUCCESS':
      return (
        <section className="feed-container success-view" aria-label="Feed items">
          <ul>
            {state.data.map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ul>
        </section>
      );

    case 'ERROR':
      return (
        <section className="feed-container error-view" role="alert" aria-label="Feed error">
          <p>{state.error}</p>
          <button type="button" onClick={loadData}>
            Retry Connection
          </button>
        </section>
      );

    default: {
      // Exhaustiveness check: TypeScript ensures this branch is unreachable
      const _exhaustiveCheck: never = state;
      throw new Error(`Unhandled state: ${JSON.stringify(_exhaustiveCheck)}`);
    }
  }
}

export default DataFeed;
