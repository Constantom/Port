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

const roleAccess = {
  admin: [
    "dashboard",
    "approvals",
    "employees",
    "recruitment",
    "shifts",
    "attendance",
    "leaves",
    "payroll",
    "compliance",
    "incidents",
    "performance"
  ],
  "hr personnel": [
    "employees",
    "recruitment",
    "shifts",
    "attendance",
    "leaves",
    "payroll",
    "compliance",
    "incidents",
    "performance"
  ],
  supervisor: ["employees", "shifts", "attendance", "leaves", "incidents", "performance"]
};

const tableMap = {
  employees: { id: "employeesTable", columns: ["name", "role", "license", "hireDate", "status"] },
  recruitment: { id: "recruitTable", columns: ["candidate", "position", "stage"] },
  shifts: { id: "shiftTable", columns: ["employee", "date", "shift", "location"] },
  attendance: { id: "attendanceTable", columns: ["employee", "date", "hoursWorked", "overtime"] },
  leaves: { id: "leaveTable", columns: ["employee", "type", "start", "end", "status"] },
  payroll: { id: "payrollTable", columns: ["employee", "month", "gross", "deductions", "net"] },
  compliance: { id: "complianceTable", columns: ["employee", "module", "expiry", "status"] },
  incidents: { id: "incidentTable", columns: ["employee", "date", "incident", "resolution"] },
  performance: { id: "performanceTable", columns: ["employee", "reviewDate", "score", "notes"] }
};

const employeeFormExists = Boolean(document.getElementById("employeeForm"));
let state = loadState();
let allowedModules = [];

function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (["admin", "administrator", "hr manager"].includes(value)) return "admin";
  if (["hr personnel", "hr officer", "hr"].includes(value)) return "hr personnel";
  if (value === "supervisor") return "supervisor";
  return "hr personnel";
}

function getSessionUser() {
  return JSON.parse(localStorage.getItem("pharma_hr_session") || "null");
}

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

function currency(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function deleteRow(collection, index) {
  state[collection].splice(index, 1);
  saveState();
  renderAll();
}

function renderTable(collection) {
  const config = tableMap[collection];
  const table = document.getElementById(config.id);
  if (!table) return;

  table.innerHTML = state[collection]
    .map(
      (row, index) =>
        `<tr>${config.columns.map((c) => `<td>${row[c] ?? ""}</td>`).join("")}<td><button class="danger-btn" data-delete="${collection}" data-index="${index}" type="button">Delete</button></td></tr>`
    )
    .join("");
}

function renderMetrics() {
  const metrics = document.getElementById("metrics");
  if (!metrics) return;

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

function renderApprovals() {
  const leaveTable = document.getElementById("approvalsLeaveTable");
  const incidentTable = document.getElementById("approvalsIncidentTable");
  if (!leaveTable || !incidentTable) return;

  leaveTable.innerHTML = state.leaves
    .map((row, index) => {
      if (row.status !== "Pending") return "";
      return `<tr><td>${row.employee}</td><td>${row.type}</td><td>${row.start}</td><td>${row.end}</td><td>${row.status}</td><td><button class="secondary-btn" data-approval="leave" data-index="${index}" data-action="Approved" type="button">Approve</button> <button class="danger-btn" data-approval="leave" data-index="${index}" data-action="Rejected" type="button">Reject</button></td></tr>`;
    })
    .join("");

  incidentTable.innerHTML = state.incidents
    .map((row, index) => {
      if (row.resolution === "Resolved") return "";
      return `<tr><td>${row.employee}</td><td>${row.date}</td><td>${row.incident}</td><td>${row.resolution}</td><td><button class="secondary-btn" data-approval="incident" data-index="${index}" data-action="Resolved" type="button">Resolve</button></td></tr>`;
    })
    .join("");
}

function renderAll() {
  renderMetrics();
  Object.keys(tableMap).forEach(renderTable);
  renderApprovals();
}

function bindForm(formId, collection, mapper) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    state[collection].unshift(mapper(data));
    saveState();
    form.reset();
    renderAll();
  });
}

function setupLoadButtons() {
  document.querySelectorAll("[data-load]").forEach((button) => {
    button.addEventListener("click", () => {
      state = loadState();
      renderAll();
    });
  });
}

function setupDeleteButtons() {
  document.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete]");
    if (deleteButton) {
      deleteRow(deleteButton.dataset.delete, Number(deleteButton.dataset.index));
      return;
    }

    const approvalButton = event.target.closest("[data-approval]");
    if (!approvalButton) return;

    const { approval, action } = approvalButton.dataset;
    const index = Number(approvalButton.dataset.index);

    if (approval === "leave") {
      state.leaves[index].status = action;
    }

    if (approval === "incident") {
      state.incidents[index].resolution = action;
    }

    saveState();
    renderAll();
  });
}

function setupRouting() {
  const tabs = [...document.querySelectorAll(".module-tab")];
  const views = [...document.querySelectorAll(".module-view")];

  function openModule(moduleName) {
    if (!allowedModules.includes(moduleName)) return;
    tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.module === moduleName));
    views.forEach((view) => view.classList.toggle("hidden", view.dataset.module !== moduleName));
    window.location.hash = moduleName;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => openModule(tab.dataset.module));
  });

  const fromHash = window.location.hash.replace("#", "");
  const initialModule = allowedModules.includes(fromHash) ? fromHash : allowedModules[0];
  openModule(initialModule);
}

function setupRoleAccess() {
  const session = getSessionUser();
  const userRole = normalizeRole(session?.role);
  allowedModules = roleAccess[userRole] || roleAccess["hr personnel"];

  document.querySelectorAll(".module-tab").forEach((tab) => {
    if (!allowedModules.includes(tab.dataset.module)) tab.remove();
  });

  document.querySelectorAll(".module-view").forEach((view) => {
    if (!allowedModules.includes(view.dataset.module)) view.remove();
  });
}

if (employeeFormExists) {
  setupRoleAccess();
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

  setupLoadButtons();
  setupDeleteButtons();
  setupRouting();
  renderAll();
}
