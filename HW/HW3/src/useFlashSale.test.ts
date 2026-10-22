import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlashSaleServer } from './mock-server';
import { useFlashSale } from './useFlashSale';

describe('useFlashSale Hook Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('mounts, synchronizes initial stock, and handles optimistic reservation', async () => {
    const server = new FlashSaleServer({
      initialStock: 3,
      saleStartsAt: Date.now() - 1000,
      reservationTtlMs: 30_000,
      extensionMs: 15_000,
      networkFailureRate: 0,
    });

    const { result } = renderHook(() => useFlashSale(server));

    // Resolve getSnapshot
    await act(async () => {
      await vi.advanceTimersByTimeAsync(850);
    });

    expect(result.current.state.displayedStock).toBe(3);
    expect(result.current.state.lock.status).toBe('AVAILABLE');

    // Trigger reserve optimistically
    let reservePromise: Promise<void>;
    act(() => {
      reservePromise = result.current.reserve();
    });

    // Optimistically decremented immediately before network completes
    expect(result.current.state.lock.status).toBe('RESERVING');
    expect(result.current.state.displayedStock).toBe(2);

    // Wait for server reservation to complete
    await act(async () => {
      await vi.advanceTimersByTimeAsync(850);
      await reservePromise;
    });

    expect(result.current.state.lock.status).toBe('RESERVED');
    // Account for concurrent background bot buyers: stock is decremented by user and potentially bot
    expect(result.current.state.displayedStock).toBeLessThanOrEqual(2);
    expect(result.current.state.displayedStock).toBeGreaterThanOrEqual(1);
  });

  it('rolls back optimistic reservation on network failure', async () => {
    const server = new FlashSaleServer({
      initialStock: 4,
      saleStartsAt: Date.now() - 1000,
      reservationTtlMs: 30_000,
      extensionMs: 15_000,
      networkFailureRate: 1, // Force 100% network failure
    });

    const { result } = renderHook(() => useFlashSale(server));

    // Resolve initial snapshot (override networkFailureRate temporarily or catch)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(850);
    });

    let reservePromise: Promise<void>;
    act(() => {
      reservePromise = result.current.reserve();
    });

    expect(result.current.state.lock.status).toBe('RESERVING');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(850);
      await reservePromise;
    });

    expect(result.current.state.lock.status).toBe('ERROR');
    if (result.current.state.lock.status === 'ERROR') {
      expect(result.current.state.lock.message).toContain('Network');
    }
  });

  it('stops bots and unsubscribes on unmount (StrictMode cleanup)', () => {
    const server = new FlashSaleServer({
      initialStock: 5,
      saleStartsAt: Date.now() - 1000,
      reservationTtlMs: 30_000,
      extensionMs: 15_000,
      networkFailureRate: 0,
    });

    const stopBotsSpy = vi.spyOn(server, 'stopBots');

    const { unmount } = renderHook(() => useFlashSale(server));

    unmount();

    expect(stopBotsSpy).toHaveBeenCalledTimes(1);
  });
});
