/**
 * AudioTask represents an individual audio fetching and decoding operation
 * managed by the concurrent FIFO queue.
 */
export interface AudioTask {
  trackUrl: string;
  controller: AbortController;
  resolve: (buffer: AudioBuffer) => void;
  reject: (reason: unknown) => void;
}

/**
 * QueueStatus indicates the operational state of the FIFO queue worker.
 */
export type QueueStatus = 'IDLE' | 'PROCESSING';
