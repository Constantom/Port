# PharmaHR ERP (HR-Only for Pharmacy)

This project is a browser-based ERP focused on HR operations in a pharmacy setting, now split into dedicated pages for landing, registration, login, and HR dashboard.

## Page Structure

- `index.html`: Landing page for visitors without accounts.
- `register.html`: Account registration page.
- `login.html`: Authentication page.
- `dashboard.html`: Protected HR ERP dashboard.

## Covered HR Functionalities

- Employee master records (roles, statuses, licensing)
- Recruitment and candidate pipeline
- Shift scheduling by branch/dispensing unit
- Attendance and overtime tracking
- Leave request management and approvals
- Payroll calculation (gross, deductions, net)
- Compliance/training/certification tracking
- Incident and disciplinary case logs
- Performance reviews and scoring
- Dashboard KPIs for HR managers

## Access Control Prototype

- Accounts are stored in `localStorage` (`pharma_hr_users`).
- Login creates a session in `localStorage` (`pharma_hr_session`).
- `dashboard.html` redirects to `login.html` if no session exists.
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
