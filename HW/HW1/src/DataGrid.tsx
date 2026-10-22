import { useId, useMemo, useState, type ChangeEvent, type ReactElement } from 'react';
import type { DataGridProps } from './data-grid-contract';
import './DataGrid.css';

type SortDirection = 'asc' | 'desc';

/**
 * DataGrid component featuring sorting, multi-column filtering, client-side pagination,
 * semantic HTML table markup, and WCAG 2.2 Level AA / ARIA grid compliant accessibility.
 *
 * Invariant: Preserves the public contract, executes operations in order (filter -> sort -> paginate),
 * and enforces strict type safety without mutating input props.
 */
export function DataGrid<T extends object>({
  data,
  columns,
  ariaLabel,
}: DataGridProps<T>): ReactElement {
  const filterInputId = useId();
  const pageSizeSelectId = useId();

  // State management for sorting, filtering, and pagination
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterText, setFilterText] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 1. Filter: Case-insensitive match across all defined columns
  const filteredData = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    if (!query) {
      return data;
    }

    return data.filter((item) =>
      columns.some((column) => {
        const val = item[column.accessorKey];
        if (val === null || val === undefined) {
          return false;
        }
        return String(val).toLowerCase().includes(query);
      }),
    );
  }, [data, columns, filterText]);

  // 2. Sort: Produces a sorted shallow copy of the filtered dataset
  const sortedData = useMemo(() => {
    if (sortKey === null) {
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      // Gracefully handle null or undefined values
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // Numerical comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // String comparison with natural language locale sensitivity
      const aStr = String(aVal);
      const bStr = String(bVal);
      const comparison = aStr.localeCompare(bStr, undefined, { numeric: true });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Total pages calculation and page boundary clamping
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const effectivePage = Math.min(Math.max(1, currentPage), totalPages);

  // 3. Paginate: Slices sortedData according to current page and page size
  const paginatedData = useMemo(() => {
    const startIndex = (effectivePage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, effectivePage, pageSize]);

  /**
   * Updates filter query and resets page to 1.
   */
  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setFilterText(event.target.value);
    setCurrentPage(1);
  };

  /**
   * Updates page size and clamps current page within new bounds.
   */
  const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const newSize = Number(event.target.value);
    setPageSize(newSize);
    const newTotalPages = Math.max(1, Math.ceil(sortedData.length / newSize));
    setCurrentPage((prev) => Math.min(Math.max(1, prev), newTotalPages));
  };

  /**
   * Moves to previous page safely.
   */
  const handlePrevPage = (): void => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  /**
   * Moves to next page safely.
   */
  const handleNextPage = (): void => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  /**
   * Cycles sorting state: none -> asc -> desc -> asc.
   */
  const handleSort = (key: keyof T): void => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection('asc');
    } else {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    }
  };

  return (
    <div className="datagrid-wrapper" data-page={effectivePage}>
      {/* Filtering Toolbar */}
      <div className="filter-container">
        <label htmlFor={filterInputId} className="filter-label">
          Filter rows
        </label>
        <input
          id={filterInputId}
          type="search"
          value={filterText}
          onChange={handleFilterChange}
          placeholder="Search..."
          className="filter-input"
        />
        <p role="status" aria-live="polite" className="filter-status">
          {filteredData.length} rows found
        </p>
      </div>

      {/* Semantic Table Structure */}
      <table role="grid" aria-label={ariaLabel}>
        <thead>
          <tr role="row">
            {columns.map((column) => {
              const isSortable = Boolean(column.sortable);
              const isActive = sortKey === column.accessorKey;
              const ariaSortValue = isSortable
                ? isActive
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
                : undefined;

              return (
                <th
                  key={String(column.accessorKey)}
                  scope="col"
                  aria-sort={ariaSortValue}
                >
                  {isSortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column.accessorKey)}
                      className="sort-button"
                    >
                      <span>{column.header}</span>
                      {isActive ? (
                        <>
                          <span className="visually-hidden">
                            {sortDirection === 'asc' ? ' ascending' : ' descending'}
                          </span>
                          <span aria-hidden="true" className="sort-indicator">
                            {sortDirection === 'asc' ? ' ▲' : ' ▼'}
                          </span>
                        </>
                      ) : (
                        <span aria-hidden="true" className="sort-indicator-inactive">
                          {' '}
                          ↕
                        </span>
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr role="row">
              <td
                role="gridcell"
                colSpan={columns.length}
                className="no-results-cell"
              >
                No results
              </td>
            </tr>
          ) : (
            paginatedData.map((item, rowIndex) => (
              <tr key={rowIndex} role="row">
                {columns.map((column) => (
                  <td key={String(column.accessorKey)} role="gridcell">
                    {String(item[column.accessorKey])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="pagination-bar">
        <div className="page-size-selector">
          <label htmlFor={pageSizeSelectId} className="page-size-label">
            Rows per page:
          </label>
          <select
            id={pageSizeSelectId}
            value={pageSize}
            onChange={handlePageSizeChange}
            className="page-size-select"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>

        <nav aria-label="Grid pagination" className="pagination-nav">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={effectivePage <= 1}
            className="pagination-button"
          >
            Previous
          </button>
          <p role="status" aria-live="polite" className="page-status">
            Page {effectivePage} of {totalPages}
          </p>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={effectivePage >= totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  );
}
