# PharmaHR ERP (HR-Only for Pharmacy)

This project is a browser-based ERP focused on HR operations in a pharmacy setting.

## Routing Model (Multiple Independent Pages)

Each interface now has its own dedicated HTML page:

- `dashboard.html` (admin)
- `approvals.html` (admin)
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

Navigation uses the top navbar links to move between pages.

## Fixed Items

- Dark mode now works using per-user saved preferences (`pharma_hr_user_prefs`) and is applied on all protected pages.
- Profile picture selected in Settings updates in preview and top navbar avatar, and persists per user.
- All interfaces are independent pages and fully functional with Add / Load / Delete flows.

## Access Control

Roles are normalized and enforced per page:
- **Admin**: all pages (including Dashboard + Approvals)
- **HR Personnel**: operational pages + Settings (no Dashboard/Approvals)
- **Supervisor**: supervision pages + Settings (no Dashboard/Approvals)

## Storage Keys

- HR data: `pharma_hr_erp`
- Auth users: `pharma_hr_users`
- Session: `pharma_hr_session`
- User prefs (theme/avatar): `pharma_hr_user_prefs`

## Run

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
