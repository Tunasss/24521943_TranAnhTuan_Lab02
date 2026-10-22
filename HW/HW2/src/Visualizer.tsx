import { useEffect, useRef, type ReactElement } from 'react';

export interface VisualizerProps {
  analyser: AnalyserNode | null;
  active: boolean;
}

/**
 * Visualizer renders a real-time frequency spectrum on an HTML5 Canvas.
 *
 * Performance and accessibility rules:
 * - Operates strictly via requestAnimationFrame with zero React state updates.
 * - Allocates one reusable Uint8Array per connection.
 * - Caps frame rate to at most 10 fps if prefers-reduced-motion is enabled.
 * - Guarantees at least 3:1 contrast for visualizer bars against the canvas background.
 */
export function Visualizer({ analyser, active }: VisualizerProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const width = canvas.width;
    const height = canvas.height;

    // Helper drawing a flat idle baseline when audio is inactive
    const drawIdleState = (): void => {
      // Dark slate background: #0f172a
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Contrast: #64748b against #0f172a provides > 3:1 non-text contrast
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    // When inactive or analyser is not connected, render flat baseline once without looping
    if (!active || !analyser) {
      drawIdleState();
      return;
    }

    // Allocate ONE Uint8Array outside the draw loop
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Detect user reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const minFrameIntervalMs = prefersReducedMotion ? 100 : 0; // At most 10 fps (100ms)

    let lastFrameTimestamp = 0;
    let rafId: number;

    const draw = (timestamp: number): void => {
      rafId = requestAnimationFrame(draw);

      // Throttle rendering to max 10 fps when reduced motion is preferred
      if (minFrameIntervalMs > 0 && timestamp - lastFrameTimestamp < minFrameIntervalMs) {
        return;
      }
      lastFrameTimestamp = timestamp;

      analyser.getByteFrequencyData(dataArray);

      // Clear canvas with dark slate background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * (height - 8);

        // Bar color: Cyan #38bdf8 achieves > 8:1 contrast against #0f172a
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x, height - barHeight, Math.max(1, barWidth - 1), barHeight);

        x += barWidth;
        if (x > width) {
          break;
        }
      }
    };

    // Start 60fps animation loop
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [analyser, active]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Audio frequency visualizer"
      width={640}
      height={200}
      style={{
        width: '100%',
        maxWidth: '640px',
        height: 'auto',
        display: 'block',
        borderRadius: '8px',
        border: '1px solid #334155',
        boxSizing: 'border-box',
        backgroundColor: '#0f172a',
      }}
    >
      Audio frequency visualizer displaying real-time audio spectrum.
    </canvas>
  );
}
