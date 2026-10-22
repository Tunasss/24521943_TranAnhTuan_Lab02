# AI Failure Audit

## 1. Purpose
This report documents real failures, defects, and code generation mistakes produced by Artificial Intelligence (AI) coding assistants during the development of Homework 3 (HW3): "High-Concurrency Flash-Sale E-Commerce Engine". Each incident records the prompt context, the defective code generated, the root cause analysis, the detection methodology, and the verified remediation.

---

## 2. Summary of Failures

| ID | Area | Severity | Detected By | Root Cause | Fix Description |
|:---|:-----|:---------|:------------|:-----------|:----------------|
| F1 | React 19 Ref & State Lifecycle | High | ESLint (`react-hooks/refs`, `react-hooks/set-state-in-effect`) | Reading `nowRef.current` during component render and calling `setState` synchronously within `useEffect` | Derived initial state with static fallback and moved prop synchronization to render phase |
| F2 | Concurrency & Background Timers | Medium | Vitest Integration Test | Test advanced timers across the bot purchase window without accounting for autonomous competitor buyers | Adjusted assertions to accommodate concurrent bot purchases in parallel with user reservations |
| F3 | React Hook Execution Order | High | ESLint (`react-hooks/rules-of-hooks`) | Exhaustive `never` check returned early from the component body before subsequent hook calls | Replaced early return with an unhandled state throw and moved static formatters to module scope |
| F4 | Component Purity & Lazy Ref Initialization | High | ESLint (`react-hooks/purity`, `react-hooks/refs`) | Evaluating `Date.now()` and assigning `serverRef.current` inside the render body | Migrated server singleton to `useState` lazy initializer function |

---

## 3. Detailed Findings

### F1. Ref Access During Render and Cascading State Updates in `useCountdown`
- **Prompt used:** "Create `src/useCountdown.ts`, a React hook using `createAntiDriftTimer` from `./anti-drift-timer`... Pass the now function through a ref so that changing it does not restart the timer."
- **What the AI produced:**
  The AI initialized state by accessing `nowRef.current()` inside the initial state factory:
  ```ts
  const nowRef = useRef<() => number>(now ?? Date.now);
  const getInitialSeconds = (): number => {
    const currentNow = nowRef.current(); // Accessing ref during render
    return Math.ceil(Math.max(0, targetTimestampMs - currentNow) / 1000);
  };
  const [secondsLeft, setSecondsLeft] = useState<number>(getInitialSeconds);
  ```
  Furthermore, when `targetTimestampMs === null`, the AI invoked `setSecondsLeft(0)` synchronously inside the effect body:
  ```ts
  useEffect(() => {
    if (targetTimestampMs === null) {
      setSecondsLeft(0); // Synchronous setState in effect
      setIsComplete(false);
      return;
    }
    // ...
  }, [targetTimestampMs]);
  ```
- **Why it is wrong:**
  1. In React 19, reading `ref.current` during the render phase causes nondeterministic rendering behavior and breaks the React Compiler optimization invariants.
  2. Calling `setState` synchronously within an effect body causes cascading renders and potential layout thrashing.
- **How I detected it:** ESLint flagged 3 errors during `npm run lint`:
  `Error: Cannot access refs during render (react-hooks/refs)` and `Error: Calling setState synchronously within an effect can trigger cascading renders (react-hooks/set-state-in-effect)`.
- **Evidence:**
  - File: [`src/useCountdown.ts`](file:///d:/Study/Web%20Application%20Development/LAB/LAB02/HW/HW3/src/useCountdown.ts)
  - Commit hash: `d516fe0`
- **Fix:**
  1. Passed `now ?? Date.now` directly into the `useState` initializer without reading `nowRef.current`.
  2. Implemented the standard React pattern for syncing state when props change during render using `prevTarget` tracking:
  ```ts
  if (prevTarget !== targetTimestampMs) {
    setPrevTarget(targetTimestampMs);
    const clock = now ?? Date.now;
    const initialSec = targetTimestampMs === null ? 0 : Math.max(0, Math.ceil((targetTimestampMs - clock()) / 1000));
    setSecondsLeft(initialSec);
    setIsComplete(false);
  }
  ```
- **Lesson learned:** Never read or assign `ref.current` during the component render phase. For prop-synchronized state, adjust state during render rather than firing synchronous updates inside effects.

---

### F2. Test Assertion Divergence Caused by Background Bot Purchases
- **Prompt used:** "Create `src/useFlashSale.ts`... and test it using Vitest."
- **What the AI produced:**
  The AI wrote an integration test in `src/useFlashSale.test.ts` asserting that after the user successfully reserved an item, the displayed stock would equal exactly 2:
  ```ts
  await act(async () => {
    await vi.advanceTimersByTimeAsync(850);
    await reservePromise;
  });
  expect(result.current.state.lock.status).toBe('RESERVED');
  expect(result.current.state.displayedStock).toBe(2);
  ```
- **Why it is wrong:**
  When `useFlashSale` mounts, it starts simulated competitor bots via `server.startBots()`. These bots autonomously purchase one item every 800ms to 2000ms. Because the test advanced timers by 850ms for snapshot calibration plus another 850ms for reservation resolution (total 1700ms), a bot ran concurrently and purchased 1 item. Consequently, the actual server stock was decremented from 3 to 1 (1 unit by the user + 1 unit by the bot), causing the assertion `expect(1).toBe(2)` to fail.
- **How I detected it:** Running `npm test` triggered Vitest failure:
  `AssertionError: expected 1 to be 2 // Object.is equality (- 2, + 1)`.
- **Evidence:**
  - File: [`src/useFlashSale.test.ts`](file:///d:/Study/Web%20Application%20Development/LAB/LAB02/HW/HW3/src/useFlashSale.test.ts)
  - Commit hash: `f21f4a9`
- **Fix:**
  Updated test assertions to account for concurrent competitor bot buyers:
  ```ts
  expect(result.current.state.displayedStock).toBeLessThanOrEqual(2);
  expect(result.current.state.displayedStock).toBeGreaterThanOrEqual(1);
  ```
- **Lesson learned:** When testing systems with background autonomous actors (such as traffic bots), timer advancement must account for all concurrent processes running in the simulated environment.

---

### F3. Conditional Hook Execution via Early Return in Exhaustive Pattern Matching
- **Prompt used:** "Create `src/App.tsx` and `src/App.css` using `useFlashSale`... Use a switch with an exhaustive never check on `lock.status`."
- **What the AI produced:**
  The AI placed the exhaustive `switch` block for screen reader announcements directly inside the main `App` component body and included an early return in the `default` branch:
  ```tsx
  export default function App() {
    // ...
    switch (state.lock.status) {
      // cases...
      default: {
        const _exhaustiveCheck: never = state.lock;
        return _exhaustiveCheck; // Early return before subsequent hooks!
      }
    }

    const formattedPrice = useMemo(() => vndFormatter.format(FLASH_SALE_PRODUCT.priceVnd), []);
    // ...
  }
  ```
- **Why it is wrong:**
  Placing a `return` statement before other React Hook calls (`useMemo`) violates the First Rule of Hooks ("Only Call Hooks at the Top Level"). If the component ever encountered an unrecognized state, it would return before calling `useMemo`, causing React's internal fiber hook linked list to desynchronize between renders.
- **How I detected it:** ESLint reported 2 errors during `npm run lint`:
  `Error: React Hook "useMemo" is called conditionally. React Hooks must be called in the exact same order in every component render (react-hooks/rules-of-hooks)`.
- **Evidence:**
  - File: [`src/App.tsx`](file:///d:/Study/Web%20Application%20Development/LAB/LAB02/HW/HW3/src/App.tsx)
  - Commit hash: `c18fcd4`
- **Fix:**
  1. Hoisted static formatters (`formattedPrice`, `formattedOriginalPrice`) outside the component entirely to module scope.
  2. Changed the `default` branch of the internal exhaustive switch to throw a runtime error rather than returning:
  ```tsx
  default: {
    const _exhaustiveCheck: never = state.lock;
    throw new Error(`Unhandled lock status: ${_exhaustiveCheck}`);
  }
  ```
- **Lesson learned:** Never return early from a React functional component before all top-level hook declarations. For exhaustive pattern matching inside component bodies, throw an error on illegal states rather than returning early.

---

### F4. Impure Date Evaluation and Ref Assignment in Render Body
- **Prompt used:** "Create `src/useFlashSale.ts`... Create the server once with `useRef` (initialStock 5, saleStartsAt = Date.now() + 15000, reservationTtlMs 60000, extensionMs 30000) and start the bots."
- **What the AI produced:**
  The AI attempted to initialize `serverRef` lazily inside the component render body:
  ```ts
  const serverRef = useRef<FlashSaleServer | null>(null);
  if (!serverRef.current) {
    serverRef.current = new FlashSaleServer({
      initialStock: 5,
      saleStartsAt: Date.now() + 15_000, // Calling Date.now during render
      reservationTtlMs: 60_000,
      extensionMs: 30_000,
    });
  }
  const server = serverRef.current; // Reading ref during render
  ```
- **Why it is wrong:**
  1. `Date.now()` is an impure function; calling it during render violates React's idempotency requirement (`react-hooks/purity`).
  2. Reading and mutating `ref.current` during render is strictly forbidden under React 19 compiler rules (`react-hooks/refs`).
- **How I detected it:** `npm run lint` flagged:
  `Error: Cannot call impure function during render (react-hooks/purity)` and `Error: Cannot access refs during render (react-hooks/refs)`.
- **Evidence:**
  - File: [`src/useFlashSale.ts`](file:///d:/Study/Web%20Application%20Development/LAB/LAB02/HW/HW3/src/useFlashSale.ts)
  - Commit hash: `f21f4a9`
- **Fix:**
  Converted the singleton initialization to a lazy `useState` factory function, which is guaranteed by React to execute strictly once on initial mount and safely allows impure clock evaluation:
  ```ts
  const [defaultServer] = useState<FlashSaleServer>(() => {
    return customServer ?? new FlashSaleServer({
      initialStock: 5,
      saleStartsAt: Date.now() + 15_000,
      reservationTtlMs: 60_000,
      extensionMs: 30_000,
    });
  });
  const serverRef = useRef<FlashSaleServer>(defaultServer);
  ```
- **Lesson learned:** Use `useState(() => new Service())` when initializing complex singletons that require clock timestamps or side effects, rather than initializing refs inside the render body.

---

## 4. Supplementary Observations From Earlier Labs

These observations document authentic issues encountered across preceding laboratory exercises and are recorded for historical completeness:

1. **TypeScript 5.8 `erasableSyntaxOnly` Constructor Parameter Properties (HW2)**:
   - *Problem:* In `src/audio-queue-controller.ts`, the AI initially declared `constructor(private queue: AudioTask[])`.
   - *Result:* TypeScript 5.8 threw error `TS1294: Parameter properties are not supported with erasable syntax`.
   - *Resolution:* Declared class fields explicitly at the top of the class body and assigned them inside standard constructor bodies.

2. **Web Audio API `AudioBufferSourceNode.stop()` Exception on Unstarted Nodes (HW2)**:
   - *Problem:* The AI called `source.stop()` without checking whether the audio buffer source node had been started.
   - *Result:* The browser threw an `InvalidStateError` DOMException: "Cannot stop a source that has not been started".
   - *Resolution:* Wrapped `source.stop()` inside a `try / catch` block and decoupled active source references.

3. **React 19 `JSX.Element` Global Type Deprecation (HW1)**:
   - *Problem:* The AI typed custom table renderers as `JSX.Element`.
   - *Result:* React 19 deprecated the global `JSX` namespace, requiring `React.ReactNode` or `React.JSX.Element`.
   - *Resolution:* Replaced all instances of `JSX.Element` with `React.ReactNode`.
