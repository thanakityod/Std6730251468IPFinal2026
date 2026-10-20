# Final Exam: Internet Programming (2026)
## Topic: HR Manager & Salary Analytics System
**Student ID:** `6730251468`  
**Repository Name:** `Std6730251468IPFinal2026`  

---

## 📁 Project Architecture & Directory Structure
```
Std6730251468IPFinal2026/
├── backend/                  # Express.js REST API
│   ├── config/
│   │   └── db.js             # MySQL connection pool with automatic in-memory fallback
│   ├── services/
│   │   ├── dataStore.js      # Employee data management (in-memory & MySQL synced)
│   │   └── kmeans.js         # 1D K-Means Clustering algorithm (k=3)
│   ├── database.sql          # SQL schema & mock data for database ip_std6730251468
│   ├── test-api.js           # Automated test suite verifying all 8 exam criteria
│   ├── server.js             # Express application endpoints
│   ├── package.json
│   └── .env
└── frontend/                 # React Native (Expo) Application
    ├── App.js                # Full UI (Login, CRUD Dashboard, K-Means Modal)
    ├── app.json
    ├── babel.config.js
    ├── index.js
    └── package.json
```

---

## 🛠️ How to Run the Project

### 1. Start the Backend Server (Express.js)
```bash
cd backend
npm install
npm start
```
The server will start at: `http://localhost:5000`

> **Note on Storage:**
> As specified in the exam requirements (*"All data will be stored in the server's memory (In-memory array)"*), the backend runs immediately out-of-the-box in In-Memory mode. If external MySQL credentials are provided in `.env`, it automatically uses MySQL!

### 2. Verify Backend API (Automated Unit Tests)
```bash
cd backend
node test-api.js
```
This script tests:
1. Valid Login (`POST /api/login` -> 200 OK with token)
2. Invalid Login (`POST /api/login` -> 401 Unauthorized)
3. Read all employees (`GET /api/employees` -> 200 OK)
4. Input validation (`POST /api/employees` with empty field -> 400 Bad Request)
5. Create employee (`POST /api/employees` -> 201 Created)
6. Status Toggle (`PUT /api/employees/:id/status` -> 200 OK)
7. K-Means Clustering (`GET /api/employees/salary-clusters` -> 200 OK with 3 Tiers)
8. Delete Employee (`DELETE /api/employees/:id` -> 200 OK)

### 3. Start the Frontend App (React Native / Expo)
```bash
cd frontend
npm install
npm start
```
- Press `w` in the terminal to open in Web Browser.
- Or scan the QR code using **Expo Go** on iOS / Android.

---

## 📋 Features Overview

### Phase 1: Authentication & Employee Management
- **Authentication:** `POST /api/login`
  - **Username:** `admin`
  - **Password:** `password123`
  - Returns `{"success": true, "token": "mock-jwt-token"}` on success.
  - Returns Status 401 on incorrect credentials.
- **Mock Data Structure:** Pre-populated with 6 realistic employee records:
  ```json
  {
    "id": "1",
    "name": "John Doe",
    "position": "Software Engineer",
    "status": "Active",
    "salary": 45000
  }
  ```
- **CRUD Endpoints:**
  - `GET /api/employees` - List all employees.
  - `POST /api/employees` - Add new employee (validates empty fields with 400 Bad Request).
  - `PUT /api/employees/:id/status` - Toggles employee status between `Active` and `On Leave`.
  - `DELETE /api/employees/:id` - Deletes employee.
- **Frontend Client-side Handling:**
  - Input form validation (blocks submission with alert if fields are empty).
  - Delete Confirmation Alert (`"Are you sure?"`) before dispatching delete request.
  - Automatic UI refresh upon adding, toggling, or deleting.

---

### Phase 2: Automated Salary Clustering (K-Means Analytics)
- **Endpoint:** `GET /api/employees/salary-clusters`
- **Algorithm:** Custom 1D K-Means Clustering ($k=3$) grouping salaries into 3 tiers (Tier 1, Tier 2, Tier 3) by centroid distance convergence.
- **Response Format:**
  ```json
  {
    "success": true,
    "clusters": [
      { "group": "Tier 1", "centroid": 20500, "count": 2 },
      { "group": "Tier 2", "centroid": 45000, "count": 4 },
      { "group": "Tier 3", "centroid": 95000, "count": 1 }
    ]
  }
  ```
- **Frontend Analytics UI:**
  - "Analyze Salary Structure" button on Dashboard.
  - Displays `ActivityIndicator` (loading state) while awaiting backend response.
  - Renders 3 summary cards showcasing Tier name, employee count, and average base salary (centroid).

---

## 🗄️ Database Integration (phpMyAdmin)
- **Database Name:** `ip_std6730251468`
- **phpMyAdmin URL:** `http://119.59.102.161/nindamdb/index.php?route=/database/structure&db=ip_std6730251468`
- A ready-to-import SQL script is located at:
  `backend/database.sql`
- You can import this file directly in phpMyAdmin under the database `ip_std6730251468`.
