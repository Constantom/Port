const STORAGE_KEY = "pharma_hr_erp";
const PREFS_KEY = "pharma_hr_user_prefs";

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
    "performance",
    "settings"
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
    "performance",
    "settings"
  ],
  supervisor: ["employees", "shifts", "attendance", "leaves", "incidents", "performance", "settings"]
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
let currentUser = null;
let pendingAvatar = "";

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

function getUserPrefsMap() {
  return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
}

function getUserPrefs(email) {
  const map = getUserPrefsMap();
  return map[email] || { theme: "light", avatar: "" };
}

function saveUserPrefs(email, prefs) {
  const map = getUserPrefsMap();
  map[email] = { ...getUserPrefs(email), ...prefs };
  localStorage.setItem(PREFS_KEY, JSON.stringify(map));
}

function applyTheme(theme) {
  document.body.classList.toggle("dark-theme", theme === "dark");
}

function updateProfileUI() {
  const userLabel = document.getElementById("sessionUser");
  const avatar = document.getElementById("sessionAvatar");
  const avatarPreview = document.getElementById("settingsAvatarPreview");
  const themeSelect = document.getElementById("themeSelect");

  if (!currentUser) return;
  const prefs = getUserPrefs(currentUser.email);
  const avatarSrc = prefs.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=1f4aa9&color=fff`;

  if (userLabel) userLabel.textContent = currentUser.name;
  if (avatar) avatar.src = avatarSrc;
  if (avatarPreview) avatarPreview.src = avatarSrc;
  if (themeSelect) themeSelect.value = prefs.theme || "light";
  applyTheme(prefs.theme || "light");
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

function drawBarChart(canvas, labels, values) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const max = Math.max(...values, 1);
  const padding = 35;
  const barWidth = (w - padding * 2) / values.length - 14;

  values.forEach((value, i) => {
    const x = padding + i * (barWidth + 14);
    const barHeight = ((h - 80) * value) / max;
    const y = h - 40 - barHeight;

    const gradient = ctx.createLinearGradient(0, y, 0, h - 40);
    gradient.addColorStop(0, "#4f7df0");
    gradient.addColorStop(1, "#8fb2ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--text");
    ctx.font = "12px Segoe UI";
    ctx.fillText(labels[i], x, h - 18);
    ctx.fillText(String(value), x + barWidth / 3, y - 8);
  });
}

function drawLineChart(canvas, labels, values) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const padding = 45;
  const max = Math.max(...values, 1);
  const min = 0;

  ctx.strokeStyle = "#90a6d6";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, h - padding);
  ctx.lineTo(w - padding, h - padding);
  ctx.stroke();

  ctx.strokeStyle = "#2b66da";
  ctx.lineWidth = 3;
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = padding + (i * (w - padding * 2)) / Math.max(values.length - 1, 1);
    const y = h - padding - ((v - min) / (max - min || 1)) * (h - padding * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  values.forEach((v, i) => {
    const x = padding + (i * (w - padding * 2)) / Math.max(values.length - 1, 1);
    const y = h - padding - (v / max) * (h - padding * 2);
    ctx.fillStyle = "#2b66da";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--text");
    ctx.font = "11px Segoe UI";
    ctx.fillText(labels[i], x - 12, h - 18);
  });
}

function drawDonutChart(canvas, data) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let start = -Math.PI / 2;
  const cx = 140;
  const cy = h / 2;
  const radius = 80;

  data.forEach((item, index) => {
    const slice = (item.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, start + slice);
    ctx.arc(cx, cy, radius - 30, start + slice, start, true);
    ctx.closePath();
    ctx.fillStyle = ["#4e7cec", "#35a96a", "#efae45", "#d45a5a"][index % 4];
    ctx.fill();
    start += slice;
  });

  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--text");
  ctx.font = "12px Segoe UI";
  data.forEach((item, index) => {
    ctx.fillStyle = ["#4e7cec", "#35a96a", "#efae45", "#d45a5a"][index % 4];
    ctx.fillRect(285, 45 + index * 28, 12, 12);
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--text");
    ctx.fillText(`${item.label}: ${item.value}`, 304, 56 + index * 28);
  });
}

function renderCharts() {
  const stages = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];
  const stageCounts = stages.map((s) => state.recruitment.filter((item) => item.stage === s).length);

  const payrollByMonth = {};
  state.payroll.forEach((row) => {
    payrollByMonth[row.month] = (payrollByMonth[row.month] || 0) + Number(String(row.net).replace(/[^0-9.-]/g, ""));
  });
  const monthLabels = Object.keys(payrollByMonth).sort().slice(-6);
  const monthValues = monthLabels.map((m) => Number((payrollByMonth[m] || 0).toFixed(2)));

  const leaveData = [
    { label: "Pending", value: state.leaves.filter((l) => l.status === "Pending").length },
    { label: "Approved", value: state.leaves.filter((l) => l.status === "Approved").length },
    { label: "Rejected", value: state.leaves.filter((l) => l.status === "Rejected").length }
  ];

  drawBarChart(document.getElementById("pipelineChart"), stages, stageCounts);
  drawLineChart(document.getElementById("payrollTrendChart"), monthLabels.length ? monthLabels : ["-"], monthValues.length ? monthValues : [0]);
  drawDonutChart(document.getElementById("leaveDonutChart"), leaveData);
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
  renderCharts();
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

function setupSettings() {
  const form = document.getElementById("settingsForm");
  const avatarInput = document.getElementById("avatarInput");
  const message = document.getElementById("settingsMessage");

  if (!form || !currentUser) return;

  avatarInput?.addEventListener("change", () => {
    const file = avatarInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      pendingAvatar = String(event.target?.result || "");
      const preview = document.getElementById("settingsAvatarPreview");
      if (preview) preview.src = pendingAvatar;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const prefs = getUserPrefs(currentUser.email);
    saveUserPrefs(currentUser.email, {
      theme: data.theme,
      avatar: pendingAvatar || prefs.avatar || ""
    });
    updateProfileUI();
    message.textContent = "Settings saved successfully.";
    message.className = "message success";
  });
}

function setupLoadButtons() {
  document.querySelectorAll("[data-load]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.load === "settings") {
        updateProfileUI();
        return;
      }
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

    if (approval === "leave") state.leaves[index].status = action;
    if (approval === "incident") state.incidents[index].resolution = action;

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

  tabs.forEach((tab) => tab.addEventListener("click", () => openModule(tab.dataset.module)));
  const fromHash = window.location.hash.replace("#", "");
  openModule(allowedModules.includes(fromHash) ? fromHash : allowedModules[0]);
}

function setupRoleAccess() {
  currentUser = getSessionUser();
  const userRole = normalizeRole(currentUser?.role);
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
  updateProfileUI();
  bindForm("employeeForm", "employees", (d) => d);
  bindForm("recruitForm", "recruitment", (d) => d);
  bindForm("shiftForm", "shifts", (d) => d);
  bindForm("attendanceForm", "attendance", (d) => d);
  bindForm("leaveForm", "leaves", (d) => d);
  bindForm("payrollForm", "payroll", (d) => {
    const gross = Number(d.basic) + Number(d.allowance);
    const net = gross - Number(d.deductions);
    return { employee: d.employee, month: d.month, gross: currency(gross), deductions: currency(d.deductions), net: currency(net) };
  });
  bindForm("complianceForm", "compliance", (d) => d);
  bindForm("incidentForm", "incidents", (d) => d);
  bindForm("performanceForm", "performance", (d) => d);

  setupSettings();
  setupLoadButtons();
  setupDeleteButtons();
  setupRouting();
  renderAll();
}
