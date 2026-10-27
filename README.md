## Personal copy maintained by Tanush Rai

This repository is a copy of StaffSync originally published at https://github.com/jainsarthak-cloud/staffsync. Original project structure and implementation are retained; see the source repository for original authorship and licensing.

---

# 🏢 StaffSync — Enterprise Workforce, HRMS & Payroll Suite

> A modern, full-stack **MERN** (MongoDB, Express, React, Node.js) Enterprise Workforce Management and Human Resources System designed for high-performing teams.

---

## 🌟 Key Highlights & Stand-out Features

1. **Role-Based Access Control (RBAC)**:
   - 3 distinct personas: **Admin / HR**, **Manager**, **Employee**.
   - Dual-layer protection: Secure backend JWT middleware (`verifyToken`, `authorizeRoles`) & frontend route guards with 1-click **Quick Login** buttons on the login portal.
2. **Interactive Biometric Clock Widget**:
   - Real-time digital clock, shift duration timer, live check-in and check-out.
   - Automatic detection of **Late arrivals** (after 9:30 AM cutoff) and **Half-day shifts** (< 4.5 hours worked).
3. **Admin Attendance Roster & CSV Export**:
   - Filter attendance by date, status, and department.
   - Instant 1-click **Export to CSV** for payroll reconciliation and compliance reporting.
4. **Automated Leave Balance & Approval Workflow**:
   - Multi-tier leaves: **Casual (12d)**, **Sick (10d)**, **Paid (18d)**, and Unpaid.
   - Balance verification on submission, manager review modal with comment notes, and automatic balance deduction upon approval.
   - Interactive **Team Leave Calendar** showing who is out of office.
5. **Payroll Engine & Professional PDF Payslips**:
   - Comprehensive salary breakdown: Basic, HRA, Allowances, PF deduction, TDS/Tax, and Net Take-Home Pay.
   - 1-click **Monthly Batch Generator** for all active employees.
   - High-fidelity **PDF Payslip Generation** (both server-side streaming via `pdfkit` and client-side instant generation via `jspdf` & `jspdf-autotable`).
6. **Recruitment Tracker with Interactive Kanban Board**:
   - Visual candidate pipeline: `Applied` ➔ `Screening` ➔ `Interview` ➔ `Offer` ➔ `Hired`.
   - Stage-shift dropdowns, interview assessment notes, and **1-Click Convert Candidate to Employee** (with confetti celebration 🎉!).
7. **Notice Board & Broadcast System**:
   - Priority-tagged company announcements (`Urgent`, `High`, `Medium`, `Low`), department targeting, pin to top, and email dispatch integration (`nodemailer`).
8. **Immutable Security & Audit Trail**:
   - Enterprise activity logging tracking actor, action, timestamp, entity type, details, and client IP address.
9. **Dark & Light Mode UI**:
   - Styled with Tailwind CSS v4, Lucide React icons, and Recharts executive dashboards.

---

## 👥 Demo Accounts (1-Click Login)

The login screen features pre-configured persona buttons to test all roles immediately:

| Persona | Email | Password | Role Permissions |
| :--- | :--- | :--- | :--- |
| **Admin / HR** | `admin@staffsync.com` | `Password123!` | Full control: Employee CRUD, Batch Payroll, Approvals, Recruitment, Notice Board, Audit Trail |
| **Manager** | `manager@staffsync.com` | `Password123!` | Department head: Team attendance, Leave approvals, Recruitment Kanban, Notice Board |
| **Employee** | `employee@staffsync.com` | `Password123!` | Self-service: Clock in/out, Personal shift history, Apply leave, Download payslips |

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19 (Vite) | Lightning-fast reactive interface |
| **Styling & Icons** | Tailwind CSS v4, Lucide React | Modern responsive design with Dark/Light theme |
| **Routing & State** | React Router v7, React Context | Role-guarded SPA navigation |
| **Visualizations** | Recharts | Headcount donuts & 7-day attendance trends |
| **Backend** | Node.js, Express | Modular RESTful API |
| **Database** | MongoDB & Mongoose | Schemas with compound indexing & virtuals |
| **Authentication** | JWT (Access & Refresh) & bcryptjs | Secure stateless authentication |
| **Document Generation**| PDFKit & jsPDF / AutoTable | Enterprise PDF payslip creation |
| **Notifications** | Nodemailer | Announcement broadcast dispatch |

---

## 📁 Project Architecture

```
staffsync/
├── package.json               # Root scripts (starts both server and client)
├── run-dev.js                 # Cross-platform parallel dev runner
├── client/                    # Vite + React 19 Frontend
│   ├── src/
│   │   ├── api/               # Axios instance with Bearer interceptors
│   │   ├── components/        # Navbar, Sidebar, StatCard, Modal, Toast, ClockWidget
│   │   ├── context/           # AuthContext (RBAC) & ThemeContext (Dark/Light)
│   │   ├── pages/             # Dashboard, Employees, Attendance, Leaves, Payroll, Recruitment, etc.
│   │   ├── App.jsx            # Protected routes & role authorization
│   │   └── index.css          # Tailwind CSS v4 imports
│   └── vite.config.js         # Vite config with API proxy to port 5000
└── server/                    # Node.js + Express API
    ├── config/                # MongoDB Mongoose connection
    ├── controllers/           # Auth, Employee, Attendance, Leave, Payroll, Dashboard, etc.
    ├── middleware/            # verifyToken, authorizeRoles, errorHandler
    ├── models/                # User, Employee, Attendance, Leave, Payroll, Candidate, AuditLog, etc.
    ├── routes/                # Modular REST route endpoints
    ├── utils/                 # PDF generator, database seeder, audit logger
    └── server.js              # Express app bootstrap & auto-seeding
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **MongoDB** (Local `mongodb://127.0.0.1:27017/staffsync` OR free MongoDB Atlas URI)

### 2. Setup & Configuration

Configure `server/.env` (pre-created with defaults):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/staffsync
JWT_SECRET=staffsync_enterprise_jwt_super_secure_secret_2026!
JWT_REFRESH_SECRET=staffsync_refresh_enterprise_secure_token_key_2026!
CLIENT_URL=http://localhost:5173
```
*(If using MongoDB Atlas, replace `MONGO_URI` with your connection string: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/staffsync?retryWrites=true&w=majority`)*

### 3. Start Both Backend & Frontend

From the root directory:
```bash
npm run dev
```

Alternatively, run in separate terminals:
```bash
# Terminal 1: Backend API (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend Client (Port 5173)
cd client
npm run dev
```

### 4. Seed Enterprise Demo Data
The backend automatically provisions realistic seed data on first launch! To re-seed at any time:
```bash
npm run seed
```
Or trigger `POST http://localhost:5000/api/seed`.

---

## 📑 Core API Endpoints

### Authentication
- `POST /api/auth/register` — Register employee/user account
- `POST /api/auth/login` — Login & receive JWT access + refresh token
- `POST /api/auth/refresh` — Refresh access token
- `GET /api/auth/me` — Retrieve active profile & employee mapping
- `POST /api/auth/logout` — Revoke token session

### Employees
- `GET /api/employees` — Search, filter by department/status, and paginate
- `POST /api/employees` — Add employee with salary structure (Admin/Manager)
- `GET /api/employees/:id` — Full profile with documents & reporting hierarchy
- `PUT /api/employees/:id` — Update employee data
- `PATCH /api/employees/:id/status` — Activate or deactivate employee
- `POST /api/employees/:id/documents` — Attach HR document record

### Attendance & Shifts
- `POST /api/attendance/check-in` — Clock in shift (auto-detects late arrivals)
- `POST /api/attendance/check-out` — Clock out shift (calculates hours & half-days)
- `GET /api/attendance/today` — Current employee status today
- `GET /api/attendance/my` — Employee shift history & summary counters
- `GET /api/attendance/admin-report` — Company-wide attendance logs
- `GET /api/attendance/export-csv` — Download shift report as CSV file

### Leave Management
- `POST /api/leaves/apply` — Apply for leave with balance check
- `GET /api/leaves/my` — Personal leave history & balance meters
- `GET /api/leaves/all` — Pending & historical requests (Manager/Admin)
- `PATCH /api/leaves/:id/review` — Approve/Reject leave with auto balance deduction
- `GET /api/leaves/team-calendar` — Approved team out-of-office calendar

### Payroll & Payslips
- `GET /api/payroll/summary` — Executive monthly payroll KPI totals
- `GET /api/payroll/all` — All employee payslips for selected month/year
- `GET /api/payroll/my` — Employee's individual payslips
- `POST /api/payroll/generate-batch` — Batch generate all payslips for a given month
- `GET /api/payroll/:id/download-pdf` — Stream PDF payslip from backend

### Dashboard & Analytics
- `GET /api/dashboard/metrics` — Aggregated KPI metrics, Recharts charts, birthdays, and anniversaries

### Recruitment Kanban
- `GET /api/recruitment/jobs` & `POST /api/recruitment/jobs` — Job openings
- `GET /api/recruitment/candidates` & `POST /api/recruitment/candidates` — Candidate pipeline
- `PATCH /api/recruitment/candidates/:id/stage` — Shift candidate stage along Kanban board
- `POST /api/recruitment/candidates/:id/convert-to-employee` — 1-click hire & convert to full employee

### Notice Board & Audit Logs
- `GET /api/announcements` & `POST /api/announcements` — Priority broadcasts
- `GET /api/audit` — Immutable audit log trail with entity filters
