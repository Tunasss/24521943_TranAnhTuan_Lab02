import { useEffect, useMemo, useRef, useState } from 'react';
import { createAntiDriftTimer } from './anti-drift-timer';

export interface UseCountdownResult {
  secondsLeft: number;
  isComplete: boolean;
  formatted: string;
}

/**
 * Formats seconds into a zero-padded HH:MM:SS string.
 *
 * @param totalSeconds - Non-negative integer representing seconds
 */
export function formatDuration(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;

  const pad = (num: number): string => String(num).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Custom React hook managing an anti-drift countdown timer without per-frame state thrashing.
 *
 * Performance and timing rules:
 * - Computes remaining duration mathematically from an absolute target timestamp.
 * - Throttles React state updates strictly to once per displayed second (Math.ceil(remaining / 1000)).
 * - Employs a ref bridge for the clock function to prevent timer recreation on parent re-renders.
 * - Handles React StrictMode dual-mount lifecycle safely via deterministic timer cleanup.
 *
 * @param targetTimestampMs - Absolute epoch timestamp in milliseconds when the countdown ends, or null
 * @param now - Optional custom clock provider (defaults to Date.now)
 */
export function useCountdown(
  targetTimestampMs: number | null,
  now?: () => number,
): UseCountdownResult {
  // Ref bridge for clock function preventing effect dependency cycles
  const nowRef = useRef<() => number>(now ?? Date.now);

  useEffect(() => {
    nowRef.current = now ?? Date.now;
  }, [now]);

  // Initial calculation without accessing ref during render
  const [prevTarget, setPrevTarget] = useState<number | null>(targetTimestampMs);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (targetTimestampMs === null) {
      return 0;
    }
    const clock = now ?? Date.now;
    return Math.max(0, Math.ceil((targetTimestampMs - clock()) / 1000));
  });
  const [isComplete, setIsComplete] = useState<boolean>(false);

  // Sync state during render when targetTimestampMs changes (standard React pattern avoiding effect cascade)
  if (prevTarget !== targetTimestampMs) {
    setPrevTarget(targetTimestampMs);
    const clock = now ?? Date.now;
    const initialSec =
      targetTimestampMs === null
        ? 0
        : Math.max(0, Math.ceil((targetTimestampMs - clock()) / 1000));
    setSecondsLeft(initialSec);
    setIsComplete(false);
  }

  // Track latest per-frame value in a ref
  const latestFrameMsRef = useRef<number>(0);
  // Track the latest committed second in a ref to suppress redundant per-frame renders
  const prevSecondsRef = useRef<number>(secondsLeft);

  useEffect(() => {
    // When targetTimestampMs is null, do nothing and return secondsLeft 0
    if (targetTimestampMs === null) {
      latestFrameMsRef.current = 0;
      prevSecondsRef.current = 0;
      return;
    }

    const currentNow = nowRef.current();
    const durationMs = targetTimestampMs - currentNow;

    if (durationMs <= 0) {
      latestFrameMsRef.current = 0;
      prevSecondsRef.current = 0;
      // Already complete
      setIsComplete(true);
      setSecondsLeft(0);
      return;
    }

    const initialSec = Math.ceil(durationMs / 1000);
    latestFrameMsRef.current = durationMs;
    prevSecondsRef.current = initialSec;

    // Initialize high-precision anti-drift timer
    const cleanupTimer = createAntiDriftTimer(
      durationMs,
      (remainingMs) => {
        // Keep the latest per-frame value in a ref
        latestFrameMsRef.current = remainingMs;

        const currentSec = Math.ceil(remainingMs / 1000);

        // Crucial performance optimization: only trigger React render when the whole second changes
        if (currentSec !== prevSecondsRef.current) {
          prevSecondsRef.current = currentSec;
          setSecondsLeft(currentSec);
        }
      },
      {
        now: () => nowRef.current(),
        onComplete: () => {
          latestFrameMsRef.current = 0;
          prevSecondsRef.current = 0;
          setSecondsLeft(0);
          setIsComplete(true);
        },
      },
    );

    return () => {
      cleanupTimer();
    };
  }, [targetTimestampMs]);

  const effectiveSecondsLeft = targetTimestampMs === null ? 0 : secondsLeft;
  const effectiveIsComplete = targetTimestampMs === null ? false : isComplete;
  const formatted = useMemo(
    () => formatDuration(effectiveSecondsLeft),
    [effectiveSecondsLeft],
  );

  return {
    secondsLeft: effectiveSecondsLeft,
    isComplete: effectiveIsComplete,
    formatted,
  };
}
