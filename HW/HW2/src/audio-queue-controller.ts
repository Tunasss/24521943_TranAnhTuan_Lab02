import type { AudioTask } from './audio-types';

/**
 * AudioTaskQueue coordinates asynchronous audio fetching and decoding
 * in strict First-in, First-out (FIFO) order with a concurrency limit of 1.
 */
export class AudioTaskQueue {
  private queue: AudioTask[] = [];
  private isProcessing = false;
  private activeController: AbortController | null = null;
  private audioContext: AudioContext;

  /**
   * Initializes the queue with a shared AudioContext instance via dependency injection.
   *
   * @param audioContext - Shared AudioContext used for decoding audio data
   */
  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Enqueues an audio track URL for processing and returns a Promise that resolves
   * with the decoded AudioBuffer or rejects on error or cancellation.
   *
   * @param trackUrl - The URL of the audio file to fetch and decode
   */
  async enqueue(trackUrl: string): Promise<AudioBuffer> {
    const controller = new AbortController();
    return new Promise<AudioBuffer>((resolve, reject) => {
      this.queue.push({ trackUrl, controller, resolve, reject });
      this.processNext();
    });
  }

  /**
   * Processes the next task in the queue in strict FIFO order.
   * Ensures that only one task is processed at any given time.
   */
  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const task = this.queue.shift();

    if (!task) {
      this.isProcessing = false;
      return;
    }

    this.activeController = task.controller;

    try {
      // Check if task was aborted before processing began
      if (task.controller.signal.aborted) {
        throw new DOMException('The audio task was aborted.', 'AbortError');
      }

      const response = await fetch(task.trackUrl, {
        signal: task.controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audio track: HTTP status ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      // Check if aborted during network download before initiating decoding
      if (task.controller.signal.aborted) {
        throw new DOMException('The audio task was aborted.', 'AbortError');
      }

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      task.resolve(audioBuffer);
    } catch (err: unknown) {
      task.reject(err);
    } finally {
      this.activeController = null;
      this.isProcessing = false;
      this.processNext();
    }
  }

  /**
   * Cancels the currently active task (if any) and all queued tasks,
   * rejecting their promises with an AbortError and clearing the queue.
   */
  public cancelAll(): void {
    if (this.activeController) {
      this.activeController.abort();
      this.activeController = null;
    }

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        task.controller.abort();
        task.reject(new DOMException('The audio task was aborted.', 'AbortError'));
      }
    }
  }

  /**
   * Returns the number of tasks currently waiting in the queue.
   */
  public get pendingCount(): number {
    return this.queue.length;
  }
}
