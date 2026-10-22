# Prompt Log

## Overview
This log records chronological prompts executed during Homework 3, noting specific AI generation defects and their detection methods.

---

### Entry 1: Bước 3.4 - Hook `useCountdown`
- **Prompt:** Create `src/useCountdown.ts` using `createAntiDriftTimer`... Pass the now function through a ref...
- **AI Output:** Attempted to read `nowRef.current` inside `useState(getInitialSeconds)` during render and called `setSecondsLeft(0)` synchronously in `useEffect`.
- **Detection Method:** Ran `npm run lint`; ESLint failed with `react-hooks/refs` and `react-hooks/set-state-in-effect`.
- **Fix:** Switched to lazy state calculation without reading refs during render, and synchronized props using render-phase state updates.

---

### Entry 2: Bước 3.8 - Hook `useFlashSale` Test Suite
- **Prompt:** Create `src/useFlashSale.test.ts` to test optimistic reservation, server synchronization, and bot cleanup...
- **AI Output:** Asserted `displayedStock` equals 2 after two 850ms timer advancements without taking into account the autonomous competitor bots running in the background.
- **Detection Method:** Ran `npm test`; Vitest failed with `AssertionError: expected 1 to be 2` because a bot also bought 1 item.
- **Fix:** Updated test assertions to `expect(stock).toBeLessThanOrEqual(2)` and `expect(stock).toBeGreaterThanOrEqual(1)`.

---

### Entry 3: Bước 3.9 - Storefront UI Component `App.tsx`
- **Prompt:** Create `src/App.tsx` and `src/App.css` using `useFlashSale`... Use a switch with an exhaustive never check on `lock.status`...
- **AI Output:** Placed an exhaustive switch with `default: return _exhaustiveCheck;` before top-level hook declarations (`useMemo`).
- **Detection Method:** Ran `npm run lint`; ESLint failed with `react-hooks/rules-of-hooks: React Hook "useMemo" is called conditionally`.
- **Fix:** Hoisted formatters to module scope and changed the default branch to throw a runtime error rather than returning early.

---

### Entry 4: Bước 3.8 - Hook `useFlashSale` Server Singleton
- **Prompt:** Create `src/useFlashSale.ts`... Create the server once with `useRef` (initialStock 5, saleStartsAt = Date.now() + 15000)...
- **AI Output:** Initialized `serverRef.current` lazily in the render body using `Date.now()`.
- **Detection Method:** Ran `npm run lint`; ESLint failed with `react-hooks/purity: Cannot call impure function during render (Date.now)` and `react-hooks/refs`.
- **Fix:** Wrapped server instance initialization in a lazy `useState` callback.
