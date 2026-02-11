# PharmaHR ERP (HR-Only for Pharmacy)

This project is a browser-based ERP focused on HR operations in a pharmacy setting.

## Page Structure (Independent Routing)

Public pages:
- `index.html` - Landing page
- `register.html` - Register
- `login.html` - Login

Protected module pages (independent interfaces routed by top navbar links):
- `dashboard.html` (admin only)
- `approvals.html` (admin only)
- `employees.html`
- `recruitment.html`
- `shifts.html`
- `attendance.html`
- `leaves.html`
- `payroll.html`
- `compliance.html`
- `incidents.html`
- `performance.html`
- `settings.html`

## What was fixed

- Dark theme now applies correctly per user after login and on protected pages.
- Profile image update now reflects in the top navbar after choosing/saving avatar.
- Navigation now uses independent pages (not hidden sections), and navbar links route directly between module pages.

## Access Control

Roles are saved and normalized in auth:
- **Admin**: all pages (including Dashboard + Approvals)
- **HR Personnel**: operational pages + Settings (no Dashboard/Approvals)
- **Supervisor**: supervision pages + Settings (no Dashboard/Approvals)

## Data & Preferences

- HR data storage: `localStorage` key `pharma_hr_erp`
- Auth users: `pharma_hr_users`
- Session: `pharma_hr_session`
- User preferences (theme/avatar): `pharma_hr_user_prefs`

## Run

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
