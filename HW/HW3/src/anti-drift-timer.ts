/**
 * Configuration options for the anti-drift countdown timer.
 */
export interface AntiDriftTimerOptions {
  /**
   * Callback invoked exactly once when the countdown reaches zero.
   */
  onComplete?: () => void;
  /**
   * Clock function returning the current epoch timestamp in milliseconds.
   * Defaults to Date.now. Can be customized for server offset synchronization or testing.
   */
  now?: () => number;
}

/**
 * Creates a high-precision anti-drift countdown timer.
 *
 * Design Invariants:
 * 1. Remaining time is computed mathematically from an absolute target timestamp (targetTime - now()).
 * 2. Never increments or decrements ticks sequentially to eliminate cumulative drift.
 * 3. Uses requestAnimationFrame for display updates and a setTimeout fallback for background tab continuity.
 * 4. Resynchronizes immediately upon tab visibility changes.
 * 5. Calls onComplete at most once and cleans up all active timers on cancel.
 *
 * @param durationMs - Duration of the countdown in milliseconds
 * @param onTick - Callback receiving the current remaining milliseconds
 * @param options - Optional configuration for completion callback and custom clock
 * @returns Cleanup function that cancels all active timers and listeners
 */
export function createAntiDriftTimer(
  durationMs: number,
  onTick: (remaining: number) => void,
  options?: AntiDriftTimerOptions,
): () => void {
  const nowFn = options?.now ?? Date.now;
  const targetTime = nowFn() + durationMs;

  let rafId: number | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let isCompleted = false;
  let isCancelled = false;

  /**
   * Cancels any pending animation frame or background timeout.
   */
  const clearPendingTimers = (): void => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  /**
   * Core tick evaluation calculating exact remaining duration from target timestamp.
   */
  const tick = (): void => {
    if (isCancelled || isCompleted) {
      return;
    }

    clearPendingTimers();

    const remaining = Math.max(0, targetTime - nowFn());

    if (remaining <= 0) {
      isCompleted = true;
      onTick(0);
      options?.onComplete?.();
      return;
    }

    onTick(remaining);

    // Schedule next frame for smooth animation while tab is visible
    rafId = requestAnimationFrame(tick);

    // Schedule timeout fallback ensuring onComplete executes even when background tab throttles rAF
    timeoutId = setTimeout(() => {
      tick();
    }, remaining);
  };

  /**
   * Document visibility listener resynchronizing timer immediately when tab returns to visible.
   */
  const handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      tick();
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  // Initialize countdown
  tick();

  // Return cleanup teardown function
  return () => {
    isCancelled = true;
    clearPendingTimers();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  };
}
