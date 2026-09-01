# EduCloud — Multi-Tenant School & College Data Management Platform

A modern, production-grade **Multi-Tenant School Data Management System** with role-based portals built with **Node.js, Express, MongoDB (Mongoose), ExcelJS**, and a cross-platform **Flutter** responsive frontend (Mobile, Tablet, Desktop & Web).

---

## 🌟 Key Architecture & Features

### 1. Multi-Tenant Isolation
- **Tenant Scoping at Query Level**: Each school is an isolated tenant identified by unique school codes (e.g. `GWH2025`, `SXA2025`, `DPS2025`).
- **Overlapping Admission Numbers**: Compound index `{ schoolId: 1, admissionNumber: 1 }` guarantees that admission numbers (e.g. `ADM-001`) are unique within a school while allowing multiple schools to use matching identifier schemes without collisions.
- **Role Hierarchy**:
  - `super_admin`: Full multi-tenant governance, dashboard analytics, school creation/activation, users management, and multi-sheet Excel workbook export.
  - `school_admin`: Scoped strictly to their own school's student records, bulk verify/reject, and single school Excel export.
  - `student`: Scoped to submitting student records, offline-friendly draft caching, and status tracking.

### 2. Excel Generation Engine (`exceljs`)
- **Multi-Sheet Master Workbook**: Sheet 1 features an executive **Overview & Summary** tab with school-by-school stats, followed by individual sanitized worksheets (max 31 chars) formatted per school tenant.
- **Single-School Export**: Dark-themed navy headers, bold fonts, frozen header panes, auto-fitted column widths, zebra striping, and status color coding (Green for Verified, Amber for Pending, Red for Rejected).
- **Custom Filtered Export**: Export filtered subsets by Class, Section, or Status.
- **Audit Logging**: Every export operation is recorded in `ExportHistory` with file size, record count, and timestamp.

### 3. Student / School Portal
- **4-Step Data Entry Wizard**:
  - Step 1: Basic identity, class placement, DOB date picker, gender.
  - Step 2: Parent/guardian contact numbers, email, residential address.
  - Step 3: Photo URL & document verification proofs with instant sample previews.
  - Step 4: Full summary review and declaration checkbox.
- **Offline Draft Caching**: Form inputs automatically persist to local storage as you type and restore on reload.
- **My Submissions Screen**: Filter by status pills, live search, and edit pending/rejected submissions.

### 4. Admin Portal (Super Admin & School Admin)
- **KPI Metrics Dashboard**: Registered schools, total students, verified admissions, pending review cards.
- **30-Day Submission Trends Chart**: Interactive charts powered by `fl_chart`.
- **Schools Tenant Directory**: Searchable cards with live student statistics and 1-click export triggers.
- **Sticky-Header Data Table**: Checkbox multi-select, bulk verify/reject actions, and student detail inspection modal.
- **Excel Export Center**: One-click downloads for master workbooks and scoped sheets.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (tested on v26)
- **MongoDB**: Active MongoDB instance (e.g. `mongodb://localhost:27017`)
- **Flutter SDK**: v3.x+ with Dart 3.x+

---

### Step 1: Backend Setup & Seeding

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Populate database with sample schools, users, and realistic student records:
```bash
npm run seed
```

4. Start the backend API server:
```bash
npm start
```
*The server will start on `http://localhost:5050` with health check at `http://localhost:5050/api/health`.*

---

### Step 2: Flutter Frontend Setup & Run

1. Navigate to the Flutter app directory:
```bash
cd flutter_app
```

2. Fetch dependencies:
```bash
flutter pub get
```

3. Launch on Flutter Web:
```bash
flutter run -d chrome
# Or to run on web server:
flutter run -d web-server --web-port 8080
```

4. Launch on macOS Desktop or Mobile:
```bash
flutter run -d macos
# Or iOS / Android:
flutter run
```

---

## 🔑 Demo Login Credentials (Pre-Seeded)

The login screen features **1-Tap Quick Autofill** pills for each role:

| Role | Email | Password | Scope |
|---|---|---|---|
| **Super Admin** | `admin@platform.com` | `admin123` | All platform schools & tenants |
| **School Admin (Greenwood High)** | `admin@greenwood.edu` | `password123` | Greenwood High (`GWH2025`) |
| **Student Staff (Greenwood High)** | `student@greenwood.edu` | `password123` | Greenwood High (`GWH2025`) |
| **School Admin (St. Xavier's)** | `admin@stxaviers.edu` | `password123` | St. Xavier's (`SXA2025`) |
| **School Admin (Delhi Public School)** | `admin@dpsglobal.edu` | `password123` | Delhi Public School (`DPS2025`) |

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register-school` — Register new school tenant + school admin
- `POST /api/auth/register-student` — Register student under a school code
- `POST /api/auth/login` — Sign in and receive JWT access & refresh tokens
- `POST /api/auth/refresh-token` — Renew access token
- `GET  /api/auth/me` — Current user profile with tenant info

### Student Records (Tenant-Scoped)
- `POST   /api/students` — Create student record
- `GET    /api/students` — List student records (search, filters, pagination)
- `GET    /api/students/my-submissions` — List current user's submitted records
- `GET    /api/students/:id` — Get single student record
- `PATCH  /api/students/:id` — Update draft or pending record
- `DELETE /api/students/:id` — Delete record
- `PATCH  /api/students/:id/status` — Approve/verify or reject with reason
- `PATCH  /api/students/bulk/status` — Bulk approve or reject records

### Schools Management (Super Admin)
- `GET  /api/schools` — List all schools with aggregated statistics
- `GET  /api/schools/by-code/:code` — Public school code lookup
- `GET  /api/schools/:id` — School details
- `POST /api/schools` — Create new school tenant

### Excel Data Exports
- `GET /api/export/school/:schoolId/xlsx` — Single school styled Excel download
- `GET /api/export/all/xlsx` — All schools multi-sheet master workbook (.xlsx)
- `GET /api/export/filtered/xlsx` — Scoped filtered Excel export
- `GET /api/export/history` — Export audit history logs

### Dashboard Metrics
- `GET /api/dashboard/stats` — Overview KPI counts, 30-day timeline chart data, and class distribution
