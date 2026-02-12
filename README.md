# PharmaHR ERP (HR-Only for Pharmacy)

Browser-based HR ERP prototype for pharmacy operations.

## Routing Model (Independent Pages + Dedicated Navigation Hub)

- `modules.html` is now the dedicated **user navigation page**.
- All interfaces remain independent pages:
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

## Implemented Changes

- Removed navbars from module pages and introduced a dedicated navigation page (`modules.html`).
- Added module-card grid navigation (4-column layout) with search filter on `modules.html`.
- Added top user identity display (name + designation + profile picture) on:
  - modules page
  - each module page header.
- Settings page now focuses on theme preference only (light/dark toggle).
- Profile picture upload moved to the dedicated modules page profile area.
- Theme and avatar are persisted per user in `pharma_hr_user_prefs`.
- Light/dark mode now applies correctly on all protected pages.
- Access control enforced so each role only sees/opens allowed interfaces.

## Access Control

- **Admin**: all interfaces
- **HR Personnel**: operational interfaces + settings
- **Supervisor**: supervision interfaces + settings

## Storage Keys

- HR data: `pharma_hr_erp`
- Users: `pharma_hr_users`
- Session: `pharma_hr_session`
- User preferences: `pharma_hr_user_prefs`

## Run

```bash
python3 -m http.server 8000
```

Open: `http://localhost:8000`
