const STORAGE_KEY = "pharma_hr_erp";

const defaultState = {
  employees: [],
  recruitment: [],
  shifts: [],
  attendance: [],
  leaves: [],
  payroll: [],
  compliance: [],
  incidents: [],
  performance: []
};

const employeeFormExists = Boolean(document.getElementById("employeeForm"));
let state = loadState();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);
  try {
    return { ...structuredClone(defaultState), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindForm(formId, collection, mapper) {
  const form = document.getElementById(formId);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    state[collection].unshift(mapper(data));
    saveState();
    form.reset();
    renderAll();
  });
}

function renderTable(tableId, rows, columns) {
  const table = document.getElementById(tableId);
  table.innerHTML = rows
    .map((row) => `<tr>${columns.map((c) => `<td>${row[c] ?? ""}</td>`).join("")}</tr>`)
    .join("");
}

function currency(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function renderMetrics() {
  const metrics = document.getElementById("metrics");
  const activeEmployees = state.employees.filter((e) => e.status === "Active").length;
  const pendingLeaves = state.leaves.filter((l) => l.status === "Pending").length;
  const expiringCompliance = state.compliance.filter((c) => c.status !== "Valid").length;
  const openIncidents = state.incidents.filter((i) => i.resolution !== "Resolved").length;
  const avgReview = state.performance.length
    ? (state.performance.reduce((sum, item) => sum + Number(item.score), 0) / state.performance.length).toFixed(2)
    : "N/A";

  const cards = [
    ["Total Employees", state.employees.length],
    ["Active Employees", activeEmployees],
    ["Candidates in Pipeline", state.recruitment.length],
    ["Shifts Scheduled", state.shifts.length],
    ["Pending Leave Requests", pendingLeaves],
    ["Payroll Runs", state.payroll.length],
    ["Compliance Alerts", expiringCompliance],
    ["Open Incidents", openIncidents],
    ["Avg. Performance Score", avgReview]
  ];

  metrics.innerHTML = cards
    .map(([title, value]) => `<article class="metric"><h3>${title}</h3><p>${value}</p></article>`)
    .join("");
}

function renderAll() {
  renderMetrics();
  renderTable("employeesTable", state.employees, ["name", "role", "license", "hireDate", "status"]);
  renderTable("recruitTable", state.recruitment, ["candidate", "position", "stage"]);
  renderTable("shiftTable", state.shifts, ["employee", "date", "shift", "location"]);
  renderTable("attendanceTable", state.attendance, ["employee", "date", "hoursWorked", "overtime"]);
  renderTable("leaveTable", state.leaves, ["employee", "type", "start", "end", "status"]);
  renderTable("payrollTable", state.payroll, ["employee", "month", "gross", "deductions", "net"]);
  renderTable("complianceTable", state.compliance, ["employee", "module", "expiry", "status"]);
  renderTable("incidentTable", state.incidents, ["employee", "date", "incident", "resolution"]);
  renderTable("performanceTable", state.performance, ["employee", "reviewDate", "score", "notes"]);
}

if (employeeFormExists) {
  bindForm("employeeForm", "employees", (d) => d);
  bindForm("recruitForm", "recruitment", (d) => d);
  bindForm("shiftForm", "shifts", (d) => d);
  bindForm("attendanceForm", "attendance", (d) => d);
  bindForm("leaveForm", "leaves", (d) => d);
  bindForm("payrollForm", "payroll", (d) => {
    const gross = Number(d.basic) + Number(d.allowance);
    const net = gross - Number(d.deductions);
    return {
      employee: d.employee,
      month: d.month,
      gross: currency(gross),
      deductions: currency(d.deductions),
      net: currency(net)
    };
  });
  bindForm("complianceForm", "compliance", (d) => d);
  bindForm("incidentForm", "incidents", (d) => d);
  bindForm("performanceForm", "performance", (d) => d);

  renderAll();
}
