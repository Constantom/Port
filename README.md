# PharmaHR ERP (HR-Only for Pharmacy)

This project is a browser-based ERP focused on HR operations in a pharmacy setting, split into dedicated pages for landing, registration, login, and a role-aware HR workspace.

## Page Structure

- `index.html`: Landing page for visitors without accounts.
- `register.html`: Account registration page.
- `login.html`: Authentication page.
- `dashboard.html`: Protected HR workspace with module routing and user settings.

## Module Navigation (JavaScript Routing)

Inside `dashboard.html`, each HR function has a dedicated interface and is routed client-side via top tabs:

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
- Settings (all logged-in users)

Each operational module includes:

- **Add** capability (form submit)
- **Load Data** button (reloads from storage)
- **Delete** buttons (remove existing records)

## Advanced Dashboard Analytics

The admin dashboard now includes chart visualizations:

- Recruitment pipeline bar chart by stage
- Payroll trend line chart
- Leave status donut chart

## Access Control + User Profile Settings

- Accounts are stored in `localStorage` (`pharma_hr_users`).
- Login creates a session in `localStorage` (`pharma_hr_session`).
- Per-user settings are stored in `localStorage` (`pharma_hr_user_prefs`).
- `dashboard.html` redirects to `login.html` if no session exists.
- Roles:
  - **Admin**: Full access to all modules, including Dashboard and Approval Center.
  - **HR Personnel**: Access to HR operational modules and Settings (no Dashboard, no Approval Center).
  - **Supervisor**: Access to supervision-focused modules and Settings (no Dashboard, no Approval Center).
- Settings module allows each user to:
  - switch between **light** and **dark** theme,
  - upload a **profile picture**,
  - view profile image and name in the top navbar.

## Styling System

The UI includes modern styling elements across pages:

- glassmorphism surfaces
- fade-in motion
- enhanced hover interactions
- responsive layout and dark mode support

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
