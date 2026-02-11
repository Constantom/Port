# PharmaHR ERP (HR-Only for Pharmacy)

This project is a browser-based ERP focused on HR operations in a pharmacy setting, split into dedicated pages for landing, registration, login, and a role-aware HR workspace.

## Page Structure

- `index.html`: Landing page for visitors without accounts.
- `register.html`: Account registration page.
- `login.html`: Authentication page.
- `dashboard.html`: Protected HR workspace with module routing.

## Module Navigation (JavaScript Routing)

Inside `dashboard.html`, each HR function has a dedicated interface and is routed client-side via module tabs:

- Dashboard (admin only)
- Approval Center (admin only)
- Employees
- Recruitment Pipeline
- Shift Scheduling
- Attendance & Overtime
- Leave Management
- Payroll
- Compliance, Training & Certification
- Incidents & Disciplinary Cases
- Performance Reviews

Each module includes:

- **Add** capability (form submit)
- **Load Data** button (reloads from storage)
- **Delete** buttons (remove existing records)

## Access Control Prototype

- Accounts are stored in `localStorage` (`pharma_hr_users`).
- Login creates a session in `localStorage` (`pharma_hr_session`).
- `dashboard.html` redirects to `login.html` if no session exists.
- Roles:
  - **Admin**: Full access to all modules, including Dashboard and Approval Center.
  - **HR Personnel**: Access to HR operational modules (no Dashboard, no Approval Center).
  - **Supervisor**: Access to supervision-focused modules (no Dashboard, no Approval Center).
- Logout clears the session.

## Run

No dependencies required.

- Open `index.html` directly in a browser, or
- Serve with a local web server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Notes

- HR module data is stored in `localStorage` under `pharma_hr_erp`.
- This is a frontend prototype that can be extended with backend APIs, RBAC, password hashing, and secure auth.
