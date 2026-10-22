/**
 * Product domain entity representing an item on flash sale.
 */
export interface Product {
  id: string;
  name: string;
  priceVnd: number;
  originalPriceVnd: number;
}

/**
 * Discriminated union modeling inventory lock lifecycle states.
 */
export type LockState =
  | { status: 'AVAILABLE' }
  | { status: 'RESERVING' }
  | {
      status: 'RESERVED';
      reservationId: string;
      expiresAt: number;
      extensionsUsed: number;
    }
  | {
      status: 'CHECKING_OUT';
      reservationId: string;
    }
  | {
      status: 'PURCHASED';
      orderId: string;
    }
  | { status: 'EXPIRED' }
  | { status: 'SOLD_OUT' }
  | {
      status: 'ERROR';
      message: string;
    };

/**
 * Composite state combining the inventory lock machine with displayed stock.
 */
export interface FlashSaleState {
  lock: LockState;
  displayedStock: number;
}

/**
 * Reasons why a reservation request may be rejected by the server.
 */
export type ReservationRejectionReason =
  | 'SOLD_OUT'
  | 'ALREADY_RESERVED'
  | 'SALE_NOT_LIVE'
  | 'NETWORK';

/**
 * Discriminated union of all discrete actions handled by the flash sale reducer.
 */
export type FlashSaleAction =
  | { type: 'RESERVE_REQUESTED' }
  | {
      type: 'RESERVE_SUCCEEDED';
      reservationId: string;
      expiresAt: number;
      serverStock: number;
    }
  | {
      type: 'RESERVE_REJECTED';
      reason: ReservationRejectionReason;
      serverStock: number;
    }
  | {
      type: 'EXTEND_SUCCEEDED';
      expiresAt: number;
    }
  | { type: 'CHECKOUT_REQUESTED' }
  | {
      type: 'CHECKOUT_SUCCEEDED';
      orderId: string;
    }
  | {
      type: 'CHECKOUT_FAILED';
      message: string;
    }
  | {
      type: 'EXPIRED';
      serverStock: number;
    }
  | {
      type: 'STOCK_SYNCED';
      serverStock: number;
    }
  | {
      type: 'RESET';
      stock: number;
    };
