import { useId, useMemo, useState, type ChangeEvent, type ReactElement } from 'react';
import type { DataGridProps } from './data-grid-contract';
import './DataGrid.css';

type SortDirection = 'asc' | 'desc';

/**
 * DataGrid component with sorting, multi-column filtering, semantic HTML table markup,
 * and WCAG 2.2 Level AA / ARIA grid compliant accessibility semantics.
 *
 * Invariant: Preserves the public contract and enforces generic type safety without mutating input props.
 */
export function DataGrid<T extends object>({
  data,
  columns,
  ariaLabel,
}: DataGridProps<T>): ReactElement {
  const filterInputId = useId();

  // State management for sorting, filtering, and pagination
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterText, setFilterText] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  /**
   * Updates filter query and resets pagination back to page 1.
   */
  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setFilterText(event.target.value);
    setCurrentPage(1);
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

  /**
   * Filters records case-insensitively across all defined columns.
   */
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

  /**
   * Produces a sorted shallow copy of the filtered dataset without mutating input data.
   * Compares numbers numerically and strings using localeCompare.
   */
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

  return (
    <div className="datagrid-wrapper" data-page={currentPage}>
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
          {sortedData.length === 0 ? (
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
            sortedData.map((item, rowIndex) => (
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
    </div>
  );
}
