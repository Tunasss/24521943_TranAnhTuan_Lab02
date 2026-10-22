import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { flashSaleReducer } from './flash-sale-reducer';
import type { FlashSaleState } from './flash-sale-types';
import { FlashSaleServer } from './mock-server';
import { useCountdown, type UseCountdownResult } from './useCountdown';

/**
 * Return interface for the useFlashSale hook.
 */
export interface UseFlashSaleResult {
  state: FlashSaleState;
  saleCountdown: UseCountdownResult;
  reservationCountdown: UseCountdownResult;
  isSaleLive: boolean;
  reserve: () => Promise<void>;
  extend: () => Promise<void>;
  checkout: () => Promise<void>;
}

/**
 * Custom React hook coordinating flash sale inventory locking, server synchronization,
 * anti-drift countdown timers, and optimistic concurrency state transitions.
 *
 * Architecture and Concurrency Safeguards:
 * 1. Optimistic Locking: Dispatches RESERVE_REQUESTED synchronously to update UI stock immediately,
 *    then confirms asynchronously with FlashSaleServer.
 * 2. Stale Response Shield: Assigns a monotonically increasing request ID to prevent race conditions
 *    or out-of-order resolution from overwriting current state.
 * 3. Server Clock Synchronization: Calibrates local countdowns against authoritative serverNow offset.
 * 4. Dual-Mount / StrictMode Safe: Cancels and restarts background bots deterministically in cleanup.
 *
 * @param customServer - Optional pre-configured FlashSaleServer instance (for testing or injection)
 */
export function useFlashSale(customServer?: FlashSaleServer): UseFlashSaleResult {
  // Server instance created once and stored in a ref
  const [defaultServer] = useState<FlashSaleServer>(() => {
    return (
      customServer ??
      new FlashSaleServer({
        initialStock: 5,
        saleStartsAt: Date.now() + 15_000,
        reservationTtlMs: 60_000,
        extensionMs: 30_000,
      })
    );
  });
  const serverRef = useRef<FlashSaleServer>(defaultServer);

  // Persistent unique client ID for lease reservation
  const [userId] = useState<string>(() => crypto.randomUUID());
  const userIdRef = useRef<string>(userId);

  // Reducer managing state transitions
  const [state, dispatch] = useReducer(flashSaleReducer, {
    lock: { status: 'AVAILABLE' },
    displayedStock: 5,
  });

  // Ref bridges to avoid stale closures inside async handlers
  const stateRef = useRef<FlashSaleState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const lastKnownServerStockRef = useRef<number>(5);
  const requestIdRef = useRef<number>(0);
  const clockOffsetRef = useRef<number>(0);

  // Stable clock provider factoring in server clock drift
  const now = useCallback(() => Date.now() + clockOffsetRef.current, []);

  // Sale start timestamp state
  const [saleStartsAt, setSaleStartsAt] = useState<number | null>(null);

  // Countdown to sale start
  const saleCountdown = useCountdown(saleStartsAt, now);
  const isSaleLive =
    saleStartsAt !== null &&
    (saleCountdown.isComplete || saleCountdown.secondsLeft === 0);

  // Countdown to reservation expiration (active only when status is RESERVED)
  const reservationExpiresAt =
    state.lock.status === 'RESERVED' ? state.lock.expiresAt : null;
  const reservationCountdown = useCountdown(reservationExpiresAt, now);

  // Dispatch EXPIRED when reservation timer reaches 0
  useEffect(() => {
    if (reservationCountdown.isComplete && stateRef.current.lock.status === 'RESERVED') {
      dispatch({
        type: 'EXPIRED',
        serverStock: lastKnownServerStockRef.current,
      });
    }
  }, [reservationCountdown.isComplete]);

  // Server subscription, bot lifecycle, and initial snapshot calibration
  useEffect(() => {
    let isMounted = true;
    requestIdRef.current += 1;
    const serverInstance = serverRef.current;

    // Start bot competitor buyer simulation
    serverInstance.startBots();

    // Subscribe to real-time server inventory broadcasts
    const unsubscribe = serverInstance.subscribe((stock) => {
      if (!isMounted) {
        return;
      }
      lastKnownServerStockRef.current = stock;
      dispatch({ type: 'STOCK_SYNCED', serverStock: stock });
    });

    // Synchronize initial snapshot and clock offset
    serverInstance
      .getSnapshot()
      .then((snapshot) => {
        if (!isMounted) {
          return;
        }
        clockOffsetRef.current = snapshot.serverNow - Date.now();
        lastKnownServerStockRef.current = snapshot.stock;
        setSaleStartsAt(snapshot.saleStartsAt);
        dispatch({ type: 'RESET', stock: snapshot.stock });
      })
      .catch((err) => {
        if (!isMounted) {
          return;
        }
        console.error('Failed to calibrate flash sale snapshot:', err);
      });

    return () => {
      isMounted = false;
      // Invalidate pending requests and clean up background tasks
      requestIdRef.current += 1;
      serverInstance.stopBots();
      unsubscribe();
    };
  }, []);

  /**
   * Optimistically attempts to reserve one inventory item from the server.
   */
  const reserve = useCallback(async (): Promise<void> => {
    requestIdRef.current += 1;
    const currentReqId = requestIdRef.current;

    // 1. Synchronous optimistic UI update
    dispatch({ type: 'RESERVE_REQUESTED' });

    try {
      // 2. Asynchronous server reservation lease request
      const result = await serverRef.current.reserve(userIdRef.current);

      // Guard: Ignore response if a subsequent action began or component unmounted
      if (currentReqId !== requestIdRef.current) {
        return;
      }

      if (result.ok) {
        lastKnownServerStockRef.current = result.stock;
        dispatch({
          type: 'RESERVE_SUCCEEDED',
          reservationId: result.reservationId,
          expiresAt: result.expiresAt,
          serverStock: result.stock,
        });
      } else {
        lastKnownServerStockRef.current = result.stock;
        dispatch({
          type: 'RESERVE_REJECTED',
          reason: result.reason,
          serverStock: result.stock,
        });
      }
    } catch {
      // Network transport failure rollback
      if (currentReqId !== requestIdRef.current) {
        return;
      }
      dispatch({
        type: 'RESERVE_REJECTED',
        reason: 'NETWORK',
        serverStock: lastKnownServerStockRef.current,
      });
    }
  }, []);

  /**
   * Extends the expiration timestamp of an active reservation by the configured window.
   */
  const extend = useCallback(async (): Promise<void> => {
    const currentLock = stateRef.current.lock;
    if (currentLock.status !== 'RESERVED' || currentLock.extensionsUsed >= 1) {
      return;
    }

    try {
      const result = await serverRef.current.extend(currentLock.reservationId);
      dispatch({
        type: 'EXTEND_SUCCEEDED',
        expiresAt: result.expiresAt,
      });
    } catch (err) {
      console.error('Failed to extend reservation window:', err);
    }
  }, []);

  /**
   * Commits the final checkout transaction, converting the reserved lease into a completed purchase.
   */
  const checkout = useCallback(async (): Promise<void> => {
    const currentLock = stateRef.current.lock;
    if (currentLock.status !== 'RESERVED') {
      return;
    }

    dispatch({ type: 'CHECKOUT_REQUESTED' });

    try {
      const result = await serverRef.current.checkout(currentLock.reservationId);
      dispatch({
        type: 'CHECKOUT_SUCCEEDED',
        orderId: result.orderId,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Payment confirmation failed. Please retry.';
      dispatch({
        type: 'CHECKOUT_FAILED',
        message: errorMessage,
      });
    }
  }, []);

  return {
    state,
    saleCountdown,
    reservationCountdown,
    isSaleLive,
    reserve,
    extend,
    checkout,
  };
}
