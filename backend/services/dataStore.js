const { getPool } = require('../config/db');

// In-memory employee array initialized with 6 realistic employees across 3 distinct salary ranges
let mockEmployees = [
  { id: "1", name: "John Doe", position: "Software Engineer", status: "Active", salary: 45000 },
  { id: "2", name: "Jane Smith", position: "Senior Project Manager", status: "Active", salary: 58000 },
  { id: "3", name: "Bob Johnson", position: "Junior QA Specialist", status: "Active", salary: 22000 },
  { id: "4", name: "Alice Williams", position: "UI/UX Designer", status: "On Leave", salary: 42000 },
  { id: "5", name: "Charlie Brown", position: "VP of Engineering", status: "Active", salary: 95000 },
  { id: "6", name: "David Miller", position: "IT Support Technician", status: "Active", salary: 19000 }
];

async function getAllEmployees() {
  const pool = getPool();
  if (pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM employees ORDER BY id ASC');
      return rows.map(r => ({
        id: String(r.id),
        name: r.name,
        position: r.position,
        status: r.status,
        salary: Number(r.salary)
      }));
    } catch (err) {
      console.warn('Database query error, returning memory array:', err.message);
    }
  }
  return mockEmployees;
}

async function getEmployeeById(id) {
  const pool = getPool();
  if (pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM employees WHERE id = ?', [id]);
      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: String(r.id),
          name: r.name,
          position: r.position,
          status: r.status,
          salary: Number(r.salary)
        };
      }
      return null;
    } catch (err) {
      console.warn('Database query error:', err.message);
    }
  }
  return mockEmployees.find(e => String(e.id) === String(id)) || null;
}

async function addEmployee({ name, position, salary, status = 'Active' }) {
  const numericSalary = Number(salary);
  const cleanStatus = status === 'On Leave' ? 'On Leave' : 'Active';

  const pool = getPool();
  if (pool) {
    try {
      const [result] = await pool.query(
        'INSERT INTO employees (name, position, status, salary) VALUES (?, ?, ?, ?)',
        [name, position, cleanStatus, numericSalary]
      );
      const newEmp = {
        id: String(result.insertId),
        name,
        position,
        status: cleanStatus,
        salary: numericSalary
      };
      // Keep in-memory in sync
      mockEmployees.push(newEmp);
      return newEmp;
    } catch (err) {
      console.warn('Database insert error, saving to memory:', err.message);
    }
  }

  // Next ID generation for in-memory
  const nextId = mockEmployees.length > 0 
    ? String(Math.max(...mockEmployees.map(e => Number(e.id) || 0)) + 1)
    : "1";

  const newEmp = {
    id: nextId,
    name,
    position,
    status: cleanStatus,
    salary: numericSalary
  };

  mockEmployees.push(newEmp);
  return newEmp;
}

async function toggleEmployeeStatus(id) {
  const emp = await getEmployeeById(id);
  if (!emp) return null;

  const newStatus = emp.status === 'Active' ? 'On Leave' : 'Active';

  const pool = getPool();
  if (pool) {
    try {
      await pool.query('UPDATE employees SET status = ? WHERE id = ?', [newStatus, id]);
    } catch (err) {
      console.warn('Database update error:', err.message);
    }
  }

  // Update in-memory
  const memEmp = mockEmployees.find(e => String(e.id) === String(id));
  if (memEmp) {
    memEmp.status = newStatus;
    return memEmp;
  }

  emp.status = newStatus;
  return emp;
}

async function deleteEmployee(id) {
  const emp = await getEmployeeById(id);
  if (!emp) return null;

  const pool = getPool();
  if (pool) {
    try {
      await pool.query('DELETE FROM employees WHERE id = ?', [id]);
    } catch (err) {
      console.warn('Database delete error:', err.message);
    }
  }

  // Remove from in-memory
  const index = mockEmployees.findIndex(e => String(e.id) === String(id));
  if (index !== -1) {
    const deleted = mockEmployees.splice(index, 1)[0];
    return deleted;
  }

  return emp;
}

module.exports = {
  getAllEmployees,
  getEmployeeById,
  addEmployee,
  toggleEmployeeStatus,
  deleteEmployee,
  mockEmployees
};
