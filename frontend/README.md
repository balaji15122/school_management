# EduCloud — React.js + JavaScript Web Application

Modern, high-performance web frontend for the **EduCloud Multi-Tenant School Data Management Platform**, built using **React.js, JavaScript, Vite, React Router DOM, and Axios**.

---

## 🌟 Key Features & Complete Parity with Flutter App

1. **Authentication & Session Persistence**:
   - 1-Tap Quick Demo Login tabs for **Super Admin** (`admin@platform.com` / `admin123`) and **School Admin** (`admin@greenwood.edu` / `password123`).
   - Secure token persistence in `localStorage` with automatic 401 JWT refresh token rotation via Axios interceptors.
   - Self-service **Register School Tenant** wizard (`/register-school`) provisioning new school tenants and school admins.

2. **Role-Based Access Control & Navigation**:
   - Multi-tenant query scoping: School Admins only see and manage their designated school's student records.
   - Super Admin governance: Full platform access, multi-school catalog, users management, and platform metrics.
   - Responsive layout adapting from a sleek 220px desktop sidebar to mobile drawer and bottom navigation bar.
   - Smooth light and dark mode toggling with localStorage persistence.

3. **Dashboard & Analytics**:
   - KPI metrics cards: Registered Schools, Total Students, Verified Admissions, Pending Review.
   - Interactive 30-Day Submissions Trend line chart with date axis, gridlines, point indicators, and hover tooltips.
   - Grade/Class distribution horizontal progress bars.
   - Recent submissions stream with 1-click modal record inspection.

4. **Schools Directory (Super Admin)**:
   - Searchable tenant catalog with live student counts (Total, Verified, Pending).
   - 1-Click Excel (.xlsx) and Complete Data Package (.zip with Excel + Student Photos) download triggers.
   - Modal dialog to create and register new school tenants.

5. **Students Admissions & Upload**:
   - Live query search, class placement, section, academic session, and status filters (`All`, `Forwarded`, `Verified`, `Draft`, `Rejected`).
   - Sticky-header data table with pagination controls.
   - Multi-row selection bar with bulk actions: Forward to Super Admin (School Admin), Bulk Verify (Super Admin), and Bulk Reject (Super Admin).
   - 10-field Student Form Modal with drag-and-drop file upload, instant preset avatar picker, base64 photo processing, and local draft auto-saving.
   - Student Details Modal with 10 fields breakdown, audit trail, approve/verify buttons, and rejection with reason prompt.

6. **Excel Export Center**:
   - All Schools Master Workbook (.xlsx) multi-sheet export.
   - School Data & Photos Package (.zip), Excel only (.xlsx), and Photos only (.zip) with school tenant selector.
   - Custom Filtered Export (.xlsx) by class or status.
   - Export Audit History table with live log refresh.

7. **Users & Permissions (Super Admin)**:
   - Platform user directory filtered by role chips (`All`, `Super Admins`, `School Admins`).
   - 1-Click account status toggle (Activate / Deactivate).

---

## 🚀 Running the React App

### Prerequisites
- Node.js v18+
- Backend API running on `http://localhost:5050`

### Start Development Server
```bash
cd frontend
npm install
npm run dev
```
The website will be available at `http://localhost:3000`.

### Production Build
```bash
npm run build
```
Generates optimized static assets in `frontend/dist/`.
