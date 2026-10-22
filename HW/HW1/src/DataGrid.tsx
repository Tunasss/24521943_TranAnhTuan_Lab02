import {
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import type { DataGridProps } from './data-grid-contract';
import './DataGrid.css';

type SortDirection = 'asc' | 'desc';

interface ActiveCellCoordinate {
  row: number;
  col: number;
}

/**
 * DataGrid component with roving tabindex keyboard navigation, sorting,
 * filtering, pagination, semantic HTML, and ARIA grid role semantics.
 *
 * Invariant: Preserves the public contract, maintains generic typing without any,
 * and manages focus exclusively via React refs (no querySelector).
 */
export function DataGrid<T extends object>({
  data,
  columns,
  onRowSelect,
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

  // Keyboard navigation & row selection states
  const [activeCell, setActiveCell] = useState<ActiveCellCoordinate>({ row: 0, col: 0 });
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string | number>>(new Set());

  // React ref storage for body cell elements (keyed by "rowIndex-colIndex")
  const cellRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());

  const getCellKey = (rowIndex: number, colIndex: number): string =>
    `${rowIndex}-${colIndex}`;

  const setCellRef =
    (rowIndex: number, colIndex: number) =>
    (element: HTMLTableCellElement | null): void => {
      const key = getCellKey(rowIndex, colIndex);
      if (element) {
        cellRefs.current.set(key, element);
      } else {
        cellRefs.current.delete(key);
      }
    };

  /**
   * Helper extracting a stable identifier for each record to prevent selection drift.
   */
  const getRowKey = (item: T, fallbackIndex: number): string | number => {
    if ('id' in item && (typeof item.id === 'string' || typeof item.id === 'number')) {
      return item.id;
    }
    return fallbackIndex;
  };

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

  // Derived clamped active cell coordinates to prevent overflow without cascading renders
  const clampedRow =
    paginatedData.length === 0
      ? 0
      : Math.min(Math.max(0, activeCell.row), paginatedData.length - 1);
  const clampedCol =
    columns.length === 0
      ? 0
      : Math.min(Math.max(0, activeCell.col), columns.length - 1);
  const currentActiveCell: ActiveCellCoordinate = {
    row: clampedRow,
    col: clampedCol,
  };

  /**
   * Updates filter query and resets page to 1.
   */
  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setFilterText(event.target.value);
    setCurrentPage(1);
    setActiveCell({ row: 0, col: 0 });
  };

  /**
   * Updates page size and clamps current page within new bounds.
   */
  const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const newSize = Number(event.target.value);
    setPageSize(newSize);
    const newTotalPages = Math.max(1, Math.ceil(sortedData.length / newSize));
    setCurrentPage((prev) => Math.min(Math.max(1, prev), newTotalPages));
    setActiveCell({ row: 0, col: 0 });
  };

  /**
   * Moves to previous page safely.
   */
  const handlePrevPage = (): void => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    setActiveCell({ row: 0, col: 0 });
  };

  /**
   * Moves to next page safely.
   */
  const handleNextPage = (): void => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    setActiveCell({ row: 0, col: 0 });
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
   * Two-dimensional keyboard navigation handling roving tabindex across grid cells.
   * Prevents default browser scroll on handled keys and focuses the new cell using React refs.
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLTableSectionElement>): void => {
    const rowCount = paginatedData.length;
    const colCount = columns.length;

    if (rowCount === 0) {
      return;
    }

    let nextRow = currentActiveCell.row;
    let nextCol = currentActiveCell.col;

    switch (event.key) {
      case 'ArrowUp':
        nextRow = Math.max(0, currentActiveCell.row - 1);
        break;
      case 'ArrowDown':
        nextRow = Math.min(rowCount - 1, currentActiveCell.row + 1);
        break;
      case 'ArrowLeft':
        nextCol = Math.max(0, currentActiveCell.col - 1);
        break;
      case 'ArrowRight':
        nextCol = Math.min(colCount - 1, currentActiveCell.col + 1);
        break;
      case 'Home':
        nextCol = 0;
        break;
      case 'End':
        nextCol = colCount - 1;
        break;
      case 'Enter': {
        const activeItem = paginatedData[currentActiveCell.row];
        if (activeItem && onRowSelect) {
          onRowSelect(activeItem);
        }
        event.preventDefault();
        return;
      }
      case ' ': {
        const activeItem = paginatedData[currentActiveCell.row];
        if (activeItem) {
          const rowId = getRowKey(activeItem, currentActiveCell.row);
          setSelectedRowIds((prev) => {
            const next = new Set(prev);
            if (next.has(rowId)) {
              next.delete(rowId);
            } else {
              next.add(rowId);
            }
            return next;
          });
        }
        event.preventDefault();
        return;
      }
      default:
        return;
    }

    event.preventDefault();
    setActiveCell({ row: nextRow, col: nextCol });
    const targetCell = cellRefs.current.get(getCellKey(nextRow, nextCol));
    targetCell?.focus();
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
        <tbody onKeyDown={handleKeyDown}>
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
            paginatedData.map((item, rowIndex) => {
              const rowId = getRowKey(item, rowIndex);
              const isSelected = selectedRowIds.has(rowId);

              return (
                <tr
                  key={String(rowId)}
                  role="row"
                  aria-selected={isSelected}
                  className={isSelected ? 'selected-row' : undefined}
                >
                  {columns.map((column, colIndex) => {
                    const isActive =
                      rowIndex === currentActiveCell.row &&
                      colIndex === currentActiveCell.col;

                    return (
                      <td
                        key={String(column.accessorKey)}
                        ref={setCellRef(rowIndex, colIndex)}
                        role="gridcell"
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => {
                          setActiveCell({ row: rowIndex, col: colIndex });
                          cellRefs.current.get(getCellKey(rowIndex, colIndex))?.focus();
                        }}
                        onFocus={() => {
                          setActiveCell({ row: rowIndex, col: colIndex });
                        }}
                      >
                        {String(item[column.accessorKey])}
                      </td>
                    );
                  })}
                </tr>
              );
            })
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
