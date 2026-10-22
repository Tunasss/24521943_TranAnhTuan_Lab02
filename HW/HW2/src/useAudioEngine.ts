import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { AudioTaskQueue } from './audio-queue-controller';

export type EngineStatus = 'IDLE' | 'LOADING' | 'PLAYING';

export interface UseAudioEngineResult {
  status: EngineStatus;
  message: string;
  queueLength: number;
  analyserRef: RefObject<AnalyserNode | null>;
  enqueueTrack: (url: string) => Promise<AudioBuffer | void>;
  play: (buffer: AudioBuffer) => void;
  stop: () => void;
  cancelAll: () => void;
}

/**
 * Custom React hook managing the Web Audio API context, AnalyserNode,
 * FIFO AudioTaskQueue, and single-source playback lifecycle.
 *
 * Invariant: Never updates React state inside animation or per-frame callbacks.
 */
export function useAudioEngine(): UseAudioEngineResult {
  // Coarse UI states for accessibility and display
  const [status, setStatus] = useState<EngineStatus>('IDLE');
  const [message, setMessage] = useState<string>('Ready');
  const [queueLength, setQueueLength] = useState<number>(0);

  // Persistent audio graph references
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const queueRef = useRef<AudioTaskQueue | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  /**
   * Lazily initializes or resumes the AudioContext upon an explicit user interaction.
   * Adheres strictly to browser Autoplay policies.
   */
  const ensureContext = useCallback(async (): Promise<{
    ctx: AudioContext;
    analyser: AnalyserNode;
    queue: AudioTaskQueue;
  }> => {
    if (!audioContextRef.current) {
      const AudioContextConstructor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      const ctx = new AudioContextConstructor();

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyser.connect(ctx.destination);

      const queue = new AudioTaskQueue(ctx);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      queueRef.current = queue;
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    return {
      ctx,
      analyser: analyserRef.current as AnalyserNode,
      queue: queueRef.current as AudioTaskQueue,
    };
  }, []);

  /**
   * Stops the currently active AudioBufferSourceNode, disconnects it,
   * clears its references, and resets playback status.
   */
  const stop = useCallback((): void => {
    if (currentSourceRef.current) {
      const source = currentSourceRef.current;
      source.onended = null;

      try {
        source.stop();
      } catch {
        // Ignore errors if the source was never started or already stopped
      }

      try {
        source.disconnect();
      } catch {
        // Ignore errors if already disconnected
      }

      currentSourceRef.current = null;
    }

    setStatus('IDLE');
    setMessage('Playback stopped.');
  }, []);

  /**
   * Plays a decoded AudioBuffer by instantiating a new AudioBufferSourceNode,
   * routing it through the AnalyserNode, and managing its completion event.
   */
  const play = useCallback(
    (buffer: AudioBuffer): void => {
      if (!audioContextRef.current || !analyserRef.current) {
        return;
      }

      const ctx = audioContextRef.current;
      const analyser = analyserRef.current;

      // Stop any existing playback first
      stop();

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(analyser);

      source.onended = () => {
        try {
          source.disconnect();
        } catch {
          // Ignore disconnection error
        }
        source.onended = null;

        if (currentSourceRef.current === source) {
          currentSourceRef.current = null;
          setStatus('IDLE');
          setMessage('Playback finished.');
        }
      };

      try {
        source.start();
        currentSourceRef.current = source;
        setStatus('PLAYING');
        setMessage('Playing audio track.');
      } catch (err: unknown) {
        setStatus('IDLE');
        setMessage(err instanceof Error ? err.message : 'Failed to start playback');
      }
    },
    [stop],
  );

  /**
   * Cancels all pending tasks in the queue, aborts active requests,
   * stops playback, and resets queue state.
   */
  const cancelAll = useCallback((): void => {
    if (queueRef.current) {
      queueRef.current.cancelAll();
    }
    stop();
    setQueueLength(0);
    setStatus('IDLE');
    setMessage('Queue cancelled and playback stopped.');
  }, [stop]);

  /**
   * Enqueues an audio URL into the FIFO queue and automatically plays
   * the decoded buffer upon completion.
   */
  const enqueueTrack = useCallback(
    async (url: string): Promise<AudioBuffer | void> => {
      try {
        const { queue } = await ensureContext();
        setQueueLength(queue.pendingCount + 1);
        setStatus((prev) => (prev === 'IDLE' ? 'LOADING' : prev));
        setMessage(`Enqueued track: ${url}`);

        const buffer = await queue.enqueue(url);
        setQueueLength(queue.pendingCount);
        play(buffer);
        return buffer;
      } catch (err: unknown) {
        if (queueRef.current) {
          setQueueLength(queueRef.current.pendingCount);
        }

        // Suppress error messages for deliberate abort cancellations
        const isAbortError =
          (err instanceof DOMException && err.name === 'AbortError') ||
          (err instanceof Error && err.name === 'AbortError');

        if (!isAbortError) {
          setStatus('IDLE');
          setMessage(err instanceof Error ? err.message : 'Error loading audio track');
        }
      }
    },
    [ensureContext, play],
  );

  /**
   * Comprehensive cleanup on component unmount: cancel queue,
   * stop audio sources, and close the AudioContext safely.
   */
  useEffect(() => {
    return () => {
      if (queueRef.current) {
        queueRef.current.cancelAll();
      }

      if (currentSourceRef.current) {
        const source = currentSourceRef.current;
        source.onended = null;

        try {
          source.stop();
        } catch {
          // Ignored
        }

        try {
          source.disconnect();
        } catch {
          // Ignored
        }

        currentSourceRef.current = null;
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        void audioContextRef.current.close();
      }
    };
  }, []);

  return {
    status,
    message,
    queueLength,
    analyserRef,
    enqueueTrack,
    play,
    stop,
    cancelAll,
  };
}
