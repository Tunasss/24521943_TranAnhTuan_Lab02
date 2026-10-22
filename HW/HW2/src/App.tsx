import type { ReactElement } from 'react';
import { useAudioEngine } from './useAudioEngine';
import { Visualizer } from './Visualizer';
import './App.css';

/**
 * Main application demonstrating the Concurrent FIFO Audio Visualizer Queue Engine.
 * Adheres strictly to WCAG 2.2 Level AA accessibility and semantic HTML rules.
 */
function App(): ReactElement {
  const {
    status,
    message,
    queueLength,
    analyser,
    enqueueTrack,
    stop,
    cancelAll,
  } = useAudioEngine();

  /**
   * Enqueues all three audio tracks simultaneously without sequential awaiting,
   * testing true concurrent FIFO queue orchestration.
   */
  const handleAddAllSimultaneous = (): void => {
    void Promise.allSettled([
      enqueueTrack('/audio/track1.mp3'),
      enqueueTrack('/audio/track2.mp3'),
      enqueueTrack('/audio/track3.mp3'),
    ]);
  };

  return (
    <main className="app-container">
      <h1>Concurrent FIFO Audio Visualizer Queue Engine</h1>

      <p className="user-gesture-notice">
        Note: AudioContext initialisation and playback begin only after your first click interaction.
      </p>

      <section aria-label="Track queue" className="queue-controls-section">
        <div className="button-toolbar">
          <button
            type="button"
            className="control-button"
            onClick={() => void enqueueTrack('/audio/track1.mp3')}
          >
            Add track 1 to queue
          </button>
          <button
            type="button"
            className="control-button"
            onClick={() => void enqueueTrack('/audio/track2.mp3')}
          >
            Add track 2 to queue
          </button>
          <button
            type="button"
            className="control-button"
            onClick={() => void enqueueTrack('/audio/track3.mp3')}
          >
            Add track 3 to queue
          </button>
          <button
            type="button"
            className="control-button control-button-accent"
            onClick={handleAddAllSimultaneous}
          >
            Add all tracks (simultaneous)
          </button>
          <button
            type="button"
            className="control-button control-button-secondary"
            onClick={stop}
          >
            Stop
          </button>
          <button
            type="button"
            className="control-button control-button-danger"
            onClick={cancelAll}
          >
            Cancel all
          </button>
        </div>
      </section>

      <p role="status" aria-live="polite" className="queue-status-banner">
        <span className="status-badge">Status: {status}</span>
        <span className="queue-badge">Queue length: {queueLength}</span>
        <span className="message-text">{message}</span>
      </p>

      <section aria-label="Audio Visualizer Display" className="visualizer-display-section">
        <Visualizer analyser={analyser} active={status === 'PLAYING'} />
      </section>
    </main>
  );
}

export default App;
