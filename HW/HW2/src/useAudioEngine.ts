import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { AudioTaskQueue } from './audio-queue-controller';

export type EngineStatus = 'IDLE' | 'LOADING' | 'PLAYING';

export interface UseAudioEngineResult {
  status: EngineStatus;
  message: string;
  queueLength: number;
  analyser: AnalyserNode | null;
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
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Persistent audio graph references
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const queueRef = useRef<AudioTaskQueue | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Playback buffer queue ensuring tracks play sequentially without cutting each other off
  const playbackQueueRef = useRef<AudioBuffer[]>([]);

  // Ref bridge for recursive callback execution without declaration-order lint errors
  const playNextBufferRef = useRef<() => void>(() => {});

  /**
   * Lazily initializes or resumes the AudioContext upon an explicit user interaction.
   * Adheres strictly to browser Autoplay policies.
   */
  const ensureContext = useCallback(async (): Promise<{
    ctx: AudioContext;
    analyserNode: AnalyserNode;
    queue: AudioTaskQueue;
  }> => {
    if (!audioContextRef.current) {
      const AudioContextConstructor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      const ctx = new AudioContextConstructor();

      const analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.smoothingTimeConstant = 0.8;
      analyserNode.connect(ctx.destination);

      const queue = new AudioTaskQueue(ctx);

      audioContextRef.current = ctx;
      analyserRef.current = analyserNode;
      queueRef.current = queue;
      setAnalyser(analyserNode);
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    return {
      ctx,
      analyserNode: analyserRef.current as AnalyserNode,
      queue: queueRef.current as AudioTaskQueue,
    };
  }, []);

  /**
   * Plays the next AudioBuffer waiting in the sequential playback buffer queue.
   */
  const playNextBuffer = useCallback((): void => {
    if (!audioContextRef.current || !analyserRef.current) {
      return;
    }

    const nextBuffer = playbackQueueRef.current.shift();
    if (!nextBuffer) {
      currentSourceRef.current = null;
      setStatus('IDLE');
      setMessage('All enqueued tracks finished.');
      return;
    }

    const ctx = audioContextRef.current;
    const analyserNode = analyserRef.current;

    const source = ctx.createBufferSource();
    source.buffer = nextBuffer;
    source.connect(analyserNode);

    source.onended = () => {
      try {
        source.disconnect();
      } catch {
        // Ignore disconnection error
      }
      source.onended = null;
      currentSourceRef.current = null;

      // Automatically play next waiting buffer in FIFO order
      playNextBufferRef.current();
    };

    try {
      source.start();
      currentSourceRef.current = source;
      setStatus('PLAYING');
      setMessage('Playing audio track.');
    } catch (err: unknown) {
      setStatus('IDLE');
      setMessage(err instanceof Error ? err.message : 'Failed to start playback');
      playNextBufferRef.current();
    }
  }, []);

  // Update ref bridge inside an effect to adhere to React pure render rules
  useEffect(() => {
    playNextBufferRef.current = playNextBuffer;
  }, [playNextBuffer]);

  /**
   * Stops the currently active AudioBufferSourceNode, empties the playback buffer queue,
   * clears its references, and resets playback status.
   */
  const stop = useCallback((): void => {
    playbackQueueRef.current = [];

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
   * Explicitly plays a single AudioBuffer, replacing any current playback.
   */
  const play = useCallback(
    (buffer: AudioBuffer): void => {
      stop();
      playbackQueueRef.current = [buffer];
      playNextBuffer();
    },
    [stop, playNextBuffer],
  );

  /**
   * Cancels all pending tasks in the queue, aborts active requests,
   * stops playback, and resets queue state.
   */
  const cancelAll = useCallback((): void => {
    playbackQueueRef.current = [];

    if (queueRef.current) {
      queueRef.current.cancelAll();
    }
    stop();
    setQueueLength(0);
    setStatus('IDLE');
    setMessage('Queue cancelled and playback stopped.');
  }, [stop]);

  /**
   * Enqueues an audio URL into the FIFO queue and plays buffers in order.
   * If audio is already playing, waits for the previous track to end.
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

        // Queue buffer for sequential playback
        playbackQueueRef.current.push(buffer);

        // Start playing immediately only if nothing is currently playing
        if (!currentSourceRef.current) {
          playNextBuffer();
        } else {
          setMessage(`Decoded ${url}. Waiting in playback queue.`);
        }

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
    [ensureContext, playNextBuffer],
  );

  /**
   * Comprehensive cleanup on component unmount: cancel queue,
   * stop audio sources, and close the AudioContext safely.
   */
  useEffect(() => {
    return () => {
      playbackQueueRef.current = [];

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
    analyser,
    analyserRef,
    enqueueTrack,
    play,
    stop,
    cancelAll,
  };
}
