# PharmaHR ERP (HR-Only for Pharmacy)

This project is a browser-based ERP focused only on HR operations in a pharmacy environment.

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

## Run

No dependencies required.

- Open `index.html` directly in a browser, or
- Serve with a local web server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Notes

- Data is stored in `localStorage` under `pharma_hr_erp`.
- This is a prototype that can be extended with authentication, backend APIs, and RBAC.
