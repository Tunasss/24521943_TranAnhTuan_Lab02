import { describe, expect, it } from 'vitest';
import { flashSaleReducer } from './flash-sale-reducer';
import type { FlashSaleAction, FlashSaleState } from './flash-sale-types';

describe('flashSaleReducer', () => {
  const initialAvailableState: FlashSaleState = {
    lock: { status: 'AVAILABLE' },
    displayedStock: 10,
  };

  it('handles RESERVE_REQUESTED optimistically from AVAILABLE', () => {
    const action: FlashSaleAction = { type: 'RESERVE_REQUESTED' };
    const nextState = flashSaleReducer(initialAvailableState, action);

    expect(nextState.lock.status).toBe('RESERVING');
    expect(nextState.displayedStock).toBe(9);
    // Preserves immutability
    expect(initialAvailableState.displayedStock).toBe(10);
  });

  it('rejects RESERVE_REQUESTED when displayedStock is 0', () => {
    const zeroStockState: FlashSaleState = {
      lock: { status: 'AVAILABLE' },
      displayedStock: 0,
    };
    const action: FlashSaleAction = { type: 'RESERVE_REQUESTED' };
    const nextState = flashSaleReducer(zeroStockState, action);

    // Returns exact same state reference on illegal transition
    expect(nextState).toBe(zeroStockState);
  });

  it('allows RESERVE_REQUESTED from EXPIRED state if stock is available', () => {
    const expiredState: FlashSaleState = {
      lock: { status: 'EXPIRED' },
      displayedStock: 5,
    };
    const action: FlashSaleAction = { type: 'RESERVE_REQUESTED' };
    const nextState = flashSaleReducer(expiredState, action);

    expect(nextState.lock.status).toBe('RESERVING');
    expect(nextState.displayedStock).toBe(4);
  });

  it('ignores RESERVE_REQUESTED from illegal states (RESERVED, CHECKING_OUT, SOLD_OUT)', () => {
    const reservedState: FlashSaleState = {
      lock: {
        status: 'RESERVED',
        reservationId: 'res-1',
        expiresAt: Date.now() + 60000,
        extensionsUsed: 0,
      },
      displayedStock: 5,
    };
    expect(flashSaleReducer(reservedState, { type: 'RESERVE_REQUESTED' })).toBe(reservedState);
  });

  it('transitions RESERVE_SUCCEEDED from RESERVING to RESERVED and updates stock', () => {
    const reservingState: FlashSaleState = {
      lock: { status: 'RESERVING' },
      displayedStock: 9,
    };
    const action: FlashSaleAction = {
      type: 'RESERVE_SUCCEEDED',
      reservationId: 'res-123',
      expiresAt: 1700000000000,
      serverStock: 8,
    };
    const nextState = flashSaleReducer(reservingState, action);

    expect(nextState.lock).toEqual({
      status: 'RESERVED',
      reservationId: 'res-123',
      expiresAt: 1700000000000,
      extensionsUsed: 0,
    });
    expect(nextState.displayedStock).toBe(8);
  });

  it('ignores RESERVE_SUCCEEDED if not in RESERVING state', () => {
    const action: FlashSaleAction = {
      type: 'RESERVE_SUCCEEDED',
      reservationId: 'res-123',
      expiresAt: 1700000000000,
      serverStock: 8,
    };
    expect(flashSaleReducer(initialAvailableState, action)).toBe(initialAvailableState);
  });

  it('handles RESERVE_REJECTED with SOLD_OUT', () => {
    const reservingState: FlashSaleState = {
      lock: { status: 'RESERVING' },
      displayedStock: 0,
    };
    const action: FlashSaleAction = {
      type: 'RESERVE_REJECTED',
      reason: 'SOLD_OUT',
      serverStock: 0,
    };
    const nextState = flashSaleReducer(reservingState, action);

    expect(nextState.lock.status).toBe('SOLD_OUT');
    expect(nextState.displayedStock).toBe(0);
  });

  it('handles RESERVE_REJECTED with NETWORK error and rolls back stock', () => {
    const reservingState: FlashSaleState = {
      lock: { status: 'RESERVING' },
      displayedStock: 4,
    };
    const action: FlashSaleAction = {
      type: 'RESERVE_REJECTED',
      reason: 'NETWORK',
      serverStock: 5,
    };
    const nextState = flashSaleReducer(reservingState, action);

    expect(nextState.lock.status).toBe('ERROR');
    if (nextState.lock.status === 'ERROR') {
      expect(nextState.lock.message).toContain('Network');
    }
    expect(nextState.displayedStock).toBe(5);
  });

  it('handles EXTEND_SUCCEEDED once and blocks second extension', () => {
    const reservedState: FlashSaleState = {
      lock: {
        status: 'RESERVED',
        reservationId: 'res-123',
        expiresAt: 1000,
        extensionsUsed: 0,
      },
      displayedStock: 5,
    };
    const extendAction: FlashSaleAction = {
      type: 'EXTEND_SUCCEEDED',
      expiresAt: 2000,
    };
    const firstExtend = flashSaleReducer(reservedState, extendAction);

    expect(firstExtend.lock).toEqual({
      status: 'RESERVED',
      reservationId: 'res-123',
      expiresAt: 2000,
      extensionsUsed: 1,
    });

    // Second extension must be rejected (extensionsUsed >= 1)
    const secondExtend = flashSaleReducer(firstExtend, {
      type: 'EXTEND_SUCCEEDED',
      expiresAt: 3000,
    });
    expect(secondExtend).toBe(firstExtend);
  });

  it('handles CHECKOUT lifecycle (REQUESTED -> SUCCEEDED / FAILED)', () => {
    const reservedState: FlashSaleState = {
      lock: {
        status: 'RESERVED',
        reservationId: 'res-xyz',
        expiresAt: 1000,
        extensionsUsed: 0,
      },
      displayedStock: 3,
    };

    // Checkout requested
    const checkingOut = flashSaleReducer(reservedState, { type: 'CHECKOUT_REQUESTED' });
    expect(checkingOut.lock).toEqual({
      status: 'CHECKING_OUT',
      reservationId: 'res-xyz',
    });

    // Checkout failed
    const failedCheckout = flashSaleReducer(checkingOut, {
      type: 'CHECKOUT_FAILED',
      message: 'Payment card declined',
    });
    expect(failedCheckout.lock).toEqual({
      status: 'ERROR',
      message: 'Payment card declined',
    });

    // Checkout succeeded
    const succeededCheckout = flashSaleReducer(checkingOut, {
      type: 'CHECKOUT_SUCCEEDED',
      orderId: 'ord-999',
    });
    expect(succeededCheckout.lock).toEqual({
      status: 'PURCHASED',
      orderId: 'ord-999',
    });

    // PURCHASED is terminal: only RESET can transition out
    const attemptReserveAfterPurchase = flashSaleReducer(succeededCheckout, {
      type: 'RESERVE_REQUESTED',
    });
    expect(attemptReserveAfterPurchase).toBe(succeededCheckout);

    // RESET leaves PURCHASED
    const resetState = flashSaleReducer(succeededCheckout, {
      type: 'RESET',
      stock: 20,
    });
    expect(resetState.lock.status).toBe('AVAILABLE');
    expect(resetState.displayedStock).toBe(20);
  });

  it('handles EXPIRED action from RESERVED', () => {
    const reservedState: FlashSaleState = {
      lock: {
        status: 'RESERVED',
        reservationId: 'res-123',
        expiresAt: 1000,
        extensionsUsed: 0,
      },
      displayedStock: 2,
    };

    const expiredState = flashSaleReducer(reservedState, {
      type: 'EXPIRED',
      serverStock: 3,
    });
    expect(expiredState.lock.status).toBe('EXPIRED');
    expect(expiredState.displayedStock).toBe(3);
  });

  it('enforces non-negative displayedStock invariant across sync actions', () => {
    const synced = flashSaleReducer(initialAvailableState, {
      type: 'STOCK_SYNCED',
      serverStock: -5,
    });
    expect(synced.displayedStock).toBe(0);

    const resetNegative = flashSaleReducer(initialAvailableState, {
      type: 'RESET',
      stock: -10,
    });
    expect(resetNegative.displayedStock).toBe(0);
  });
});
