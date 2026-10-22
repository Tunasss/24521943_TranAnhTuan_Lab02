import type { FlashSaleAction, FlashSaleState } from './flash-sale-types';

/**
 * Pure state reducer governing the optimistic flash-sale inventory lock state machine.
 *
 * Invariants and Architectural Rules:
 * 1. Strict Immutability: Never mutates the incoming state; always returns a new state object or
 *    the existing state reference for invalid transitions.
 * 2. Non-Negative Stock Invariant: displayedStock is strictly clamped at >= 0 using Math.max(0, ...).
 * 3. Terminal State Guard: PURCHASED is terminal; only the RESET action can transition out of it.
 * 4. Optimistic Concurrency: RESERVE_REQUESTED decrements displayedStock before network confirmation,
 *    and RESERVE_REJECTED rolls back directly to the authoritative serverStock.
 * 5. Exhaustive Matching: Switch statement enforces compile-time exhaustiveness via TypeScript 'never'.
 *
 * @param state - Current flash sale machine state
 * @param action - Dispatched flash sale action
 * @returns Next immutable state
 */
export function flashSaleReducer(
  state: FlashSaleState,
  action: FlashSaleAction,
): FlashSaleState {
  // PURCHASED is terminal: only RESET can transition out of PURCHASED
  if (state.lock.status === 'PURCHASED' && action.type !== 'RESET') {
    return state;
  }

  switch (action.type) {
    case 'RESERVE_REQUESTED': {
      // Allowed only from AVAILABLE or EXPIRED, and only when displayedStock > 0
      if (
        state.lock.status !== 'AVAILABLE' &&
        state.lock.status !== 'EXPIRED'
      ) {
        return state;
      }

      if (state.displayedStock <= 0) {
        return state;
      }

      return {
        lock: { status: 'RESERVING' },
        displayedStock: Math.max(0, state.displayedStock - 1),
      };
    }

    case 'RESERVE_SUCCEEDED': {
      // Allowed only from RESERVING state
      if (state.lock.status !== 'RESERVING') {
        return state;
      }

      return {
        lock: {
          status: 'RESERVED',
          reservationId: action.reservationId,
          expiresAt: action.expiresAt,
          extensionsUsed: 0,
        },
        displayedStock: Math.max(0, action.serverStock),
      };
    }

    case 'RESERVE_REJECTED': {
      // Allowed only from RESERVING state
      if (state.lock.status !== 'RESERVING') {
        return state;
      }

      const authoritativeStock = Math.max(0, action.serverStock);

      if (action.reason === 'SOLD_OUT') {
        return {
          lock: { status: 'SOLD_OUT' },
          displayedStock: authoritativeStock,
        };
      }

      let errorMessage: string;
      if (action.reason === 'NETWORK') {
        errorMessage =
          'Network connection error while reserving stock. Please try again.';
      } else if (action.reason === 'ALREADY_RESERVED') {
        errorMessage =
          'You already hold an active reservation for this promotional item.';
      } else if (action.reason === 'SALE_NOT_LIVE') {
        errorMessage = 'This flash sale session is not currently active.';
      } else {
        errorMessage = 'Unable to complete reservation due to a server error.';
      }

      return {
        lock: {
          status: 'ERROR',
          message: errorMessage,
        },
        displayedStock: authoritativeStock,
      };
    }

    case 'EXTEND_SUCCEEDED': {
      // Allowed only from RESERVED with extensionsUsed strictly < 1 (single-extension policy)
      if (
        state.lock.status !== 'RESERVED' ||
        state.lock.extensionsUsed >= 1
      ) {
        return state;
      }

      return {
        ...state,
        lock: {
          ...state.lock,
          expiresAt: action.expiresAt,
          extensionsUsed: state.lock.extensionsUsed + 1,
        },
      };
    }

    case 'CHECKOUT_REQUESTED': {
      // Allowed only from RESERVED state
      if (state.lock.status !== 'RESERVED') {
        return state;
      }

      return {
        ...state,
        lock: {
          status: 'CHECKING_OUT',
          reservationId: state.lock.reservationId,
        },
      };
    }

    case 'CHECKOUT_SUCCEEDED': {
      // Allowed only from CHECKING_OUT state
      if (state.lock.status !== 'CHECKING_OUT') {
        return state;
      }

      return {
        ...state,
        lock: {
          status: 'PURCHASED',
          orderId: action.orderId,
        },
      };
    }

    case 'CHECKOUT_FAILED': {
      // Allowed only from CHECKING_OUT state
      if (state.lock.status !== 'CHECKING_OUT') {
        return state;
      }

      return {
        ...state,
        lock: {
          status: 'ERROR',
          message: action.message,
        },
      };
    }

    case 'EXPIRED': {
      // Allowed only from RESERVED state
      if (state.lock.status !== 'RESERVED') {
        return state;
      }

      return {
        lock: { status: 'EXPIRED' },
        displayedStock: Math.max(0, action.serverStock),
      };
    }

    case 'STOCK_SYNCED': {
      // Updates stock in any non-terminal state, maintaining non-negative invariant
      return {
        ...state,
        displayedStock: Math.max(0, action.serverStock),
      };
    }

    case 'RESET': {
      // Resets state back to AVAILABLE with specified stock
      return {
        lock: { status: 'AVAILABLE' },
        displayedStock: Math.max(0, action.stock),
      };
    }

    default: {
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
    }
  }
}
