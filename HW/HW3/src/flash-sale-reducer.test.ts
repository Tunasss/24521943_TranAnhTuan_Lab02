import { describe, expect, it } from 'vitest';
import { flashSaleReducer } from './flash-sale-reducer';
import type { FlashSaleAction, FlashSaleState } from './flash-sale-types';

/**
 * Helper creating an AVAILABLE state.
 */
function createAvailableState(displayedStock = 10): FlashSaleState {
  return {
    lock: { status: 'AVAILABLE' },
    displayedStock,
  };
}

/**
 * Helper creating a RESERVING state.
 */
function createReservingState(displayedStock = 9): FlashSaleState {
  return {
    lock: { status: 'RESERVING' },
    displayedStock,
  };
}

/**
 * Helper creating a RESERVED state.
 */
function createReservedState(options?: {
  displayedStock?: number;
  reservationId?: string;
  expiresAt?: number;
  extensionsUsed?: number;
}): FlashSaleState {
  return {
    lock: {
      status: 'RESERVED',
      reservationId: options?.reservationId ?? 'res-unit-test-1',
      expiresAt: options?.expiresAt ?? Date.now() + 60_000,
      extensionsUsed: options?.extensionsUsed ?? 0,
    },
    displayedStock: options?.displayedStock ?? 8,
  };
}

/**
 * Helper creating a CHECKING_OUT state.
 */
function createCheckingOutState(options?: {
  displayedStock?: number;
  reservationId?: string;
}): FlashSaleState {
  return {
    lock: {
      status: 'CHECKING_OUT',
      reservationId: options?.reservationId ?? 'res-unit-test-1',
    },
    displayedStock: options?.displayedStock ?? 8,
  };
}

/**
 * Helper creating a PURCHASED terminal state.
 */
function createPurchasedState(options?: {
  displayedStock?: number;
  orderId?: string;
}): FlashSaleState {
  return {
    lock: {
      status: 'PURCHASED',
      orderId: options?.orderId ?? 'order-vnm-1111',
    },
    displayedStock: options?.displayedStock ?? 8,
  };
}

/**
 * Recursively freezes an object to catch accidental in-place mutations.
 */
function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as Record<string, unknown>)[prop];
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });
  return obj;
}

describe('flashSaleReducer State Machine', () => {
  // Test 1: AVAILABLE + RESERVE_REQUESTED goes to RESERVING and decrements displayedStock
  it('1. AVAILABLE + RESERVE_REQUESTED goes to RESERVING and decrements displayedStock', () => {
    const state = createAvailableState(10);
    const action: FlashSaleAction = { type: 'RESERVE_REQUESTED' };

    const nextState = flashSaleReducer(state, action);

    expect(nextState.lock.status).toBe('RESERVING');
    expect(nextState.displayedStock).toBe(9);
  });

  // Test 2: RESERVE_REQUESTED is ignored when displayedStock is 0
  it('2. RESERVE_REQUESTED is ignored when displayedStock is 0', () => {
    const state = createAvailableState(0);
    const action: FlashSaleAction = { type: 'RESERVE_REQUESTED' };

    const nextState = flashSaleReducer(state, action);

    expect(nextState).toBe(state);
    expect(nextState.lock.status).toBe('AVAILABLE');
    expect(nextState.displayedStock).toBe(0);
  });

  // Test 3: A second RESERVE_REQUESTED while RESERVING is ignored (double click)
  it('3. A second RESERVE_REQUESTED while RESERVING is ignored (double click)', () => {
    const state = createReservingState(9);
    const action: FlashSaleAction = { type: 'RESERVE_REQUESTED' };

    const nextState = flashSaleReducer(state, action);

    expect(nextState).toBe(state);
    expect(nextState.lock.status).toBe('RESERVING');
    expect(nextState.displayedStock).toBe(9);
  });

  // Test 4: RESERVING + RESERVE_SUCCEEDED goes to RESERVED with extensionsUsed 0
  it('4. RESERVING + RESERVE_SUCCEEDED goes to RESERVED with extensionsUsed 0', () => {
    const state = createReservingState(9);
    const action: FlashSaleAction = {
      type: 'RESERVE_SUCCEEDED',
      reservationId: 'res-abc-456',
      expiresAt: 1700000060000,
      serverStock: 8,
    };

    const nextState = flashSaleReducer(state, action);

    expect(nextState.lock).toEqual({
      status: 'RESERVED',
      reservationId: 'res-abc-456',
      expiresAt: 1700000060000,
      extensionsUsed: 0,
    });
    expect(nextState.displayedStock).toBe(8);
  });

  // Test 5: RESERVING + RESERVE_REJECTED (SOLD_OUT) rolls displayedStock back to serverStock and goes to SOLD_OUT
  it('5. RESERVING + RESERVE_REJECTED (SOLD_OUT) rolls displayedStock back to serverStock and goes to SOLD_OUT', () => {
    const state = createReservingState(0);
    const action: FlashSaleAction = {
      type: 'RESERVE_REJECTED',
      reason: 'SOLD_OUT',
      serverStock: 0,
    };

    const nextState = flashSaleReducer(state, action);

    expect(nextState.lock.status).toBe('SOLD_OUT');
    expect(nextState.displayedStock).toBe(0);
  });

  // Test 6: RESERVED + EXTEND_SUCCEEDED works once; a second extension is ignored
  it('6. RESERVED + EXTEND_SUCCEEDED works once; a second extension is ignored', () => {
    const state = createReservedState({
      expiresAt: 1700000060000,
      extensionsUsed: 0,
    });
    const firstExtendAction: FlashSaleAction = {
      type: 'EXTEND_SUCCEEDED',
      expiresAt: 1700000120000,
    };

    const stateAfterFirst = flashSaleReducer(state, firstExtendAction);

    expect(stateAfterFirst.lock).toEqual({
      status: 'RESERVED',
      reservationId: 'res-unit-test-1',
      expiresAt: 1700000120000,
      extensionsUsed: 1,
    });

    const secondExtendAction: FlashSaleAction = {
      type: 'EXTEND_SUCCEEDED',
      expiresAt: 1700000180000,
    };
    const stateAfterSecond = flashSaleReducer(stateAfterFirst, secondExtendAction);

    // Second extension must be completely ignored
    expect(stateAfterSecond).toBe(stateAfterFirst);
    expect(stateAfterSecond.lock).toEqual({
      status: 'RESERVED',
      reservationId: 'res-unit-test-1',
      expiresAt: 1700000120000,
      extensionsUsed: 1,
    });
  });

  // Test 7: RESERVED + EXPIRED goes to EXPIRED; then CHECKOUT_REQUESTED is ignored
  it('7. RESERVED + EXPIRED goes to EXPIRED; then CHECKOUT_REQUESTED is ignored', () => {
    const state = createReservedState({ displayedStock: 5 });
    const expiredAction: FlashSaleAction = {
      type: 'EXPIRED',
      serverStock: 6,
    };

    const expiredState = flashSaleReducer(state, expiredAction);

    expect(expiredState.lock.status).toBe('EXPIRED');
    expect(expiredState.displayedStock).toBe(6);

    const checkoutAction: FlashSaleAction = { type: 'CHECKOUT_REQUESTED' };
    const ignoredCheckoutState = flashSaleReducer(expiredState, checkoutAction);

    expect(ignoredCheckoutState).toBe(expiredState);
    expect(ignoredCheckoutState.lock.status).toBe('EXPIRED');
  });

  // Test 8: CHECKING_OUT + CHECKOUT_SUCCEEDED goes to PURCHASED; PURCHASED ignores RESERVE_REQUESTED
  it('8. CHECKING_OUT + CHECKOUT_SUCCEEDED goes to PURCHASED; PURCHASED ignores RESERVE_REQUESTED', () => {
    const checkingOutState = createCheckingOutState({
      reservationId: 'res-order-789',
      displayedStock: 3,
    });
    const checkoutSuccessAction: FlashSaleAction = {
      type: 'CHECKOUT_SUCCEEDED',
      orderId: 'ORDER-VND-888',
    };

    const purchasedState = flashSaleReducer(checkingOutState, checkoutSuccessAction);

    expect(purchasedState.lock).toEqual({
      status: 'PURCHASED',
      orderId: 'ORDER-VND-888',
    });
    expect(purchasedState.displayedStock).toBe(3);

    // PURCHASED is terminal and must ignore RESERVE_REQUESTED
    const reserveAttempt = flashSaleReducer(purchasedState, {
      type: 'RESERVE_REQUESTED',
    });
    expect(reserveAttempt).toBe(purchasedState);
    expect(reserveAttempt.lock.status).toBe('PURCHASED');
  });

  // Test 9: The reducer never mutates its input (use Object.freeze on the input state)
  it('9. The reducer never mutates its input (use Object.freeze on the input state)', () => {
    const available = deepFreeze(createAvailableState(10));
    expect(() => {
      flashSaleReducer(available, { type: 'RESERVE_REQUESTED' });
    }).not.toThrow();

    const reserving = deepFreeze(createReservingState(9));
    expect(() => {
      flashSaleReducer(reserving, {
        type: 'RESERVE_SUCCEEDED',
        reservationId: 'res-freeze',
        expiresAt: Date.now() + 10000,
        serverStock: 9,
      });
    }).not.toThrow();

    const reserved = deepFreeze(createReservedState());
    expect(() => {
      flashSaleReducer(reserved, { type: 'CHECKOUT_REQUESTED' });
    }).not.toThrow();

    const checkingOut = deepFreeze(createCheckingOutState());
    expect(() => {
      flashSaleReducer(checkingOut, {
        type: 'CHECKOUT_SUCCEEDED',
        orderId: 'ord-freeze',
      });
    }).not.toThrow();

    const purchased = deepFreeze(createPurchasedState());
    expect(() => {
      flashSaleReducer(purchased, { type: 'RESERVE_REQUESTED' });
    }).not.toThrow();
  });

  // Test 10: displayedStock never becomes negative
  it('10. displayedStock never becomes negative', () => {
    const availableState = createAvailableState(0);

    // Syncing negative stock from server is clamped to 0
    const syncedState = flashSaleReducer(availableState, {
      type: 'STOCK_SYNCED',
      serverStock: -15,
    });
    expect(syncedState.displayedStock).toBe(0);

    // Rejection returning negative stock is clamped to 0
    const reservingState = createReservingState(0);
    const rejectedState = flashSaleReducer(reservingState, {
      type: 'RESERVE_REJECTED',
      reason: 'SOLD_OUT',
      serverStock: -3,
    });
    expect(rejectedState.displayedStock).toBe(0);

    // Resetting with negative stock is clamped to 0
    const resetState = flashSaleReducer(availableState, {
      type: 'RESET',
      stock: -50,
    });
    expect(resetState.displayedStock).toBe(0);
  });
});
