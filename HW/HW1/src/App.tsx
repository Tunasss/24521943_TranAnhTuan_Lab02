import { useState, type ReactElement } from 'react';
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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Production Enterprise Data-Grid</h1>
      {selectedEmployee && (
        <aside
          role="region"
          aria-live="polite"
          style={{
            margin: '1rem 0',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--code-bg, #f4f3ec)',
            borderRadius: '6px',
            border: '1px solid var(--border, #e5e4e7)',
            textAlign: 'left',
          }}
        >
          <strong>Active Selection:</strong> {selectedEmployee.name} ({selectedEmployee.role} in{' '}
          {selectedEmployee.department})
        </aside>
      )}
      <DataGrid
        data={employees}
        columns={columns}
        onRowSelect={(item) => setSelectedEmployee(item)}
        ariaLabel="Employee directory"
      />
    </main>
  );
}

export default App;
