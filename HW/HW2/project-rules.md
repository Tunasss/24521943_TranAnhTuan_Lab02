# Concurrent FIFO Audio Visualizer Queue Engine: AI Assistant Code of Conduct and Project Rules

This document defines the binding engineering standards, architectural constraints, and accessibility requirements for any Artificial Intelligence (AI) assistant contributing to the "Concurrent FIFO Audio Visualizer Queue Engine" project. The application is built with React, TypeScript, the Web Audio Application Programming Interface (API), the `AnalyserNode` interface, the `AbortController` interface, and an HTML5 Canvas frequency visualizer.

All code and documentation produced for this repository must strictly adhere to the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA standard, memory safety invariants, and high-performance Web Audio practices.

---

## 1. Purpose and Scope

### 1.1 Purpose
The purpose of this standard is to guarantee that the concurrent audio visualizer queue engine executes audio playback and visualization tasks with deterministic First-in, First-out (FIFO) concurrency, zero memory leaks, smooth 60 frames-per-second animation performance, and full accessibility for all users including those utilizing assistive technologies.

### 1.2 Scope
This standard governs:
- The FIFO queue management engine and asynchronous task orchestration.
- Web Audio API graph management, buffer decoding, and audio node lifecycle.
- High-frequency canvas rendering loops driven by `requestAnimationFrame`.
- Memory leak prevention, cleanup routines, and garbage collection optimization.
- Accessible user interface (UI) components, focus handling, live region status notifications, and high contrast styling.
- TypeScript typing standards, test verification, and Conventional Commits.

---

## 2. What the AI MUST Do

The AI assistant must strictly follow all mandatory engineering rules defined in the following table.

| ID | Rule | Reason |
| :--- | :--- | :--- |
| MUST-01 | Enforce strict First-in, First-out (FIFO) task sequencing with a concurrency limit of exactly one active task at any moment. | Prevents audio overlap cacophony, race conditions, and uncontrolled hardware audio resource contention. |
| MUST-02 | Return a `Promise` from the `enqueue` operation that resolves on playback completion or rejects with an `AbortError` on cancellation. | Supplies consuming components with standard asynchronous lifecycle hooks to track audio completion or handle cancellations cleanly. |
| MUST-03 | Initialize or resume the browser `AudioContext` solely in response to an explicit user activation gesture (such as a button click). | Complies with modern browser Autoplay policies and prevents silent playback blocking or console security warnings. |
| MUST-04 | Instantiate a new `AudioBufferSourceNode` for every audio playback task. | The Web Audio API specifies that an `AudioBufferSourceNode` is single-use and cannot be restarted once stopped. |
| MUST-05 | Release and clean up all resources (call `source.stop()`, `source.disconnect()`, `cancelAnimationFrame()`, `audioContext.close()`, and `controller.abort()`) upon task end and component unmount. | Eliminates lingering audio threads, visualizer render leaks, background network consumption, and orphaned audio nodes. |
| MUST-06 | Execute visualizer rendering exclusively via `requestAnimationFrame` without triggering React state updates per frame. | Avoids redundant React reconciliation cycles and garbage collection spikes, ensuring stable 60 frames-per-second rendering. |
| MUST-07 | Allocate typed arrays (`Uint8Array` or `Float32Array`) once during initialization and reuse them across animation frames. | Avoids allocating new memory blocks inside high-frequency render loops, preventing memory churn and frame drops. |
| MUST-08 | Provide an accessible text alternative and live region status updates (`role="status"`, `aria-live="polite"`) for the visualizer. | Delivers equivalent non-visual feedback regarding track names, playback duration, and queue progress for screen reader users. |
| MUST-09 | Provide visible focus indicators with at least 3:1 contrast and ensure interactive buttons meet at least 44 by 44 Cascading Style Sheets (CSS) pixels. | Meets WCAG 2.2 Success Criterion 2.4.7 (Focus Visible) and Success Criterion 2.5.8 (Target Size Minimum). |
| MUST-10 | Support reduced motion preferences via `@media (prefers-reduced-motion: reduce)` and provide a UI toggle to pause canvas animations. | Protects users with vestibular motion disorders from nausea, dizziness, or disorientation triggered by rapid visual pulsation. |
| MUST-11 | Maintain strict TypeScript typing with zero usage of `any` and explicitly define all properties of the `AudioTask` model. | Ensures end-to-end type safety, reliable refactoring, compile-time contract enforcement, and runtime robustness. |
| MUST-12 | Author atomic Git commits formatted according to the Conventional Commits 1.0.0 specification. | Maintains an auditable, machine-readable version control history with clear rationale. |

---

## 3. What the AI MUST NOT Do

The AI assistant must strictly avoid all prohibited practices defined in the following table.

| ID | Rule | Reason |
| :--- | :--- | :--- |
| MUSTNOT-01 | Do not allow multiple audio tasks to execute or play concurrently from the queue. | Violates the single-worker concurrency contract, causes overlapping acoustic artifacts, and overloads the audio visualizer. |
| MUSTNOT-02 | Do not lose queued tasks or allow any task to execute twice during normal queue draining or cancellation cycles. | Leads to unpredictable playback state, queue corruption, and unfulfilled asynchronous task promises. |
| MUSTNOT-03 | Do not auto-initialize or resume an `AudioContext` during module load or component initial render without user interaction. | Triggers browser autoplay policy violations, resulting in suspended audio contexts and unhandled rejection errors. |
| MUSTNOT-04 | Do not attempt to call `.start()` multiple times on the same `AudioBufferSourceNode` instance. | Violates the Web Audio API specification and triggers an `InvalidStateError` runtime DOM exception. |
| MUSTNOT-05 | Do not update React component state (`useState` or `useReducer`) inside a `requestAnimationFrame` render loop. | Induces continuous component re-renders (up to 60 or 120 times per second), crashing browser performance and causing severe frame lag. |
| MUSTNOT-06 | Do not allocate new buffers, objects, or typed arrays inside the animation draw function. | Triggers excessive memory allocations, frequent garbage collection pauses, and perceptible animation stutter. |
| MUSTNOT-07 | Do not leave background fetch requests or animation frame callbacks active when a task is cancelled or a component unmounts. | Leads to memory leaks, network bandwidth waste, and runtime attempts to update unmounted component references. |
| MUSTNOT-08 | Do not convey queue status, playback state, or error conditions solely through color, shape, or canvas graphics. | Violates WCAG 2.2 Success Criterion 1.4.1 (Use of Color), leaving status inaccessible to color-blind and screen reader users. |
| MUSTNOT-09 | Do not use the `any` keyword or unsafe type assertions (`as unknown as Type`). | Eliminates TypeScript type safety guarantees, masking potential runtime errors in audio task pipeline management. |
| MUSTNOT-10 | Do not leave keyboard focus trapped or obscure focus rings with `outline: none` without providing accessible alternatives. | Violates WCAG 2.2 Success Criterion 2.1.2 (No Keyboard Trap) and Success Criterion 2.4.7 (Focus Visible). |

---

## 4. Queue Rules

The task queue acts as the deterministic concurrency backbone of the application.

### 4.1 Strict FIFO Ordering
- Tasks must be processed in the exact order they were enqueued (First-in, First-out).
- At any point in time, exactly one audio task may be in the `processing` state. Subsequent tasks must remain in the `pending` queue until the active task completes or is aborted.

### 4.2 Asynchronous Lifecycle and Promises
- Calling `enqueue(taskDef)` must immediately return a `Promise<void>`.
- The returned Promise must resolve when audio playback of the task finishes naturally.
- The returned Promise must reject with an `AbortError` (`DOMException` named `"AbortError"`) if the task is explicitly cancelled or cleared before or during playback.

### 4.3 Task Integrity and Cancellation
- No task may be lost, dropped silently, or executed more than once.
- Cancelling an active task must trigger its associated `AbortController.abort()`, stop the current audio source immediately, and proceed to the next pending task in the queue.
- Clearing the entire queue must cancel all pending tasks, reject their corresponding Promises with `AbortError`, and immediately silence any active playback.

---

## 5. Web Audio Rules

All audio processing must adhere to the W3C Web Audio API specification.

### 5.1 User Gesture Requirement
- The primary `AudioContext` must only be instantiated or resumed following a direct user gesture (such as clicking a "Play", "Enqueue", or "Enable Audio" button).
- If the `AudioContext` state is `"suspended"`, calling `.resume()` must be awaited before initiating playback.

### 5.2 AnalyserNode Configuration
- An `AnalyserNode` must be connected between the audio source and the destination (`AudioBufferSourceNode -> AnalyserNode -> AudioContext.destination`).
- The `fftSize` (Fast Fourier Transform size) property of the `AnalyserNode` must be configured to either `256` (yielding 128 frequency bins) or `512` (yielding 256 frequency bins).
- The `smoothingTimeConstant` property should be set between `0.8` and `0.85` for smooth visual transitions.

### 5.3 Audio Decoding and Source Lifecycles
- Audio data must be fetched as an `ArrayBuffer` and decoded asynchronously using `audioContext.decodeAudioData()`.
- Every playback requires creating a fresh `AudioBufferSourceNode` via `audioContext.createBufferSource()`.
- Once an `AudioBufferSourceNode` has completed or stopped, it must be disconnected and discarded. It must never be reused.

---

## 6. Memory Safety Rules

Memory leaks in continuous media applications degrade system responsiveness and cause browser tab crashes. Strict resource cleanup is mandatory.

### 6.1 Audio Node Disconnection
- When an audio task stops, finishes, or is aborted, the active `AudioBufferSourceNode` must have its `.stop()` method called (if currently playing) and its `.disconnect()` method invoked.
- The `onended` event listener on the source node must be cleared (`source.onended = null`) to break circular references.

### 6.2 Context Teardown on Component Unmount
- When the hosting React component unmounts, the `AudioContext` must be cleanly closed by invoking `audioContext.close()`.
- Any active `requestAnimationFrame` loop must be cancelled using `cancelAnimationFrame(animationFrameId)`.

### 6.3 Network and Event Cleanup
- All pending audio file downloads must receive an `AbortSignal` from an `AbortController`. When unmounting or aborting, `abortController.abort()` must be called immediately.
- Window and DOM event listeners (such as resize listeners or user gesture handlers) must be removed in the React cleanup return function of `useEffect`.

---

## 7. Performance Rules

The visualizer must maintain a consistent 60 frames-per-second refresh rate without impacting main thread interactivity.

### 7.1 Animation Loop Mechanics
- The canvas visualizer loop must be driven solely by `requestAnimationFrame`.
- Never use `setInterval` or `setTimeout` for rendering audio visualizer frames.

### 7.2 Zero React State Updates per Frame
- React state setters (`setState`, `dispatch`) must never be called inside the `requestAnimationFrame` callback.
- React state should only be updated for discrete lifecycle events (for example: task queued, playback started, playback finished, queue cleared).

### 7.3 Reusable Typed Arrays
- The frequency data buffer (`Uint8Array` for `getByteFrequencyData` or `Float32Array` for `getFloatFrequencyData`) must be allocated once when the `AnalyserNode` is configured.
- The same typed array instance must be passed into `analyserNode.getByteFrequencyData(frequencyDataArray)` on every frame, eliminating dynamic heap allocations.

---

## 8. Accessibility Rules

The application must comply fully with WCAG 2.2 Level AA requirements.

### 8.1 Text Alternatives for Canvas
- The HTML5 `<canvas>` element must include accessible fallback text inside the canvas tags (for example, `<canvas>Real-time frequency visualizer for active audio track</canvas>`).
- Provide an `aria-label` or `aria-labelledby` attribute on the canvas describing its role and the currently active track.

### 8.2 Semantic Controls and Focus Management
- All interactive controls (Play, Pause, Skip, Cancel, Clear Queue, Enqueue) must be native `<button type="button">` elements.
- Every interactive element must display a distinct visible focus indicator (minimum 2 CSS pixels solid outline with at least 3:1 contrast against adjacent backgrounds).
- Minimum target size must be at least 44 by 44 CSS pixels (exceeding the WCAG 2.2 Level AA 24 by 24 pixel minimum).

### 8.3 Screen Reader Status Announcements
- Queue updates, current track titles, playback completions, and cancellation notices must be announced via an accessible live region (`role="status"`, `aria-live="polite"`, `aria-atomic="true"`).
- Status changes must not shift keyboard focus unexpectedly.

### 8.4 Contrast and Reduced Motion
- Text content must maintain a contrast ratio of at least 4.5:1 against its background.
- UI components, button borders, and visualizer graph bars must achieve at least 3:1 contrast against adjacent surfaces.
- Honor user preferences for reduced motion via `@media (prefers-reduced-motion: reduce)` by providing a static fallback view or an accessible pause toggle for visual animations.

---

## 9. TypeScript Rules

All source code must be written in strict, modern TypeScript with zero type ambiguities.

### 9.1 Explicit AudioTask Contract
The core task interface must be explicitly typed without using `any`. AI assistants must adhere to the following contract definition:

```typescript
export type AudioTaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'aborted';

export interface AudioTask {
  id: string;
  title: string;
  url: string;
  duration?: number;
  status: AudioTaskStatus;
  abortController: AbortController;
  resolve: () => void;
  reject: (reason: DOMException | Error) => void;
}

export interface AudioVisualizerState {
  currentTask: AudioTask | null;
  queue: AudioTask[];
  isPlaying: boolean;
  isAudioContextReady: boolean;
  volume: number;
}
```

### 9.2 Strict Compiler Configuration
- The project must compile with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, and `"noUncheckedIndexedAccess": true`.
- Type narrowing must be performed using explicit type guards rather than unsafe type casting (`as unknown as Type`).

---

## 10. Git Rules

The AI assistant must produce clean, traceable, and standardized Git commits.

### 10.1 Conventional Commits Specification
All commit messages must follow the Conventional Commits 1.0.0 format:
```text
<type>(<scope>): <short description in imperative present tense>

[optional body explaining motivation, technical rationale, and cleanup mechanics]

[optional footer referencing issue IDs or pull requests]
```

Allowed commit types:
- `feat`: A new feature (for example, FIFO queue management, canvas spectrum visualization).
- `fix`: A bug fix, cancellation correction, or memory leak resolution.
- `docs`: Documentation updates or code of conduct revisions.
- `style`: Formatting and CSS visual enhancements adhering to contrast rules.
- `refactor`: Code improvements that do not alter external behavior.
- `test`: Unit, integration, or leak verification tests.
- `chore`: Tooling, dependency, or configuration updates.

### 10.2 Small, Atomic Commits
- Keep commits small, isolated, and focused on a single responsibility.
- Every commit must compile cleanly with zero TypeScript errors and pass all tests.

---

## 11. Definition of Done

A task or pull request is complete ("Done") only when all items in the following checklist have been validated and documented:

### 11.1 Release Verification Checklist
- [ ] **Queue Concurrency**: FIFO ordering is strictly preserved with exactly one active task at a time; `enqueue` returns a Promise resolving on completion or rejecting on abort.
- [ ] **Web Audio Compliance**: `AudioContext` is only initialized/resumed upon user gesture; fresh `AudioBufferSourceNode` created per playback; `AnalyserNode` configured with `fftSize` 256 or 512.
- [ ] **Memory Safety**: All audio nodes stopped and disconnected; `AudioContext` closed on unmount; animation frames cancelled; fetch requests aborted; zero memory leaks detected in DevTools.
- [ ] **Performance Stability**: Canvas rendered via `requestAnimationFrame` with zero React state updates per frame; typed arrays allocated once and reused.
- [ ] **Accessibility (WCAG 2.2 AA)**: Canvas includes text alternative; controls are native buttons; 44 by 44 pixel targets; visible focus indicators; live region announcements; reduced motion honored.
- [ ] **TypeScript Rigor**: Strict compilation with zero errors and zero instances of `any`.
- [ ] **Git Cleanliness**: Commits follow Conventional Commits 1.0.0 and encapsulate small, atomic changes.
