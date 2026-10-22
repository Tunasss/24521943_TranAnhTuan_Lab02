import { useState } from 'react';
import type { LockState, Product } from './flash-sale-types';
import { useFlashSale } from './useFlashSale';
import './App.css';

/**
 * Promotional product entity on flash sale.
 */
const FLASH_SALE_PRODUCT: Product = {
  id: 'prod-earbuds-vn-01',
  name: 'Wireless Earbuds',
  priceVnd: 399_000,
  originalPriceVnd: 790_000,
};

/**
 * Currency formatter formatting numbers according to Vietnamese Dong (VND) locale standards.
 */
const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

const formattedPrice = vndFormatter.format(FLASH_SALE_PRODUCT.priceVnd);
const formattedOriginalPrice = vndFormatter.format(
  FLASH_SALE_PRODUCT.originalPriceVnd,
);

/**
 * Renders the state-machine-driven action area with compile-time exhaustiveness checking.
 */
function renderActionArea(
  lock: LockState,
  isSaleLive: boolean,
  displayedStock: number,
  reservationFormatted: string,
  onReserve: () => void,
  onExtend: () => void,
  onCheckout: () => void,
): React.ReactNode {
  switch (lock.status) {
    case 'AVAILABLE': {
      const isDisabled = !isSaleLive || displayedStock <= 0;
      return (
        <button
          type="button"
          onClick={onReserve}
          disabled={isDisabled}
          className="action-button primary"
        >
          Reserve now
        </button>
      );
    }

    case 'RESERVING': {
      return (
        <button type="button" disabled className="action-button disabled">
          Reserving...
        </button>
      );
    }

    case 'RESERVED': {
      return (
        <div className="reserved-panel">
          <p role="timer" aria-live="off" className="timer-display">
            Hold expires in: {reservationFormatted}
          </p>
          <div className="button-group">
            <button
              type="button"
              onClick={onCheckout}
              className="action-button checkout"
            >
              Checkout
            </button>
            <button
              type="button"
              onClick={onExtend}
              disabled={lock.extensionsUsed >= 1}
              className="action-button extend"
              aria-label={
                lock.extensionsUsed >= 1
                  ? 'Extension hold limit reached'
                  : 'Extend hold by 30 seconds'
              }
            >
              Extend hold
            </button>
          </div>
        </div>
      );
    }

    case 'CHECKING_OUT': {
      return (
        <button type="button" disabled className="action-button disabled">
          Processing...
        </button>
      );
    }

    case 'PURCHASED': {
      return (
        <p className="order-confirmed">
          Order confirmed: <code>{lock.orderId}</code>
        </p>
      );
    }

    case 'EXPIRED': {
      return (
        <div className="action-subgroup">
          <p className="status-text warning">Your hold expired</p>
          <button
            type="button"
            onClick={onReserve}
            disabled={!isSaleLive || displayedStock <= 0}
            className="action-button primary"
          >
            Try again
          </button>
        </div>
      );
    }

    case 'SOLD_OUT': {
      return <p className="status-text sold-out">Sold out</p>;
    }

    case 'ERROR': {
      return (
        <div className="action-subgroup">
          <p className="status-text error">{lock.message}</p>
          <button
            type="button"
            onClick={onReserve}
            disabled={!isSaleLive || displayedStock <= 0}
            className="action-button primary"
          >
            Try again
          </button>
        </div>
      );
    }

    default: {
      const _exhaustiveCheck: never = lock;
      return _exhaustiveCheck;
    }
  }
}

/**
 * Main application component presenting the high-concurrency flash sale storefront.
 */
export default function App() {
  const {
    state,
    saleCountdown,
    reservationCountdown,
    isSaleLive,
    reserve,
    extend,
    checkout,
  } = useFlashSale();

  // Screen reader accessible announcement state (synchronized during render without effect cascade)
  const [prevStatus, setPrevStatus] = useState<string>(state.lock.status);
  const [prevMilestone, setPrevMilestone] = useState<number | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>(
    'Midnight Flash Sale countdown is active.',
  );

  const reservationSec =
    state.lock.status === 'RESERVED' ? reservationCountdown.secondsLeft : null;
  const isMilestone =
    reservationSec === 30 || reservationSec === 10 || reservationSec === 0;

  // Sync state transitions during render
  if (prevStatus !== state.lock.status) {
    setPrevStatus(state.lock.status);
    setPrevMilestone(null);

    switch (state.lock.status) {
      case 'AVAILABLE':
        setLiveAnnouncement('Item is available for reservation.');
        break;
      case 'RESERVING':
        setLiveAnnouncement('Reserving item...');
        break;
      case 'RESERVED':
        setLiveAnnouncement('Item reserved. Hold expires in 60 seconds.');
        break;
      case 'CHECKING_OUT':
        setLiveAnnouncement('Processing checkout payment...');
        break;
      case 'PURCHASED':
        setLiveAnnouncement(`Order confirmed. Order ID: ${state.lock.orderId}`);
        break;
      case 'EXPIRED':
        setLiveAnnouncement('Your reservation hold has expired.');
        break;
      case 'SOLD_OUT':
        setLiveAnnouncement('This item is now sold out.');
        break;
      case 'ERROR':
        setLiveAnnouncement(`Error occurred: ${state.lock.message}`);
        break;
      default: {
        const _exhaustiveCheck: never = state.lock;
        throw new Error(`Unhandled lock status: ${_exhaustiveCheck}`);
      }
    }
  } else if (
    state.lock.status === 'RESERVED' &&
    isMilestone &&
    reservationSec !== null &&
    prevMilestone !== reservationSec
  ) {
    setPrevMilestone(reservationSec);
    if (reservationSec === 0) {
      setLiveAnnouncement('Reservation hold has expired.');
    } else {
      setLiveAnnouncement(
        `${reservationSec} seconds remaining to complete your order checkout.`,
      );
    }
  }

  return (
    <main className="flash-sale-main">
      <h1>Midnight Flash Sale</h1>

      <section
        aria-labelledby="sale-heading"
        className="sale-countdown-section"
      >
        <h2 id="sale-heading">Flash Sale Schedule</h2>
        <p role="timer" aria-live="off" className="sale-timer">
          {isSaleLive ? 'Sale is live' : `Starts in: ${saleCountdown.formatted}`}
        </p>
      </section>

      <article
        aria-labelledby="product-heading"
        className="product-card"
      >
        <h3 id="product-heading">{FLASH_SALE_PRODUCT.name}</h3>

        <div className="price-row">
          <span className="sale-price">{formattedPrice}</span>
          <s
            className="original-price"
            aria-label={`Original price: ${formattedOriginalPrice}`}
          >
            {formattedOriginalPrice}
          </s>
        </div>

        <div className="stock-row">
          <progress
            id="stock-progress"
            max={5}
            value={state.displayedStock}
            aria-label="Available stock"
          />
          <span className="stock-count-text">
            {state.displayedStock} left
          </span>
        </div>

        <div className="action-area">
          {renderActionArea(
            state.lock,
            isSaleLive,
            state.displayedStock,
            reservationCountdown.formatted,
            reserve,
            extend,
            checkout,
          )}
        </div>
      </article>

      {/* Screen reader live region - announces only on status change and at 30, 10, 0s */}
      <p role="status" aria-live="polite" className="sr-live-region">
        {liveAnnouncement}
      </p>
    </main>
  );
}
