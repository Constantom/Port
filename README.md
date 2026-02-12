# PharmaHR ERP (HR-Only for Pharmacy)

This project is a browser-based ERP focused on HR operations in a pharmacy setting.

## Routing Model (Single Dashboard Page)

All HR modules now live inside **`dashboard.html`** and are routed using JavaScript hash routes and top navbar links.

Example routes:
- `dashboard.html#dashboard`
- `dashboard.html#employees`
- `dashboard.html#recruitment`
- `dashboard.html#shifts`
- `dashboard.html#attendance`
- `dashboard.html#leaves`
- `dashboard.html#payroll`
- `dashboard.html#compliance`
- `dashboard.html#incidents`
- `dashboard.html#performance`
- `dashboard.html#approvals`
- `dashboard.html#settings`

## What was fixed

- Dark theme now applies correctly per user after login and on dashboard load.
- Profile image updates in Settings now reflect at top navbar near the user name.
- Module navigation is back inside `dashboard.html` and routed via JavaScript, not independent pages.

## Access Control

Roles are normalized and enforced in dashboard routing:
- **Admin**: all modules (including Dashboard + Approvals)
- **HR Personnel**: operational modules + Settings (no Dashboard/Approvals)
- **Supervisor**: supervision modules + Settings (no Dashboard/Approvals)

## Data & Preferences

- HR data: `localStorage` key `pharma_hr_erp`
- Auth users: `pharma_hr_users`
- Session: `pharma_hr_session`
- User preferences (theme/avatar): `pharma_hr_user_prefs`

## Run

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.
