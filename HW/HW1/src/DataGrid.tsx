import { useMemo, useState, type ReactElement } from 'react';
import type { DataGridProps } from './data-grid-contract';
import './DataGrid.css';

type SortDirection = 'asc' | 'desc';

/**
 * DataGrid component with sorting support, semantic HTML table markup,
 * and WCAG 2.2 Level AA / ARIA grid compliant accessibility semantics.
 *
 * Invariant: Maintains strict generic types without mutating input data or changing the contract.
 */
export function DataGrid<T extends object>({
  data,
  columns,
  ariaLabel,
}: DataGridProps<T>): ReactElement {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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
   * Produces a sorted shallow copy of the data without mutating props.data.
   * Compares numbers numerically and strings using localeCompare.
   */
  const sortedData = useMemo(() => {
    if (sortKey === null) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      // Handle null or undefined values gracefully
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
  }, [data, sortKey, sortDirection]);

  return (
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
        {sortedData.map((item, rowIndex) => (
          <tr key={rowIndex} role="row">
            {columns.map((column) => (
              <td key={String(column.accessorKey)} role="gridcell">
                {String(item[column.accessorKey])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
