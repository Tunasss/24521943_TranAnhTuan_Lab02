import type { ReactElement } from 'react';
import type { DataGridProps } from './data-grid-contract';

/**
 * DataGrid component rendering a purely semantic, accessible HTML table structure
 * with Accessible Rich Internet Applications (ARIA) grid roles.
 *
 * Invariant: Maintains native table architecture without div or span structural wrappers.
 */
export function DataGrid<T extends object>({
  data,
  columns,
  ariaLabel,
}: DataGridProps<T>): ReactElement {
  return (
    <table role="grid" aria-label={ariaLabel}>
      <thead>
        <tr role="row">
          {columns.map((column) => (
            <th key={String(column.accessorKey)} scope="col">
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, rowIndex) => (
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
