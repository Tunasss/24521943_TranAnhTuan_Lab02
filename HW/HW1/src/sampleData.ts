/**
 * Employee data structure representing an individual enterprise workforce record.
 */
export interface Employee {
  id: number;
  name: string;
  department: string;
  role: string;
  salary: number;
}

/**
 * Sample dataset containing 35 realistic employee records with unique identifiers,
 * varied departments, and compensation details for testing sorting, filtering, and pagination.
 */
export const employees: Employee[] = [
  { id: 1, name: 'Alice Johnson', department: 'Engineering', role: 'Staff Software Engineer', salary: 145000 },
  { id: 2, name: 'Bob Smith', department: 'Marketing', role: 'Growth Marketing Manager', salary: 98000 },
  { id: 3, name: 'Carol Williams', department: 'Product Management', role: 'Principal Product Manager', salary: 152000 },
  { id: 4, name: 'David Brown', department: 'Human Resources', role: 'People Operations Lead', salary: 88000 },
  { id: 5, name: 'Eva Davis', department: 'Engineering', role: 'Frontend Engineer', salary: 115000 },
  { id: 6, name: 'Frank Miller', department: 'Finance', role: 'Financial Controller', salary: 125000 },
  { id: 7, name: 'Grace Wilson', department: 'Design', role: 'Lead Product Designer', salary: 128000 },
  { id: 8, name: 'Henry Taylor', department: 'Customer Success', role: 'Customer Success Specialist', salary: 72000 },
  { id: 9, name: 'Ivy Anderson', department: 'Engineering', role: 'Site Reliability Engineer', salary: 132000 },
  { id: 10, name: 'Jack Thomas', department: 'Sales', role: 'Enterprise Account Executive', salary: 110000 },
  { id: 11, name: 'Karen Jackson', department: 'Product Management', role: 'Technical Product Manager', salary: 138000 },
  { id: 12, name: 'Leo White', department: 'Engineering', role: 'Backend Systems Engineer', salary: 122000 },
  { id: 13, name: 'Mia Harris', department: 'Finance', role: 'Senior Financial Analyst', salary: 95000 },
  { id: 14, name: 'Nathan Martin', department: 'Marketing', role: 'Content Marketing Strategist', salary: 82000 },
  { id: 15, name: 'Olivia Thompson', department: 'Design', role: 'User Experience Researcher', salary: 105000 },
  { id: 16, name: 'Peter Garcia', department: 'Customer Success', role: 'Technical Support Engineer', salary: 78000 },
  { id: 17, name: 'Quinn Martinez', department: 'Operations', role: 'Business Operations Manager', salary: 118000 },
  { id: 18, name: 'Rachel Robinson', department: 'Engineering', role: 'Quality Assurance Lead', salary: 108000 },
  { id: 19, name: 'Samuel Clark', department: 'Sales', role: 'Sales Development Representative', salary: 65000 },
  { id: 20, name: 'Tina Rodriguez', department: 'Legal', role: 'Corporate Counsel', salary: 160000 },
  { id: 21, name: 'Umar Lewis', department: 'Engineering', role: 'Security Engineer', salary: 140000 },
  { id: 22, name: 'Victoria Lee', department: 'Human Resources', role: 'Talent Acquisition Partner', salary: 85000 },
  { id: 23, name: 'William Walker', department: 'Finance', role: 'Payroll Specialist', salary: 70000 },
  { id: 24, name: 'Xena Hall', department: 'Product Management', role: 'Associate Product Manager', salary: 92000 },
  { id: 25, name: 'Yusuf Allen', department: 'Engineering', role: 'Data Platform Engineer', salary: 135000 },
  { id: 26, name: 'Zoe Young', department: 'Design', role: 'Visual Designer', salary: 90000 },
  { id: 27, name: 'Aaron King', department: 'Marketing', role: 'Product Marketing Director', salary: 165000 },
  { id: 28, name: 'Bella Wright', department: 'Customer Success', role: 'Director of Customer Experience', salary: 142000 },
  { id: 29, name: 'Caleb Scott', department: 'Sales', role: 'Regional Sales Manager', salary: 130000 },
  { id: 30, name: 'Diana Torres', department: 'Legal', role: 'Compliance Specialist', salary: 96000 },
  { id: 31, name: 'Ethan Nguyen', department: 'Engineering', role: 'DevOps Engineer', salary: 126000 },
  { id: 32, name: 'Fiona Hill', department: 'Human Resources', role: 'HR Business Partner', salary: 102000 },
  { id: 33, name: 'George Adams', department: 'Operations', role: 'Supply Chain Analyst', salary: 87000 },
  { id: 34, name: 'Hannah Baker', department: 'Engineering', role: 'Mobile Software Engineer', salary: 120000 },
  { id: 35, name: 'Ian Nelson', department: 'Finance', role: 'Tax Accounting Lead', salary: 115000 },
];
