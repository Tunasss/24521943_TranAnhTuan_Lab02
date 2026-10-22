import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatDuration, useCountdown } from './useCountdown';

describe('formatDuration', () => {
  it('formats zero seconds as 00:00:00', () => {
    expect(formatDuration(0)).toBe('00:00:00');
  });

  it('formats seconds, minutes, and hours with zero-padding', () => {
    expect(formatDuration(5)).toBe('00:00:05');
    expect(formatDuration(65)).toBe('00:01:05');
    expect(formatDuration(3665)).toBe('01:01:05');
  });

  it('clamps negative values to 00:00:00', () => {
    expect(formatDuration(-10)).toBe('00:00:00');
  });
});

describe('useCountdown Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing and returns 0 when targetTimestampMs is null', () => {
    const { result } = renderHook(() => useCountdown(null));

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.formatted).toBe('00:00:00');
  });

  it('computes initial seconds from targetTimestampMs and now function', () => {
    const startTime = 1000000;
    const targetTime = startTime + 10500; // 10.5s -> 11s ceil
    const currentTime = startTime;
    const nowFn = () => currentTime;

    const { result } = renderHook(() => useCountdown(targetTime, nowFn));

    expect(result.current.secondsLeft).toBe(11);
    expect(result.current.formatted).toBe('00:00:11');
    expect(result.current.isComplete).toBe(false);
  });

  it('throttles renders: state only updates when displayed whole second changes', () => {
    let renderCount = 0;
    const startTime = 1000000;
    const targetTime = startTime + 3000;
    let currentTime = startTime;
    const nowFn = () => currentTime;

    const { result } = renderHook(() => {
      renderCount++;
      return useCountdown(targetTime, nowFn);
    });

    const initialRenders = renderCount;

    // Simulate 30 frames within 500ms (same second: 3s left)
    for (let i = 0; i < 30; i++) {
      currentTime += 16;
      act(() => {
        vi.advanceTimersByTime(16);
      });
    }

    // Still in the 3s window (approx 2520ms remaining -> Math.ceil is 3)
    expect(result.current.secondsLeft).toBe(3);
    // Render count should NOT have exploded to 30+ renders
    expect(renderCount).toBeLessThanOrEqual(initialRenders + 1);

    // Advance across whole second boundary to 1900ms remaining -> 2s
    currentTime = startTime + 1100;
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current.secondsLeft).toBe(2);
  });

  it('sets isComplete to true and secondsLeft to 0 on expiration', () => {
    const startTime = 1000000;
    const targetTime = startTime + 2000;
    let currentTime = startTime;
    const nowFn = () => currentTime;

    const { result } = renderHook(() => useCountdown(targetTime, nowFn));

    expect(result.current.isComplete).toBe(false);

    // Advance past end
    currentTime = targetTime + 10;
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isComplete).toBe(true);
    expect(result.current.formatted).toBe('00:00:00');
  });

  it('does not restart timer when now reference changes', () => {
    const startTime = 1000000;
    const targetTime = startTime + 5000;
    let currentTime = startTime;

    const { result, rerender } = renderHook(
      ({ now }) => useCountdown(targetTime, now),
      {
        initialProps: { now: () => currentTime },
      },
    );

    expect(result.current.secondsLeft).toBe(5);

    // Advance 1s
    currentTime += 1000;
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Provide a new function reference for now
    rerender({ now: () => currentTime });

    // The remaining duration should NOT reset to 5s
    expect(result.current.secondsLeft).toBe(4);
  });
});
