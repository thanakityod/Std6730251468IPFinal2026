const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDatabase } = require('./config/db');
const {
  getAllEmployees,
  addEmployee,
  toggleEmployeeStatus,
  deleteEmployee
} = require('./services/dataStore');
const { kMeans1D } = require('./services/kmeans');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging for clarity
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root endpoint for health check
app.get('/', (req, res) => {
  res.json({
    message: 'HR Manager & Salary Analytics API is running',
    version: '1.0.0',
    studentId: '6730251468'
  });
});

// ==========================================
// 1.1 Backend Authentication (Login)
// POST /api/login
// Accept username and password in request body.
// Admin credentials: username=admin, password=password123
// ==========================================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'password123') {
    return res.status(200).json({
      success: true,
      token: 'mock-jwt-token'
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid username or password'
  });
});

// ==========================================
// Phase 1: Employee Management (CRUD)
// ==========================================

// [GET] /api/employees - Return all employee records
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await getAllEmployees();
    res.status(200).json(employees);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve employees' });
  }
});

// [POST] /api/employees - Add a new employee
// Must receive name, position, and salary. If any field is empty, respond with 400 Bad Request.
app.post('/api/employees', async (req, res) => {
  try {
    const { name, position, salary } = req.body;

    // Validation: check for empty or missing fields
    if (
      !name ||
      typeof name !== 'string' ||
      name.trim() === '' ||
      !position ||
      typeof position !== 'string' ||
      position.trim() === '' ||
      salary === undefined ||
      salary === null ||
      salary === '' ||
      isNaN(Number(salary)) ||
      Number(salary) < 0
    ) {
      return res.status(400).json({
        error: 'Bad Request: name, position, and a valid non-negative salary are required.'
      });
    }

    const newEmployee = await addEmployee({
      name: name.trim(),
      position: position.trim(),
      salary: Number(salary),
      status: 'Active'
    });

    res.status(201).json(newEmployee);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// [PUT] /api/employees/:id/status - Toggle employee status (Active <-> On Leave)
app.put('/api/employees/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await toggleEmployeeStatus(id);

    if (!updated) {
      return res.status(404).json({ error: `Employee with id ${id} not found` });
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle employee status' });
  }
});

// [DELETE] /api/employees/:id - Remove employee from the system
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteEmployee(id);

    if (!deleted) {
      return res.status(404).json({ error: `Employee with id ${id} not found` });
    }

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
      deleted
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// ==========================================
// Phase 2: Automated Salary Clustering (K-Means)
// GET /api/employees/salary-clusters
// 1D K-Means Clustering algorithm (k=3)
// ==========================================
app.get('/api/employees/salary-clusters', async (req, res) => {
  try {
    const employees = await getAllEmployees();
    const salaries = employees.map(emp => Number(emp.salary));

    const clusters = kMeans1D(salaries, 3);

    res.status(200).json({
      success: true,
      clusters
    });
  } catch (err) {
    console.error('Clustering error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate salary clusters'
    });
  }
});

// Start Server
async function startServer() {
  await initDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend server is running at http://localhost:${PORT}`);
    console.log(`   Phase 1 API: POST /api/login, GET/POST/PUT/DELETE /api/employees`);
    console.log(`   Phase 2 API: GET /api/employees/salary-clusters`);
  });
}

startServer();
