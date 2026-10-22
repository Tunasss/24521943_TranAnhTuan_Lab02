# Production Enterprise Data-Grid: AI Assistant Code of Conduct and Project Rules

This document serves as the binding code of conduct and engineering standard for any Artificial Intelligence (AI) assistant contributing to the "Production Enterprise Data-Grid" project. The project is an enterprise-grade data grid built with React and TypeScript, delivering accessible data presentation, sorting, filtering, and pagination.

All code generated, suggested, or modified by AI assistants must strictly follow the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA specification, modern React architectural patterns, and production-ready TypeScript standards.

---

## 1. Purpose and Scope

### 1.1 Purpose
The purpose of this document is to establish non-negotiable architectural, accessibility, typing, testing, and version-control rules for AI assistants. These rules ensure that all generated components operate reliably in mission-critical enterprise environments, support all users regardless of ability or assistive technology, and maintain long-term codebase maintainability.

### 1.2 Scope
This standard applies to:
- All source code, component files, custom hooks, utilities, and styles in the repository.
- Core data grid capabilities, specifically column sorting, multi-column filtering, client and server pagination, and cell selection.
- All unit, integration, and End-to-End (E2E) automated tests.
- All Git commit messages, Pull Request (PR) descriptions, and documentation updates.

---

## 2. What the AI MUST Do

The AI assistant must strictly follow all rules defined in the following table.

| ID | Rule | Reason |
| :--- | :--- | :--- |
| MUST-01 | Build upon native HyperText Markup Language (HTML) table elements (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`). | Native table elements supply inherent structural relationships, built-in screen reader navigation commands, and standard tabular semantics without fragile scripting workarounds. |
| MUST-02 | Apply explicit `scope="col"` to column headers and `scope="row"` to row identification headers. | Explicit scopes establish programmatic associations between header cells and data cells for screen reader users navigating multi-dimensional tables. |
| MUST-03 | Implement a roving `tabindex` pattern (`tabIndex={0}` for the active cell, `tabIndex={-1}` for all inactive cells). | Keeps the data grid as a single logical Tab stop within the Document Object Model (DOM) while enabling seamless internal navigation with directional keys. |
| MUST-04 | Provide complete keyboard support including Arrow keys, Home, End, Page Up, Page Down, Enter, Space, and Escape. | Allows keyboard-only users and assistive technology users to navigate, sort, filter, and edit cells without requiring a pointer device. |
| MUST-05 | Ensure a minimum color contrast ratio of 4.5:1 for standard text and 3:1 for user interface (UI) components and graphical elements. | Satisfies WCAG 2.2 Success Criterion 1.4.3 (Contrast Minimum) and Success Criterion 1.4.11 (Non-text Contrast) for users with moderate low vision or color vision deficiency. |
| MUST-06 | Display an unmistakable visible focus indicator with at least a 2 Cascading Style Sheets (CSS) pixel solid boundary and 3:1 contrast ratio against adjacent surfaces. | Satisfies WCAG 2.2 Success Criterion 2.4.7 (Focus Visible) and Success Criterion 2.4.11 (Focus Appearance) so keyboard users can track their active position. |
| MUST-07 | Guarantee interactive touch and pointer targets measure at least 24 by 24 CSS pixels. | Satisfies WCAG 2.2 Success Criterion 2.5.8 (Target Size Minimum) to prevent misclicks on touch screens and compact layouts. |
| MUST-08 | Announce dynamic updates (record counts, sorting state, active page) via polite Accessible Rich Internet Applications (ARIA) live regions (`aria-live="polite"`). | Ensures non-sighted users are immediately aware of asynchronous data filtering, reordering, and page transitions without disruptive focus shifting. |
| MUST-09 | Maintain complete generic type safety (`<TData>`) across all component interfaces, column definitions, and callback handlers. | Guarantees compile-time type verification, prevents data shape mismatches, and allows consumer applications to pass arbitrary record types safely. |
| MUST-10 | Preserve the established public contract of `ColumnDef<TData>` and `DataGridProps<TData>`. | Prevents breaking changes in downstream consuming applications that rely on standardized component properties and table signatures. |
| MUST-11 | Verify changes with automated accessibility scanners (axe-core) and maintain zero reported violations. | Automates regression detection for common programmatic accessibility defects before pull request submission. |
| MUST-12 | Write small, atomic Git commits structured in accordance with the Conventional Commits 1.0.0 specification. | Enables clean automated changelog generation, predictable version increments, and focused peer code reviews. |

---

## 3. What the AI MUST NOT Do

The AI assistant must strictly avoid all prohibited practices defined in the following table.

| ID | Rule | Reason |
| :--- | :--- | :--- |
| MUSTNOT-01 | Do not generate "div-soup" or recreate table structures with generic `<div>` or `<span>` elements. | Generic container trees break native accessibility semantics, degrade performance, and require extensive, error-prone manual ARIA mapping. |
| MUSTNOT-02 | Do not use the TypeScript `any` type or use loose type assertions (`as unknown as TargetType`). | Erases compile-time type safety, hides developer errors, causes unexpected runtime null pointer exceptions, and compromises enterprise reliability. |
| MUSTNOT-03 | Do not mutate, rename, or delete existing properties of `ColumnDef<TData>` or `DataGridProps<TData>`. | Introduces breaking Application Programming Interface (API) modifications that destabilize consuming applications across the enterprise. |
| MUSTNOT-04 | Do not convey status, state, severity, or active selections solely through color, shape, or emojis. | Violates WCAG 2.2 Success Criterion 1.4.1 (Use of Color), preventing color-blind, low-vision, or screen reader users from perceiving critical status indicators. |
| MUSTNOT-05 | Do not introduce keyboard traps where focus cannot escape using standard Tab or Shift + Tab keystrokes. | Violates WCAG 2.2 Success Criterion 2.1.2 (No Keyboard Trap), permanently stranding keyboard-only users inside grid cells, filter popups, or inputs. |
| MUSTNOT-06 | Do not attach click handlers to non-interactive elements without full keyboard handling and appropriate roles. | Prevents keyboard and assistive technology users from triggering operations that pointer users can execute with a mouse click. |
| MUSTNOT-07 | Do not apply ARIA roles, states, or properties that contradict native HTML semantics (for example, `<button role="button">` or `<th role="gridcell">`). | Violates the First Rule of ARIA and causes conflicting accessibility tree representations across browsers and assistive tools. |
| MUSTNOT-08 | Do not suppress focus outlines using `outline: none` or `outline: 0` without supplying an enhanced, compliant replacement focus ring. | Deprives keyboard users of visual navigation feedback, leaving them unable to determine which cell or control currently has focus. |
| MUSTNOT-09 | Do not use fixed pixel font sizes or layouts that break when browser text is zoomed up to 200 percent. | Violates WCAG 2.2 Success Criterion 1.4.4 (Resize Text) by clipping, truncating, or overlapping readable tabular content. |
| MUSTNOT-10 | Do not introduce decorative animations or layout shifts that ignore the user's `prefers-reduced-motion` operating system preference. | Violates WCAG 2.2 Success Criterion 2.3.3 (Animation from Interactions) and can trigger vestibular disorders, nausea, and visual disorientation. |

---

## 4. Semantic HTML Rules

The foundation of the data grid component must be valid, semantic HTML elements. Custom styled generic containers are strictly prohibited for tabular layouts.

### 4.1 Native Table Foundation
- The grid must use a native `<table>` element as the outer structural element.
- Header rows must be grouped inside a single `<thead>` element.
- Data rows must be grouped inside a single `<tbody>` element.
- Summary, total, or aggregation rows (when present) must be placed inside a `<tfoot>` element.
- Rows must always be constructed using native `<tr>` elements.

### 4.2 Header and Cell Structure
- Column header cells must be constructed using native `<th>` elements and must declare `scope="col"`.
- Row identifier cells (such as row selection headers or index cells) must declare `scope="row"` when they identify the rest of the row.
- Standard data cells must be constructed using native `<td>` elements.
- Never wrap cells in intermediate layout wrappers that break the strict parent-child relationship of `table > thead/tbody > tr > th/td`.

### 4.3 Native Interactive Controls
- All sorting triggers located within header cells must be native `<button type="button">` elements.
- Pagination buttons (first page, previous page, next page, last page, page numbers) must be native `<button type="button">` elements.
- Filtering controls must use native form controls:
  - Text search: `<input type="search">` or `<input type="text">` paired with an associated `<label>` or `aria-label`.
  - Dropdown options: native `<select>` or custom listboxes adhering fully to the World Wide Web Consortium (W3C) Accessible Rich Internet Applications (ARIA) Authoring Practices Guide (APG).
  - Row selection: native `<input type="checkbox">` elements accompanied by accessible labels (for example, `aria-label="Select row 4, John Doe"`).

### 4.4 Prohibition of Generic Container Soup
- Constructing data grids out of nested `<div>` and `<span>` elements styled with CSS grid (`display: grid`) or CSS table (`display: table`) is strictly prohibited.
- `<div>` elements are allowed only inside a cell or control to manage internal alignment, badges, or flexbox layouts for content rendering.

---

## 5. ARIA Rules

The AI assistant must apply ARIA attributes strictly in alignment with the W3C ARIA Authoring Practices Guide for Grid.

### 5.1 Grid Role Hierarchy
When enhanced interactive grid features (such as two-dimensional arrow key navigation and cell editing) are active, assign standard grid roles:
- The `<table>` element must declare `role="grid"` and a descriptive name via `aria-label` or `aria-labelledby` (for example, `aria-label="Customer Orders Data Grid"`).
- Each header and data `<tr>` element must declare `role="row"`.
- Each column header `<th>` element must declare `role="columnheader"`.
- Each data `<td>` element must declare `role="gridcell"`.
- If a row is selectable, row elements should support `aria-selected="true"` or `aria-selected="false"`.

### 5.2 Dynamic State Attributes
- **Sorting State**:
  - The currently sorted column header must expose `aria-sort="ascending"` or `aria-sort="descending"`.
  - Unsorted columns that support sorting must expose `aria-sort="none"`.
  - The sort toggle button inside the header must have an accessible label indicating the action that will occur on activation (for example, `aria-label="Sort by Last Name, currently ascending. Activate to sort descending."`).
- **Selection State**:
  - Selected data rows must set `aria-selected="true"`.
  - Unselected data rows in a selectable grid must set `aria-selected="false"`.
  - The master selection checkbox in the table header must expose `aria-checked="mixed"` when a subset of rows is selected.
- **Expansion State**:
  - Expandable detail rows must indicate their status using `aria-expanded="true"` or `aria-expanded="false"` on the trigger button.
  - The trigger button must programmatically reference the controlled content container using `aria-controls="[unique-container-id]"`.

### 5.3 Live Region Announcements
- Dynamic changes in grid data must be announced using an off-screen live region element configured with `aria-live="polite"` and `aria-atomic="true"`.
- Status announcements must include:
  - Result counts after applying or clearing filters (for example, `"Filter applied: 14 matching records found"`).
  - Page navigation changes (for example, `"Page 3 of 12 loaded"`).
  - Sorting changes (for example, `"Sorted by Order Date descending"`).

### 5.4 First Rule of ARIA and Semantics Integrity
- Do not apply redundant ARIA roles to native HTML elements that already possess those semantics (for example, do not write `<button role="button">` or `<input type="checkbox" role="checkbox">`).
- Never assign ARIA attributes that conflict with the actual DOM structure or element role.
- All `id` attributes referenced by `aria-labelledby`, `aria-describedby`, and `aria-controls` must exist and be unique within the Document Object Model.

---

## 6. Keyboard Rules

The data grid must deliver an intuitive, trap-free keyboard interaction model adhering to the W3C ARIA Authoring Practices Guide (APG) Grid Pattern.

### 6.1 Grid Navigation Matrix
Keyboard focus within the grid body and header must follow standard directional navigation:

| Key Combination | Action and Focus Behavior |
| :--- | :--- |
| **Right Arrow** | Moves focus one cell to the right within the current row. Focus stops at the last cell in the row. |
| **Left Arrow** | Moves focus one cell to the left within the current row. Focus stops at the first cell in the row. |
| **Down Arrow** | Moves focus one cell down within the current column. Focus stops at the last row. |
| **Up Arrow** | Moves focus one cell up within the current column. Focus stops at the column header row. |
| **Home** | Moves focus to the first cell in the current row. |
| **End** | Moves focus to the last cell in the current row. |
| **Control + Home** | Moves focus to the first cell of the first row (top-left header or data cell). |
| **Control + End** | Moves focus to the last cell of the last row (bottom-right data cell). |
| **Page Down** | Moves focus down by one visible page block (or by 10 rows). |
| **Page Up** | Moves focus up by one visible page block (or by 10 rows). |

### 6.2 Action and Activation Keys
- **Enter**:
  - On a sortable column header, toggles sorting direction (unsorted to ascending, ascending to descending, descending to unsorted).
  - On an interactive cell containing a link or button, activates that control.
  - On an editable cell, enters cell edit mode and places focus inside the editor control.
- **Space**:
  - On a selectable row cell or checkbox, toggles the selection state of the row.
  - On a sortable column header, toggles sorting direction.
- **Escape**:
  - When in cell edit mode, cancels the edit, restores previous content, and returns focus to the containing cell.
  - When a filter popup or context menu is open, closes the menu and returns focus to the initiating trigger button.

### 6.3 Roving Tabindex Implementation
- The entire data grid must constitute a single Tab stop in the primary page flow.
- Exactly one cell (the currently active cell) must have `tabIndex={0}`.
- Every other cell in the header and body must have `tabIndex={-1}`.
- When the user presses `Tab`:
  - If focus is currently inside the grid, pressing `Tab` must exit the grid and transfer focus to the next focusable element on the page (or pagination controls).
- When the user presses `Shift + Tab`:
  - Focus must exit the grid and transfer focus to the preceding focusable element on the page.
- When the user returns to the grid via `Tab` or `Shift + Tab`, focus must return to the cell that previously had `tabIndex={0}`.

### 6.4 Prevention of Keyboard Traps
- Focus must never become trapped inside any cell, filter field, or pagination widget.
- Users must always be able to enter, navigate, and leave the data grid component using standard keyboard strokes alone.

---

## 7. Visual and Design Rules

Visual presentation must comply with WCAG 2.2 Level AA requirements, supporting diverse visual abilities, device displays, and operating system accessibility modes.

### 7.1 Color Contrast Thresholds
- **Body Text and Data**: Text content in cells, headers, and tooltips must maintain a contrast ratio of at least 4.5:1 against the cell background color.
- **Large Text**: Text measuring at least 24 CSS pixels regular or 18.5 CSS pixels bold must maintain a contrast ratio of at least 3:1 against its background.
- **User Interface Components**: Borders, dividing lines, sorting icons, filter status glyphs, and checkbox borders must achieve a minimum contrast ratio of 3:1 against their adjacent background surfaces.
- **Selected and Hover States**: Highlighted row backgrounds must continue to provide at least 4.5:1 text contrast for all text within the row and at least 3:1 boundary contrast for the selection indicator.

### 7.2 Focus Appearance
- The focus indicator must be visible and prominent at all times during keyboard navigation.
- Minimum physical dimensions:
  - Outline thickness of at least 2 CSS pixels.
  - Clear separation or offset of at least 2 CSS pixels from adjacent text or element boundaries to prevent visual collision.
- The focus indicator must achieve a contrast ratio of at least 3:1 against both the focused element's background and the unfocused adjacent background.
- Styles using `outline: none` or `outline: 0` are strictly prohibited unless accompanied by an explicit, accessible custom focus indicator.

### 7.3 Target Size Minimum
- In compliance with WCAG 2.2 Success Criterion 2.5.8 (Target Size Minimum), every interactive element (pagination buttons, sorting triggers, filter icons, clear buttons, and checkboxes) must have a pointer target size of at least 24 by 24 CSS pixels.
- If an icon is visually smaller than 24 by 24 CSS pixels, sufficient padding or transparent touch boundary expansion must be applied to satisfy the 24 by 24 CSS pixel minimum.

### 7.4 Reduced Motion
- All CSS animations, loading spinners, and smooth scrolling behaviors must respect the user's operating system preferences via the `@media (prefers-reduced-motion: reduce)` media query.
- When reduced motion is preferred:
  - Set `animation-duration: 0.01ms` or `animation: none`.
  - Set `transition-duration: 0.01ms` or `transition: none`.
  - Set `scroll-behavior: auto`.

### 7.5 Forced Colors and High Contrast Mode
- The data grid must function correctly under Windows High Contrast Mode and the CSS `@media (forced-colors: active)` media query.
- Ensure that:
  - Focus rings utilize system `Highlight` colors.
  - Selected rows use system `Highlight` and `HighlightText`.
  - Explicit borders are applied to buttons, inputs, and cells so boundaries remain visible when background colors are flattened by the operating system.

---

## 8. TypeScript Rules

All code must be written in strict, modern TypeScript. The architecture must enforce type safety throughout data loading, sorting, filtering, and event handling.

### 8.1 Generic Type Safety
- The data grid and all associated hooks, utilities, and helper functions must be parameterized by a generic record type `<TData extends Record<string, unknown>>` or `<TData>`.
- Row data must flow through the grid without losing property type definitions.
- Custom cell renderers, value formatters, and sort comparators must receive strongly typed values corresponding to the target column's key.

### 8.2 Strict Type Checking and Prohibition of any
- The TypeScript compiler must operate with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, and `"noUncheckedIndexedAccess": true`.
- The use of `any` is strictly prohibited in any file, including tests.
- Type assertions (`as Type`) must be avoided. When unavoidable (such as parsing external JSON data), use runtime type guards or schema validation libraries before asserting types.
- Optional properties must be handled with explicit null and undefined checks rather than non-null assertions (`!`).

### 8.3 Core Contract Stability
The core public interfaces defining the grid contract must remain backward compatible. The AI assistant must not modify, rename, or remove existing properties from the following contract definitions:

```typescript
export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  columnId: string;
  value: unknown;
  operator?: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface ColumnDef<TData> {
  id: string;
  header: string | ((context: { column: ColumnDef<TData> }) => React.ReactNode);
  accessorKey?: keyof TData;
  accessorFn?: (row: TData) => unknown;
  cell?: (context: { value: unknown; row: TData; column: ColumnDef<TData> }) => React.ReactNode;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  sortComparator?: (a: unknown, b: unknown) => number;
}

export interface DataGridProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  getRowId?: (row: TData, index: number) => string;
  sorting?: SortState[];
  onSortingChange?: (sorting: SortState[]) => void;
  filtering?: FilterState[];
  onFilteringChange?: (filtering: FilterState[]) => void;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  totalRows?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  onRowClick?: (row: TData) => void;
}
```

---

## 9. Testing and Verification Rules

Quality assurance is mandatory. Code changes will not be accepted without passing automated tests, accessibility audits, and manual verification protocols.

### 9.1 Lighthouse Score Targets
- In Google Chrome Lighthouse audits:
  - **Accessibility Score**: 100 out of 100.
  - **Best Practices Score**: 100 out of 100.
- Any regression dropping either score below 100 must be resolved immediately prior to merging.

### 9.2 Automated axe-core Testing
- All unit and integration test suites executed with Jest or Vitest must incorporate `@axe-core/react` or `jest-axe`.
- Every rendered component state (empty, loading, populated data, sorted column, open filter dropdown, active pagination) must be evaluated with `expect(await axe(container)).toHaveNoViolations()`.
- End-to-End tests executed via Playwright must run `@playwright/test` with `@axe-core/playwright` scanning across desktop and mobile viewports.

### 9.3 Manual Keyboard Operability Testing
Before completing a task, verify keyboard operation through manual testing:
1. Navigate to the grid using only the `Tab` key.
2. Confirm the active cell receives a prominent visible focus ring.
3. Traverse all columns and rows using `Arrow Up`, `Arrow Down`, `Arrow Left`, and `Arrow Right`.
4. Press `Home` and `End` to jump across row boundaries; press `Control + Home` and `Control + End` to reach the grid extremities.
5. Trigger column sorting using `Enter` and `Space`.
6. Open filter menus, enter values, submit, and press `Escape` to close without losing focus.
7. Confirm that pressing `Tab` inside the grid immediately exits to the next external focusable control without getting trapped.

### 9.4 Screen Reader Compatibility Testing
The data grid must be tested with major screen readers:
- **NonVisual Desktop Access (NVDA)** with Mozilla Firefox and Google Chrome on Windows.
- **Job Access With Speech (JAWS)** with Google Chrome on Windows.
- **Apple VoiceOver** with Safari on macOS and iOS.

Verification requirements:
- The screen reader must announce table dimensions (total rows and columns) upon entry.
- Header cells must be announced when navigating into new columns.
- Sorting changes and filtered record counts must be enunciated through live regions.
- Selection checkboxes and expand/collapse states must clearly state their status.

---

## 10. Git and Version Control Rules

The AI assistant must produce clean, traceable, and standardized Git commits.

### 10.1 Conventional Commits Specification
All commit messages must adhere strictly to the Conventional Commits 1.0.0 format:
```text
<type>(<scope>): <short description in imperative present tense>

[optional body explaining motivation, technical rationale, and accessibility impact]

[optional footer referencing issue IDs, breaking changes, or PR links]
```

Allowed commit types:
- `feat`: A new feature or capability (for example, multi-column sorting, filter presets).
- `fix`: A bug fix or accessibility remediation.
- `docs`: Documentation updates, code comments, or specification revisions.
- `style`: Formatting, whitespace adjustments, or linting corrections without logic changes.
- `refactor`: Code reorganization that neither fixes a bug nor adds a feature.
- `test`: Adding missing tests, updating test suites, or improving testing utilities.
- `chore`: Build process, dependencies, configuration, or Continuous Integration (CI) updates.

Examples:
- `feat(grid): implement roving tabindex for keyboard cell navigation`
- `fix(a11y): add aria-sort to column header buttons and enforce 4.5:1 contrast`
- `test(pagination): add axe automated accessibility verification for page controls`

### 10.2 Atomic Commits and Documentation
- Keep commits small, isolated, and atomic. A single commit should address one logical concern.
- Do not combine refactoring changes with new features or unrelated dependency upgrades.
- Every commit must compile cleanly with zero TypeScript errors and pass all existing automated tests.

---

## 11. Definition of Done

A task or pull request is considered complete ("Done") only when all items in the following checklist have been satisfied and documented:

### 11.1 Release Verification Checklist
- [ ] **Semantic Structure**: Rendered markup utilizes native `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, and `<td>` elements with zero generic container soup.
- [ ] **Heading Scopes**: All column headers declare `scope="col"` and row identifier headers declare `scope="row"`.
- [ ] **ARIA Compliance**: Grid roles (`role="grid"`, `role="row"`, `role="columnheader"`, `role="gridcell"`) and dynamic states (`aria-sort`, `aria-selected`, `aria-live`) strictly adhere to the W3C ARIA Authoring Practices Guide for Grid.
- [ ] **Keyboard Navigation**: Complete two-dimensional navigation (Arrow keys, Home, End, Enter, Space, Escape) operates smoothly using a roving `tabindex` with zero keyboard traps.
- [ ] **Visual Accessibility**: Text contrast meets or exceeds 4.5:1 (3:1 for large text), UI components meet or exceed 3:1, and a 2 CSS pixel focus ring is clearly visible.
- [ ] **Target Sizes**: All interactive elements measure at least 24 by 24 CSS pixels.
- [ ] **Adaptive Preferences**: Styles respect `@media (prefers-reduced-motion: reduce)` and `@media (forced-colors: active)`.
- [ ] **TypeScript Integrity**: Source code compiles with `"strict": true`, zero errors, zero instances of `any`, and preserves the `ColumnDef<TData>` and `DataGridProps<TData>` contract.
- [ ] **Automated Testing**: 100 percent pass rate across unit and E2E tests, zero axe-core violations, and 100/100 Lighthouse Accessibility and Best Practices scores.
- [ ] **Screen Reader Validation**: Verified with NVDA, JAWS, or VoiceOver with expected header announcements and live region updates.
- [ ] **Git Cleanliness**: Commits follow Conventional Commits 1.0.0, represent small atomic changes, and contain descriptive summaries.
