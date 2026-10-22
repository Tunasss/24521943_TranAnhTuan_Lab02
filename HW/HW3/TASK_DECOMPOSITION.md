# Work Breakdown Structure: High-Concurrency Flash-Sale E-Commerce Engine

This document defines the Work Breakdown Structure (WBS) for the "High-Concurrency Flash-Sale E-Commerce Engine" project. The application simulates a high-traffic e-commerce flash-sale event in Vietnam, featuring an anti-drift countdown timer, an optimistic inventory lock state machine, and full accessibility compliance.

All deliverables, work packages, and acceptance criteria in this document comply with the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA standard and the rules established in [project-rules.md](file:///d:/Study/Web%20Application%20Development/LAB/LAB02/HW/HW3/project-rules.md). The total estimated effort across all nine work packages is exactly 16.0 hours.

---

## 1. Executive Summary and Project Objectives

### 1.1 Project Objective
The objective is to architect, develop, verify, and document an e-commerce flash-sale engine capable of handling high-concurrency traffic without clock drift or inventory overselling. The engine provides deterministic state transitions, optimistic reservation locks, immediate rollbacks on server conflict, Vietnamese Dong (VND) currency localization, and WCAG 2.2 Level AA accessibility.

### 1.2 Structure of Work Packages
The project is divided into nine sequential work packages. Each work package contains granular engineering tasks, explicit inputs, tangible outputs, objective acceptance criteria, and time allocations.

---

## 2. Work Package 1: Setup and Types

This work package establishes the development workspace, strict TypeScript compiler options, and foundational domain model types.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP1-T1 | Initialize development workspace and configure strict TypeScript compiler settings. | Vite React TypeScript template, package dependencies, linting configurations. | Initialized repository with `tsconfig.json`, `package.json`, ESLint rules, and build scripts. | Compiler configured with `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, and `noUncheckedIndexedAccess: true`. Zero diagnostics on build. | 0.5 |
| WP1-T2 | Define core state machine actions, finite states, and inventory data contracts. | Specifications from `project-rules.md`. | Type definitions file `src/types/flashSale.ts` declaring `InventoryState`, `InventoryAction`, `FlashSaleProduct`, and `ServerResponse`. | Comprehensive typing for all six finite states (`IDLE`, `RESERVING`, `RESERVED`, `PURCHASING`, `PURCHASED`, `REVERTING`). Zero use of `any`. | 0.5 |

**Work Package 1 Subtotal: 1.0 Hour**

---

## 3. Work Package 2: Anti-Drift Timer

This work package builds the high-precision countdown timer engine that computes time against an absolute timestamp and resynchronizes upon document visibility changes.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP2-T1 | Implement timestamp-based mathematical countdown hook with requestAnimationFrame. | Target timestamp (milliseconds), tick frequency threshold. | Custom React hook `src/hooks/useAntiDriftTimer.ts` returning formatted time segments (days, hours, minutes, seconds). | Remaining time computed continuously from `targetTimestamp - Date.now()`. React state renders at most once per displayed second. No use of `setInterval`. | 1.0 |
| WP2-T2 | Implement document visibility resynchronization and background tab catch-up. | Document Object Model (DOM) `visibilitychange` events, timer state ref. | Visibility handler integrated into `useAntiDriftTimer.ts`. | Immediately recalibrates displayed time when tab visibility returns to `visible`. If deadline passed while hidden, triggers expiration immediately. | 1.0 |

**Work Package 2 Subtotal: 2.0 Hours**

---

## 4. Work Package 3: Inventory Lock State Machine (Reducer)

This work package implements the finite state machine as a pure reducer, enforcing valid state transitions, non-negative stock invariants, and compile-time exhaustiveness.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP3-T1 | Build pure state machine reducer with transition validation. | State machine type definitions from `src/types/flashSale.ts`. | Pure reducer `src/reducers/inventoryReducer.ts` governing inventory states. | Implements transitions between `IDLE`, `RESERVING`, `RESERVED`, `PURCHASING`, `PURCHASED`, and `REVERTING`. Illegal transitions are ignored without mutation. | 1.0 |
| WP3-T2 | Implement exhaustive switch validation and stock invariant guarantees. | Action union types, current stock bounds. | Exhaustive compiler checks and invariant guards in `inventoryReducer.ts`. | Default switch branch enforces `const _exhaustiveCheck: never = action;`. Stock is strictly clamped so that `stock >= 0` under all possible transition paths. | 1.0 |

**Work Package 3 Subtotal: 2.0 Hours**

---

## 5. Work Package 4: Mock Flash-Sale Server and Concurrency Simulation

This work package develops an asynchronous mock server simulating network latency, concurrent client requests, random contention conflicts, and server-side stock locks.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP4-T1 | Implement mock server with simulated network latency and stock authority. | Simulated server stock count, network delay ranges (150ms to 600ms). | Mock service `src/services/mockFlashSaleServer.ts` managing authoritative inventory. | Server validates reservation requests, simulates contention conflicts (HTTP 409 Conflict), and assigns unique lease tokens to successful locks. | 1.0 |
| WP4-T2 | Build high-concurrency multi-client burst simulator. | Rapid request dispatchers, configurable client contention parameters. | Simulation utility `src/utils/concurrencySimulator.ts`. | Dispatches 20 concurrent simulated reservation attempts against limited stock (for example, 5 units), verifying that the server never oversells. | 1.0 |

**Work Package 4 Subtotal: 2.0 Hours**

---

## 6. Work Package 5: Optimistic Reservation Hook with Rollback and Expiry

This work package orchestrates client-side optimistic UI updates, server reconciliation, stale response filtering, and automatic reservation timeouts.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP5-T1 | Implement optimistic reservation dispatcher and immediate conflict rollback. | Reducer dispatch, mock server client, request sequence counters. | Custom hook `src/hooks/useFlashSaleEngine.ts` handling `reserveItem` and `purchaseItem`. | Optimistically decrements stock; immediately rolls back and alerts the user if the server rejects the lock; discards out-of-order stale responses. | 1.5 |
| WP5-T2 | Implement reservation hold timer, automatic expiration, and stock reclamation. | Lease duration (120 seconds), expiration callback handlers. | Automated expiry management in `useFlashSaleEngine.ts`. | When reservation timer hits 0 without purchase, automatically dispatches expiration, releases lease on server, and returns stock to available pool. | 1.0 |

**Work Package 5 Subtotal: 2.5 Hours**

---

## 7. Work Package 6: Accessible Storefront UI

This work package constructs the product storefront interface, Vietnamese Dong (VND) price formatting, accessible timing extensions, and WCAG 2.2 Level AA visual components.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP6-T1 | Implement product display card, VND currency formatting, and native control buttons. | Product details, `Intl.NumberFormat`, UI requirements. | Component `src/components/ProductCard.tsx` and stylesheet `src/styles/storefront.css`. | Prices formatted via `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`; native buttons measure >= 44x44px; text contrast >= 4.5:1. | 1.5 |
| WP6-T2 | Integrate WCAG 2.2.1 timing extension control and polite status announcer. | Reservation countdown state, live region standards. | Time extension button and live region component `src/components/SaleStatusBanner.tsx`. | Provides accessible button to extend reservation once by 60 seconds (WCAG 2.2.1); status announced via `role="status"` and `aria-live="polite"` without ticker spam. | 1.0 |

**Work Package 6 Subtotal: 2.5 Hours**

---

## 8. Work Package 7: Automated Tests and Drift Evidence

This work package creates automated test suites validating anti-drift timer precision under throttling, state machine correctness, and zero-oversell concurrency safety.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP7-T1 | Create automated unit tests for state machine reducer and concurrency invariants. | Vitest or Jest test runner, state machine actions, mock server. | Test suite `src/__tests__/inventoryReducer.test.ts`. | 100 percent branch coverage verifying valid transitions, rejected illegal actions, zero-stock guards, and rollback consistency. | 1.0 |
| WP7-T2 | Create automated anti-drift timer test and capture precision evidence. | Simulated background tab intervals, Date.now() timestamp mocks. | Test suite `src/__tests__/antiDriftTimer.test.ts` and drift evidence script. | Demonstrates that timer maintains zero drift across simulated background tab delays whereas standard setInterval drifts significantly. | 0.5 |

**Work Package 7 Subtotal: 1.5 Hours**

---

## 9. Work Package 8: AI Failure Audit

This work package conducts an engineering failure analysis, logging all AI misconceptions, race conditions, and remediations encountered during development.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP8-T1 | Identify and analyze real AI errors encountered during flash-sale implementation. | Test regression logs, timer drift bugs, state machine edge cases. | Document `AI_FAILURE_AUDIT.md` capturing actual flaws and root cause analyses. | Minimum of 3 genuine technical failure cases documented with Failure ID, Category, Description, Root Cause, and Remediation. No invented bugs. | 0.5 |
| WP8-T2 | Verify regression fixes and separate defect discoveries into distinct Git commits. | Remediated code patches, Conventional Commits specification. | Verified audit trail with dedicated bug-fix commits. | Flaws and their corresponding fixes committed in separate, atomic commits across the repository history. | 0.5 |

**Work Package 8 Subtotal: 1.0 Hour**

---

## 10. Work Package 9: Documentation and Evidence

This work package compiles the final architecture reference, accessibility audit report, and Definition of Done release evidence.

| ID | Task | Input | Output | Acceptance Criteria | Estimated Hours |
| :--- | :--- | :--- | :--- | :--- | :--- |
| WP9-T1 | Author comprehensive system architecture and concurrency documentation. | Source code, state machine diagrams, timer mechanics. | Updated `README.md` and `docs/ARCHITECTURE.md`. | Detailed documentation of anti-drift timer mathematics, optimistic locking lifecycle, and Vietnamese market localization. | 1.0 |
| WP9-T2 | Compile verification evidence screenshots and Definition of Done sign-off. | Automated test logs, Lighthouse accessibility audits, drift charts. | Audit report `docs/VERIFICATION_REPORT.md` and signed-off Definition of Done. | All Definition of Done checklist criteria verified with empirical evidence and reproduction instructions. | 0.5 |

**Work Package 9 Subtotal: 1.5 Hours**

---

## 11. Project Effort Summary and Allocation

The following table summarizes the distribution of effort across all nine work packages.

| Work Package ID | Work Package Title | Number of Tasks | Total Estimated Effort (Hours) | Percentage of Total Effort |
| :--- | :--- | :--- | :--- | :--- |
| **WP-01** | Setup and Types | 2 | 1.0 | 6.25 % |
| **WP-02** | Anti-Drift Timer | 2 | 2.0 | 12.50 % |
| **WP-03** | Inventory Lock State Machine (Reducer) | 2 | 2.0 | 12.50 % |
| **WP-04** | Mock Flash-Sale Server and Concurrency Simulation | 2 | 2.0 | 12.50 % |
| **WP-05** | Optimistic Reservation Hook with Rollback and Expiry | 2 | 2.5 | 15.63 % |
| **WP-06** | Accessible Storefront UI | 2 | 2.5 | 15.63 % |
| **WP-07** | Automated Tests and Drift Evidence | 2 | 1.5 | 9.38 % |
| **WP-08** | AI Failure Audit | 2 | 1.0 | 6.25 % |
| **WP-09** | Documentation and Evidence | 2 | 1.5 | 9.38 % |
| **Total** | **All 9 Work Packages Combined** | **18** | **16.0** | **100.00 %** |
