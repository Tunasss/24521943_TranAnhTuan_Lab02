import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlashSaleServer } from './mock-server';

describe('FlashSaleServer Concurrency & Lifecycle', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('guarantees atomic reservation without overselling under concurrent requests', async () => {
    const initialStock = 5;
    const server = new FlashSaleServer({
      initialStock,
      saleStartsAt: Date.now() - 1000, // Already active
      reservationTtlMs: 30_000,
      extensionMs: 15_000,
      networkFailureRate: 0, // Deterministic for concurrency test
    });

    // Launch 15 concurrent users simultaneously
    const userIds = Array.from({ length: 15 }, (_, i) => `user-concurrent-${i}`);
    const results = await Promise.all(userIds.map((uid) => server.reserve(uid)));

    const successful = results.filter((r) => r.ok);
    const soldOut = results.filter((r) => !r.ok && r.reason === 'SOLD_OUT');

    // Exactly 5 reservations granted, 10 sold out
    expect(successful.length).toBe(5);
    expect(soldOut.length).toBe(10);

    const snapshot = await server.getSnapshot();
    expect(snapshot.stock).toBe(0);
  });

  it('blocks multiple active reservations for the same user', async () => {
    const server = new FlashSaleServer({
      initialStock: 10,
      saleStartsAt: Date.now() - 1000,
      reservationTtlMs: 30_000,
      extensionMs: 15_000,
      networkFailureRate: 0,
    });

    const first = await server.reserve('user-duplicate');
    expect(first.ok).toBe(true);

    const second = await server.reserve('user-duplicate');
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.reason).toBe('ALREADY_RESERVED');
    }
  });

  it('rejects reservation if sale has not started yet', async () => {
    const server = new FlashSaleServer({
      initialStock: 10,
      saleStartsAt: Date.now() + 100_000, // Future
      reservationTtlMs: 30_000,
      extensionMs: 15_000,
      networkFailureRate: 0,
    });

    const res = await server.reserve('early-bird');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe('SALE_NOT_LIVE');
    }
  });

  it('allows reservation extension once and rejects subsequent extensions', async () => {
    const server = new FlashSaleServer({
      initialStock: 5,
      saleStartsAt: Date.now() - 1000,
      reservationTtlMs: 10_000,
      extensionMs: 5_000,
      networkFailureRate: 0,
    });

    const reserveRes = await server.reserve('user-ext');
    expect(reserveRes.ok).toBe(true);

    if (reserveRes.ok) {
      const extendRes = await server.extend(reserveRes.reservationId);
      expect(extendRes.expiresAt).toBe(reserveRes.expiresAt + 5_000);

      // Second extension throws
      await expect(server.extend(reserveRes.reservationId)).rejects.toThrow(
        'Reservation has already been extended once.',
      );
    }
  });

  it('allows checkout of active reservation and consumes it', async () => {
    const server = new FlashSaleServer({
      initialStock: 5,
      saleStartsAt: Date.now() - 1000,
      reservationTtlMs: 10_000,
      extensionMs: 5_000,
      networkFailureRate: 0,
    });

    const reserveRes = await server.reserve('user-checkout');
    expect(reserveRes.ok).toBe(true);

    if (reserveRes.ok) {
      const checkoutRes = await server.checkout(reserveRes.reservationId);
      expect(checkoutRes.orderId).toContain('ORD-VN-');

      // Attempting to checkout again should fail
      await expect(server.checkout(reserveRes.reservationId)).rejects.toThrow(
        'Reservation expired or invalid.',
      );
    }
  });

  it('reclaims expired reservations during sweep', async () => {
    const server = new FlashSaleServer({
      initialStock: 1,
      saleStartsAt: Date.now() - 1000,
      reservationTtlMs: 50, // Expires in 50ms
      extensionMs: 5_000,
      networkFailureRate: 0,
    });

    const first = await server.reserve('user-exp');
    expect(first.ok).toBe(true);

    // Wait for expiration
    await new Promise((r) => setTimeout(r, 60));

    // Another user can now reserve because expired unit was swept back
    const second = await server.reserve('user-reclaimed');
    expect(second.ok).toBe(true);
  });

  it('runs bots and halts when stopBots is called', () => {
    vi.useFakeTimers();

    const server = new FlashSaleServer({
      initialStock: 5,
      saleStartsAt: Date.now() - 1000,
      reservationTtlMs: 10_000,
      extensionMs: 5_000,
      networkFailureRate: 0,
    });

    let stockUpdate = 5;
    const unsub = server.subscribe((stock) => {
      stockUpdate = stock;
    });

    server.startBots();

    // Advance 3000ms
    vi.advanceTimersByTime(3000);
    expect(stockUpdate).toBeLessThan(5);

    server.stopBots();
    const stoppedStock = stockUpdate;

    // Advance further; stock should remain constant
    vi.advanceTimersByTime(5000);
    expect(stockUpdate).toBe(stoppedStock);

    unsub();
  });
});
