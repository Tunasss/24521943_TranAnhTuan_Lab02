# High-Concurrency Flash-Sale E-Commerce Engine: AI Assistant Code of Conduct and Project Rules

This document establishes the binding code of conduct, architectural invariants, and accessibility standards for any Artificial Intelligence (AI) assistant contributing to the "High-Concurrency Flash-Sale E-Commerce Engine" project. The application simulates a high-traffic e-commerce flash-sale scenario in Vietnam (such as an 11.11 Singles' Day or Midnight Mega-Sale) using React, TypeScript, an anti-drift countdown timer, and an optimistic inventory lock state machine.

All code and documentation produced for this repository must strictly adhere to the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA standard, resilient state machine principles, and strict concurrency safety.

---

## 1. Purpose and Scope

### 1.1 Purpose
The purpose of this standard is to guarantee that the flash-sale e-commerce engine delivers a rock-solid, race-condition-free shopping experience. The system must prevent inventory over-selling, maintain clock synchronization under background tab throttling, roll back rejected reservations instantaneously, adhere to internationalization standards, and provide accessible timing controls for all users.

### 1.2 Scope
This standard governs:
- The anti-drift countdown timer and document visibility synchronization.
- The finite state machine and pure reducer governing inventory reservation.
- The mock flash-sale server simulating network latency, dropped requests, and inventory locks.
- Optimistic UI updates, server reconciliations, stale response discarding, and reservation expiry.
- Vietnamese Dong (VND) currency formatting and English user interface (UI) typography.
- Accessibility features compliant with WCAG 2.2 Success Criterion 2.2.1 (Timing Adjustable).
- AI failure auditing, commit hygiene, and Definition of Done verification.

---

## 2. What the AI MUST Do

The AI assistant must strictly follow all mandatory engineering rules defined in the following table.

| ID | Rule | Reason |
| :--- | :--- | :--- |
| MUST-01 | Compute remaining time continuously from an absolute target timestamp (`targetTimestamp - Date.now()`). | Prevents cumulative clock drift caused by CPU scheduling delays, browser background throttling, and timer drift. |
| MUST-02 | Drive countdown animations using `requestAnimationFrame` with proper cleanup, throttling React state renders to at most once per displayed second. | Eliminates unnecessary 60Hz component re-renders while ensuring instantaneous time resynchronization upon tab focus. |
| MUST-03 | Listen to the `visibilitychange` event on the Document Object Model (DOM) and immediately recalibrate the timer when the tab returns to visible. | Overcomes aggressive background tab throttling in modern browsers that delay timer execution by minutes. |
| MUST-04 | Model inventory locking via a finite state machine implemented as a strict, pure reducer function. | Ensures deterministic, testable transitions between discrete states (`IDLE`, `RESERVING`, `RESERVED`, `PURCHASING`, `PURCHASED`, `REVERTING`). |
| MUST-05 | Enforce exhaustive compile-time checking in state machine switch statements using a TypeScript `never` assertion. | Guarantees that unhandled actions or newly introduced states are caught by the compiler before runtime. |
| MUST-06 | Treat the server as the ultimate single source of truth for available stock and reservation validity. | Prevents overselling during high concurrency surges when multiple clients contend for limited inventory. |
| MUST-07 | Roll back optimistic inventory decrements immediately upon receiving a server rejection or network timeout. | Keeps client inventory counters strictly synchronized with real server capacity. |
| MUST-08 | Return locked stock to available inventory when a reservation timer expires without completed purchase. | Frees abandoned reservations for other waiting shoppers in high-concurrency flash-sale queues. |
| MUST-09 | Format all product prices in Vietnamese Dong (VND) using `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })` while keeping UI text in English. | Complies with Vietnamese financial presentation standards while maintaining international codebase language consistency. |
| MUST-10 | Comply with WCAG 2.2 Success Criterion 2.2.1 (Timing Adjustable) by offering an accessible option to extend the reservation window once. | Protects users with motor, cognitive, or vision impairments who need additional time to complete checkout before timeout. |
| MUST-11 | Document every AI bug, misunderstanding, or regression truthfully in `AI_FAILURE_AUDIT.md`. | Upholds academic honesty and engineering integrity by recording actual flaws rather than fabricating or concealing errors. |
| MUST-12 | Author atomic Git commits formatted according to the Conventional Commits 1.0.0 specification across at least 8 distinct commits. | Guarantees a clean, auditable development history where defects and their corresponding remediations live in separate commits. |

---

## 3. What the AI MUST NOT Do

The AI assistant must strictly avoid all prohibited practices defined in the following table.

| ID | Rule | Reason |
| :--- | :--- | :--- |
| MUSTNOT-01 | Do not count elapsed countdown seconds using naive interval ticks (`secondsLeft - 1`). | Accumulates massive timing drift over time, causing countdown timers to diverge significantly from actual wall-clock time. |
| MUSTNOT-02 | Do not use `setInterval` or `setTimeout` chains as the core engine for high-precision countdowns. | Browser timer clamping throttles intervals down to 1 second or less in background tabs, corrupting flash-sale timing. |
| MUSTNOT-03 | Do not trigger React state updates on every animation frame (60 or 120 times per second) for a second-based countdown. | Degrades rendering performance, creates unnecessary garbage collection pressure, and consumes excessive battery. |
| MUSTNOT-04 | Do not allow available stock counters to drop below zero under any scenario. | Negative stock represents an inventory oversell bug that damages seller reputation and breaks order fulfillment. |
| MUSTNOT-05 | Do not allow illegal state machine transitions (for example, transitioning from `IDLE` directly to `PURCHASED`). | Corrupts application state and bypasses inventory validation rules. |
| MUSTNOT-06 | Do not accept stale, out-of-order asynchronous server responses. | Older network responses arriving late could overwrite fresher state, corrupting stock counts and reservation status. |
| MUSTNOT-07 | Do not apply `aria-live="assertive"` or place `role="timer"` on a live region that announces every passing second. | Overwhelms screen reader users with non-stop verbal chatter, rendering assistive technology completely unusable. |
| MUSTNOT-08 | Do not convey stock scarcity, reservation expiration, or status solely through color or emojis. | Violates WCAG 2.2 Success Criterion 1.4.1 (Use of Color), leaving critical information imperceptible to color-blind users. |
| MUSTNOT-09 | Do not use the `any` type or loose type casting (`as unknown as Type`). | Bypasses compile-time safety and risks catastrophic runtime null reference crashes during critical checkout steps. |
| MUSTNOT-10 | Do not conceal, erase, or invent bugs in `AI_FAILURE_AUDIT.md`. | Violates engineering transparency standards and undermines the pedagogical assessment of AI-assisted software development. |

---

## 4. Timer Rules

The countdown timer controls flash-sale start windows and checkout reservation holds.

### 4.1 Target Timestamp Computation
- Countdown remaining time must always be derived mathematically: `Math.max(0, targetTimestamp - Date.now())`.
- Never decrement a counter variable by 1 on each tick.
- The timer must determine Days, Hours, Minutes, and Seconds from the total remaining milliseconds.

### 4.2 High-Efficiency Animation Loop
- Time sampling must be powered by `requestAnimationFrame`.
- Store the currently displayed second in a React `useRef` or local variable.
- Trigger React state re-renders only when the computed whole second value changes (`Math.floor(remainingMs / 1000)` differs from the previous rendered second).
- Cancel active animation frames cleanly in the cleanup phase of `useEffect`.

### 4.3 Background Tab and Visibility Resynchronization
- Register an event listener for `document.addEventListener('visibilitychange', handler)`.
- When `document.visibilityState === 'visible'`, immediately recompute `targetTimestamp - Date.now()` and update the displayed timer.
- If the target timestamp has elapsed while the tab was hidden, transition immediately to the expired state without replaying skipped ticks.

---

## 5. State Machine Rules

All inventory locking, reservation, and purchasing actions must follow a strict finite state machine.

### 5.1 Finite State Definitions
The state machine contains exactly six distinct operational states:
1. `IDLE`: Product is available for reservation; initial state.
2. `RESERVING`: Client has submitted a lock request; awaiting server validation.
3. `RESERVED`: Server confirmed inventory lock; reservation countdown active.
4. `PURCHASING`: Client confirmed payment; awaiting server transaction completion.
5. `PURCHASED`: Transaction completed successfully; product secured.
6. `REVERTING`: Reservation expired or cancelled; releasing optimistic lock.

### 5.2 Pure Reducer Architecture
- The state machine must be implemented as a pure reducer: `(state: InventoryState, action: InventoryAction) => InventoryState`.
- Side effects (network requests, timer registrations, audio cues) must never be executed inside the reducer.
- Illegal or undefined transitions must be ignored, returning the existing state unmodified (`return state`).

### 5.3 Exhaustive Compile-Time Validation
- Every action and state must be evaluated within a TypeScript switch statement.
- The default branch must pass the unhandled action into an exhaustive type assertion:
  ```typescript
  default: {
    const _exhaustiveCheck: never = action;
    return state;
  }
  ```

### 5.4 Stock Invariant
- Available stock must satisfy `stock >= 0` at all times.
- If an incoming reservation request attempts to decrement stock when `stock === 0`, the action must be rejected immediately.

---

## 6. Concurrency and Inventory Rules

High-concurrency flash sales require robust coordination between optimistic client updates and authoritative server confirmations.

### 6.1 Server Authority and Optimistic Updates
- When the user clicks "Reserve Now", the client optimistically updates UI state to reflect the requested reservation.
- The client dispatches a lock request to the server containing a unique `requestId` and timestamp.
- The server remains the ultimate source of truth. If the server responds with an error (for example, HTTP 409 Conflict, Out of Stock, or Rate Limited), the client must immediately roll back the optimistic reservation and restore the stock counter.

### 6.2 Stale Response Rejection
- Each outbound request must carry an incremental sequence number or unique identifier.
- If a server response arrives with a sequence identifier older than the currently committed state, the response must be silently discarded.

### 6.3 Reservation Expiration and Stock Return
- A successful reservation locks 1 unit of stock for a duration of exactly 120 seconds (2 minutes).
- If the reservation timer reaches 0 before the user completes the purchase, the client dispatches an expiry event.
- The reserved item is automatically released, the stock counter increments by 1, and the state reverts to `IDLE`.

---

## 7. Localization Rules

The storefront targets the Vietnamese e-commerce market while supporting global engineering standards.

### 7.1 Currency Formatting
- All monetary amounts must be formatted using the official JavaScript Internationalization (i18n) API:
  ```typescript
  export const formatVND = (amount: number): string =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  ```
- Formatting output must reflect official Vietnamese currency standards (for example: `1.250.000 ₫`).

### 7.2 Language Consistency
- Code comments, TypeScript interfaces, commit messages, and documentation must be written in English.
- User interface labels, headings, button texts, and accessibility announcements must be in clear English.

---

## 8. Accessibility Rules

The application must comply with the WCAG 2.2 Level AA standard.

### 8.1 Timing Adjustable (WCAG 2.2.1)
- Flash-sale checkout timers inherently create time limits.
- In accordance with WCAG 2.2 Success Criterion 2.2.1 (Timing Adjustable), the user interface must provide a button allowing the user to extend the active reservation timer once by an additional 60 seconds before expiration.

### 8.2 Non-Disruptive Live Regions and Timers
- Never assign `aria-live="assertive"` to ticking countdown elements.
- The element with `role="timer"` must convey the current countdown without spamming the screen reader accessibility tree every second.
- Critical status transitions (such as "Reservation confirmed", "Reservation expired", "Time extended by 60 seconds", "Out of stock") must be announced via a polite live region (`role="status"`, `aria-live="polite"`).

### 8.3 Visual and Target Accessibility
- All interactive controls must be native `<button type="button">` elements.
- Interactive target areas must measure at least 44 by 44 Cascading Style Sheets (CSS) pixels, surpassing the WCAG 2.2 Level AA minimum of 24 by 24 CSS pixels.
- Text contrast must meet or exceed 4.5:1 against adjacent backgrounds; non-text UI borders and focus outlines must meet or exceed 3:1.
- Visible focus rings must be at least 2 CSS pixels thick with a clear offset.
- Respect `@media (prefers-reduced-motion: reduce)` by disabling decorative pulse animations.

---

## 9. AI Honesty Rules

Engineering transparency is paramount when working with AI coding assistants.

### 9.1 Mandatory Audit Log
- All defects, regressions, race conditions, timer bugs, or type errors encountered during AI development must be recorded truthfully in [AI_FAILURE_AUDIT.md](file:///d:/Study/Web%20Application%20Development/LAB/LAB02/HW/HW3/AI_FAILURE_AUDIT.md).
- Each audit entry must record:
  1. **Failure ID** and **Category** (for example: Timer Drift, Concurrency Race Condition, Accessibility Omission).
  2. **Description of AI Mistake**: What the AI originally suggested or implemented incorrectly.
  3. **Root Cause**: The underlying reason the failure occurred.
  4. **Remediation**: The corrective action taken to fix the issue.

### 9.2 Strict Honesty Invariants
- The AI must never invent fictitious bugs to satisfy audit checklists.
- The AI must never conceal, omit, or downplay real mistakes identified during testing.
- If a proposed implementation fails automated tests, the failure must be logged before the fix is committed.

---

## 10. Git Rules

Version control must demonstrate disciplined, atomic commit management.

### 10.1 Conventional Commits Specification
All commit messages must adhere to the Conventional Commits 1.0.0 format:
```text
<type>(<scope>): <short description in imperative present tense>

[optional body explaining technical rationale and concurrency considerations]

[optional footer referencing issue IDs or audit logs]
```

Allowed types:
- `feat`: A new feature (anti-drift timer, inventory state machine, reservation hook).
- `fix`: A bug fix or race condition resolution.
- `docs`: Documentation updates, project rules, or audit logs.
- `style`: Visual styling, contrast adjustments, or formatting.
- `refactor`: Code reorganization with no functional change.
- `test`: Automated unit, integration, or drift tests.
- `chore`: Tooling, build scripts, or dependency updates.

### 10.2 Atomic Commit Minimums
- The development history must contain at least 8 small, atomic commits.
- A single commit must address exactly one concern.
- When an AI failure is identified and remediated, the discovery/bug reproduction must be committed separately from the fix.

---

## 11. Definition of Done

A task or pull request is complete ("Done") only when all items in the following checklist have been validated and signed off:

### 11.1 Release Verification Checklist
- [ ] **Anti-Drift Timer**: Remaining time is derived from `targetTimestamp - Date.now()`; zero `setInterval` countdown ticks; updates at most once per second; recalibrates on `visibilitychange`.
- [ ] **Finite State Machine**: State transitions handled by pure reducer; illegal transitions rejected; exhaustive switch using `never` check; `stock >= 0` invariant strictly maintained.
- [ ] **Optimistic Concurrency**: Optimistic reservations roll back cleanly on server rejection; stale server responses discarded; expired reservations return stock to inventory.
- [ ] **Localization**: Currency amounts formatted in Vietnamese Dong (VND) via `Intl.NumberFormat`; interface text in English.
- [ ] **Accessibility (WCAG 2.2 AA)**: Timing adjustable with one 60-second extension; non-disruptive `role="status"` live region; native buttons >= 44x44px; contrast >= 4.5:1; reduced motion honored.
- [ ] **AI Audit Transparency**: Real mistakes logged with root cause and remediation in `AI_FAILURE_AUDIT.md`.
- [ ] **Git Cleanliness**: At least 8 atomic commits following Conventional Commits 1.0.0.
- [ ] **Type Safety & Build**: Zero TypeScript errors (`"strict": true`, zero `any`), zero ESLint warnings, production build completes cleanly.
