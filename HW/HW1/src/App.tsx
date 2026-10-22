import type { ReactElement } from 'react';
import type { ColumnDef } from './data-grid-contract';
import { DataGrid } from './DataGrid';
import { employees, type Employee } from './sampleData';
import './App.css';

/**
 * Column definitions for the employee dataset.
 * Invariant: 4 columns mapping to Name, Department, Role, and Salary.
 */
const columns: ColumnDef<Employee>[] = [
  { header: 'Name', accessorKey: 'name', sortable: true },
  { header: 'Department', accessorKey: 'department', sortable: true },
  { header: 'Role', accessorKey: 'role', sortable: true },
  { header: 'Salary', accessorKey: 'salary', sortable: true },
];

/**
 * Main application demonstrating the accessible semantic DataGrid component.
 */
function App(): ReactElement {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Production Enterprise Data-Grid</h1>
      <DataGrid
        data={employees}
        columns={columns}
        ariaLabel="Employee directory"
      />
    </main>
  );
}

export default App;
