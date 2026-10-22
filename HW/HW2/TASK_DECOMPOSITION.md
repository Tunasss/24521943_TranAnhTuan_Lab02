# Work Breakdown Structure: Concurrent FIFO Audio Visualizer Queue Engine

This document provides the Work Breakdown Structure (WBS) for the "Concurrent FIFO Audio Visualizer Queue Engine" project. The application orchestrates audio track playback and real-time frequency spectrum visualization using React, TypeScript, the Web Audio Application Programming Interface (API), the `AnalyserNode` interface, the `AbortController` interface, and HTML5 Canvas.

All deliverables, work packages, and acceptance criteria in this document comply strictly with the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA specification and the architectural rules in [project-rules.md](file:///d:/Study/Web%20Application%20Development/LAB/LAB02/HW/HW2/project-rules.md). The total estimated effort across all nine work packages is exactly 14.0 hours.

---

## 1. Executive Summary and Project Objectives

### 1.1 Project Objective
The objective is to implement a robust audio visualizer engine with deterministic First-in, First-out (FIFO) concurrency, zero audio overlap, memory leak prevention, high-performance canvas spectrum rendering, and complete accessible control for users of assistive technologies.

### 1.2 Structure of Work Packages
The project is organized into nine sequential work packages. Each work package contains discrete tasks, explicit inputs, concrete outputs, measurable acceptance criteria, and precise time estimates.

---

## 2. Work Package 1: Setup and Types

This work package establishes the development workspace, strict TypeScript compiler configuration, and foundational data structures.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP1-T1 | Initialize development environment and configure strict TypeScript compiler options. | Vite React TypeScript template, package dependencies, linting configurations. | Configured repository with `tsconfig.json`, `package.json`, ESLint rules, and build scripts. | Compiler configured with `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, and `noUncheckedIndexedAccess: true`. Clean build with zero diagnostics. | 0.5 |
| WP1-T2 | Define core audio queue data models and visualizer state types. | Specifications defined in `project-rules.md`. | Type definitions file `src/types/audioEngine.ts` exporting `AudioTask`, `AudioTaskStatus`, and `AudioVisualizerState`. | Explicit typing for all queue entities, Promise resolution hooks, and cancellation signals. Zero usage of the `any` keyword. | 0.5 |

**Work Package 1 Subtotal: 1.0 Hour**

---

## 3. Work Package 2: FIFO Queue Core and processNext

This work package implements the deterministic First-in, First-out (FIFO) queue engine and single-worker execution coordinator.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP2-T1 | Implement queue data structure and asynchronous enqueue Promise pipeline. | `AudioTask` definitions, FIFO queue requirements. | Queue class or hook `src/hooks/useAudioQueue.ts` implementing `enqueue`, `cancelTask`, and `clearQueue`. | Calling `enqueue` immediately returns a `Promise<void>` that resolves when playback finishes or rejects with `AbortError` on cancellation. | 1.0 |
| WP2-T2 | Implement processNext worker loop with single-task concurrency gating. | Internal queue buffer, active task pointer. | Internal `processNext` task dispatcher ensuring single worker execution. | Concurrency limit of exactly 1 task is strictly enforced. No task is dropped, lost, or executed twice during queue processing or cancellation. | 1.0 |

**Work Package 2 Subtotal: 2.0 Hours**

---

## 4. Work Package 3: Fetch and Decode with AbortController

This work package builds the network ingestion pipeline, integrating `AbortSignal` for instant cancellation and asynchronous audio buffer decoding.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP3-T1 | Build audio data fetch utility with AbortSignal binding. | Audio track URL, task `AbortController` signal. | Async fetch helper `src/services/audioFetcher.ts` streaming `ArrayBuffer` data. | Network request immediately aborts when `signal.aborted` is triggered, rejecting the fetch with a DOMException named `AbortError`. | 1.0 |
| WP3-T2 | Implement audio buffer decoding pipeline with error handling. | Binary `ArrayBuffer` data, browser `AudioContext` instance. | Asynchronous decoder function utilizing `audioContext.decodeAudioData()`. | Gracefully decodes audio streams into `AudioBuffer` objects. Catches corrupt audio files or aborted decode attempts without uncaught exceptions. | 0.5 |

**Work Package 3 Subtotal: 1.5 Hours**

---

## 5. Work Package 4: Playback and AnalyserNode Wiring

This work package connects the Web Audio API audio graph, enforcing user gesture initialization and real-time frequency node analysis.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP4-T1 | Implement user gesture activation and AudioContext lifecycle manager. | User interaction event stream, browser Autoplay policy rules. | Service `src/services/audioContextManager.ts` managing context lifecycle. | `AudioContext` is only created or resumed upon explicit user interaction (click/keydown). Suspended state is resolved before playback starts. | 1.0 |
| WP4-T2 | Wire AudioBufferSourceNode through AnalyserNode to destination. | Decoded `AudioBuffer`, `AudioContext`, frequency analysis settings. | Audio graph builder connecting `AudioBufferSourceNode -> AnalyserNode -> AudioContext.destination`. | A fresh `AudioBufferSourceNode` is instantiated per playback; `AnalyserNode` configured with `fftSize` of 256 or 512 and smoothing between 0.8 and 0.85. | 0.5 |

**Work Package 4 Subtotal: 1.5 Hours**

---

## 6. Work Package 5: Canvas Visualizer with requestAnimationFrame

This work package creates the high-performance frequency spectrum canvas renderer with reusable typed arrays and 60 frames-per-second animation loops.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP5-T1 | Initialize reusable typed array buffers and frequency extraction pipeline. | Configured `AnalyserNode` instance, canvas dimensions. | Helper hook `src/hooks/useAudioVisualizer.ts` managing frequency data arrays. | A single `Uint8Array` buffer is allocated during initialization and reused across all animation frames without dynamic heap allocations. | 1.0 |
| WP5-T2 | Implement requestAnimationFrame canvas rendering loop with high contrast. | HTML5 Canvas context, frequency byte array, theme tokens. | Canvas visualizer component `src/components/AudioVisualizer/VisualizerCanvas.tsx`. | Spectrum bars render at stable 60 frames-per-second without invoking React state updates inside the frame loop. Spectrum colors achieve at least 3:1 contrast. | 1.0 |

**Work Package 5 Subtotal: 2.0 Hours**

---

## 7. Work Package 6: Memory Cleanup and Leak Verification

This work package ensures all audio resources, animation timers, network connections, and event listeners are thoroughly released.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP6-T1 | Implement teardown routines for audio nodes, animation frames, and contexts. | Active audio graph nodes, animation frame IDs, React unmount hooks. | Teardown methods calling `source.stop()`, `source.disconnect()`, `cancelAnimationFrame()`, and `audioContext.close()`. | All audio sources disconnect and stop cleanly; animation loops terminate immediately on unmount; pending fetches abort with zero detached DOM leaks. | 1.0 |
| WP6-T2 | Execute Google Chrome DevTools memory heap snapshots and leak profiling. | Continuous queue playback script, repeated enqueue and cancel cycles. | Memory audit report in `docs/MEMORY_LEAK_AUDIT.md`. | Heap snapshots show flat memory profile across 20 consecutive track transitions with zero retained `AudioBufferSourceNode` or canvas reference leaks. | 0.5 |

**Work Package 6 Subtotal: 1.5 Hours**

---

## 8. Work Package 7: Accessible UI Controls

This work package implements accessible user interface controls, live status announcements, and visual compliance with WCAG 2.2 Level AA.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP7-T1 | Construct accessible control panel and visible focus styling. | Queue control methods (`enqueue`, `skip`, `clear`), design tokens. | Component `src/components/AudioControls/ControlPanel.tsx` and stylesheet `src/styles/controls.css`. | Native `<button type="button">` elements with minimum 44 by 44 Cascading Style Sheets (CSS) pixel target size; prominent 3:1 contrast focus outlines. | 1.0 |
| WP7-T2 | Implement live region status announcer and reduced motion support. | Queue state transitions, Accessible Rich Internet Applications (ARIA) live region guidelines. | Status component `src/components/AudioControls/QueueStatus.tsx` and motion media queries. | Announces track changes and queue states via `role="status"` and `aria-live="polite"`; honors `@media (prefers-reduced-motion: reduce)` with a static fallback mode. | 0.5 |

**Work Package 7 Subtotal: 1.5 Hours**

---

## 9. Work Package 8: Manual and DevTools Verification

This work package validates queue integrity, audio cancellation, and overall accessibility compliance through automated and manual audits.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP8-T1 | Execute queue concurrency, cancellation, and stress verification tests. | Test track fixtures, simulated network latency, rapid user click sequences. | Integration test suite `src/__tests__/audioQueue.test.ts`. | 100 percent pass rate verifying FIFO ordering, rapid cancellation handling, and zero double execution under high concurrency. | 1.0 |
| WP8-T2 | Execute Google Chrome Lighthouse audit and automated axe accessibility scans. | Production build of application, automated accessibility testing harness. | Audit report `reports/accessibility-audit.json`. | 100 out of 100 score in Accessibility; 100 out of 100 score in Best Practices; zero reported axe-core violations. | 0.5 |

**Work Package 8 Subtotal: 1.5 Hours**

---

## 10. Work Package 9: Documentation and Evidence

This work package compiles comprehensive API usage documentation, architecture notes, and final Definition of Done verification evidence.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP9-T1 | Author architectural documentation and Web Audio queue engineering guide. | Component source files, queue state transition diagrams. | Updated `README.md` and `docs/ARCHITECTURE.md`. | Clear technical explanations covering FIFO queue mechanics, Web Audio graph architecture, typed array reuse, and memory safety rules. | 1.0 |
| WP9-T2 | Assemble verification artifacts, audit logs, and Definition of Done sign-off. | Test logs, Lighthouse scores, memory profiles. | Verification document `docs/ACCEPTANCE_REPORT.md`. | All items in the Definition of Done verified and signed off with supporting evidence and reproduction instructions. | 0.5 |

**Work Package 9 Subtotal: 1.5 Hours**

---

## 11. Project Effort Summary and Allocation

The following table summarizes the distribution of effort across all nine work packages.

| Work Package ID | Work Package Title | Number of Tasks | Total Estimated Effort (Hours) | Percentage of Total Effort |
| :--- | :--- | :--- | :--- | :--- |
| **WP-01** | Setup and Types | 2 | 1.0 | 7.14 % |
| **WP-02** | FIFO Queue Core and processNext | 2 | 2.0 | 14.29 % |
| **WP-03** | Fetch and Decode with AbortController | 2 | 1.5 | 10.71 % |
| **WP-04** | Playback and AnalyserNode Wiring | 2 | 1.5 | 10.71 % |
| **WP-05** | Canvas Visualizer with requestAnimationFrame | 2 | 2.0 | 14.29 % |
| **WP-06** | Memory Cleanup and Leak Verification | 2 | 1.5 | 10.71 % |
| **WP-07** | Accessible UI Controls | 2 | 1.5 | 10.71 % |
| **WP-08** | Manual and DevTools Verification | 2 | 1.5 | 10.71 % |
| **WP-09** | Documentation and Evidence | 2 | 1.5 | 10.71 % |
| **Total** | **All 9 Work Packages Combined** | **18** | **14.0** | **100.00 %** |
