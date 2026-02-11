const STORAGE_KEY = "pharma_hr_erp";
const PREFS_KEY = "pharma_hr_user_prefs";

const defaultState = {
  employees: [], recruitment: [], shifts: [], attendance: [], leaves: [], payroll: [], compliance: [], incidents: [], performance: []
};

const roleAccess = {
  admin: ["dashboard", "approvals", "employees", "recruitment", "shifts", "attendance", "leaves", "payroll", "compliance", "incidents", "performance", "settings"],
  "hr personnel": ["employees", "recruitment", "shifts", "attendance", "leaves", "payroll", "compliance", "incidents", "performance", "settings"],
  supervisor: ["employees", "shifts", "attendance", "leaves", "incidents", "performance", "settings"]
};

const pageConfig = {
  employees: { collection: "employees", formId: "employeeForm", tableId: "employeesTable", cols: ["name", "role", "license", "hireDate", "status"] },
  recruitment: { collection: "recruitment", formId: "recruitForm", tableId: "recruitTable", cols: ["candidate", "position", "stage"] },
  shifts: { collection: "shifts", formId: "shiftForm", tableId: "shiftTable", cols: ["employee", "date", "shift", "location"] },
  attendance: { collection: "attendance", formId: "attendanceForm", tableId: "attendanceTable", cols: ["employee", "date", "hoursWorked", "overtime"] },
  leaves: { collection: "leaves", formId: "leaveForm", tableId: "leaveTable", cols: ["employee", "type", "start", "end", "status"] },
  payroll: { collection: "payroll", formId: "payrollForm", tableId: "payrollTable", cols: ["employee", "month", "gross", "deductions", "net"] },
  compliance: { collection: "compliance", formId: "complianceForm", tableId: "complianceTable", cols: ["employee", "module", "expiry", "status"] },
  incidents: { collection: "incidents", formId: "incidentForm", tableId: "incidentTable", cols: ["employee", "date", "incident", "resolution"] },
  performance: { collection: "performance", formId: "performanceForm", tableId: "performanceTable", cols: ["employee", "reviewDate", "score", "notes"] }
};

let state = loadState();
let currentUser = null;
let currentPage = document.body.dataset.page;
let pendingAvatar = "";

function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (["admin", "administrator", "hr manager"].includes(value)) return "admin";
  if (["hr personnel", "hr officer", "hr"].includes(value)) return "hr personnel";
  if (value === "supervisor") return "supervisor";
  return "hr personnel";
}
function getSessionUser() { return JSON.parse(localStorage.getItem("pharma_hr_session") || "null"); }
function loadState() { try { return { ...structuredClone(defaultState), ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")) }; } catch { return structuredClone(defaultState); } }
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function getPrefsMap() { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"); }
function getUserPrefs(email) { return getPrefsMap()[email] || { theme: "light", avatar: "" }; }
function saveUserPrefs(email, prefs) { const map = getPrefsMap(); map[email] = { ...getUserPrefs(email), ...prefs }; localStorage.setItem(PREFS_KEY, JSON.stringify(map)); }
function currency(amount) { return `$${Number(amount).toFixed(2)}`; }
function applyTheme(theme) { document.body.classList.toggle("dark-theme", theme === "dark"); }

function setActiveNav() {
  document.querySelectorAll("[data-module-link]").forEach((link) => {
    link.classList.toggle("active", link.dataset.moduleLink === currentPage);
  });
}

function setupAccessControl() {
  currentUser = getSessionUser();
  const role = normalizeRole(currentUser?.role);
  const allowed = roleAccess[role] || roleAccess["hr personnel"];

  document.querySelectorAll("[data-module-link]").forEach((link) => {
    if (!allowed.includes(link.dataset.moduleLink)) link.remove();
  });

  if (!allowed.includes(currentPage)) {
    window.location.href = `${allowed[0]}.html`;
    return false;
  }
  return true;
}

function updateProfileUI() {
  if (!currentUser) return;
  const prefs = getUserPrefs(currentUser.email);
  const src = prefs.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=1f4aa9&color=fff`;
  const nameEl = document.getElementById("sessionUser");
  const avatarEl = document.getElementById("sessionAvatar");
  if (nameEl) nameEl.textContent = currentUser.name;
  if (avatarEl) avatarEl.src = src;
  const preview = document.getElementById("settingsAvatarPreview");
  if (preview) preview.src = src;
  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) themeSelect.value = prefs.theme || "light";
  applyTheme(prefs.theme || "light");
}

function setupLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    localStorage.removeItem("pharma_hr_session");
    window.location.href = "login.html";
  });
}

function renderTable(page) {
  const cfg = pageConfig[page];
  if (!cfg) return;
  const table = document.getElementById(cfg.tableId);
  if (!table) return;
  table.innerHTML = state[cfg.collection].map((row, i) => `<tr>${cfg.cols.map((c) => `<td>${row[c] ?? ""}</td>`).join("")}<td><button class="danger-btn" data-delete="${cfg.collection}" data-index="${i}" type="button">Delete</button></td></tr>`).join("");
}

function bindPageForm(page) {
  const cfg = pageConfig[page];
  if (!cfg) return;
  const form = document.getElementById(cfg.formId);
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (cfg.collection === "payroll") {
      const gross = Number(data.basic) + Number(data.allowance);
      data.gross = currency(gross);
      data.deductions = currency(data.deductions);
      data.net = currency(gross - Number(String(data.deductions).replace(/[^0-9.-]/g, "")));
    }
    state[cfg.collection].unshift(data);
    saveState();
    form.reset();
    renderTable(page);
    if (page === "dashboard") renderDashboard();
  });
}

function setupDeleteHandler() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-delete]");
    if (!btn) return;
    const { delete: collection, index } = btn.dataset;
    state[collection].splice(Number(index), 1);
    saveState();
    renderTable(currentPage);
  });
}

function setupLoadButton() {
  const btn = document.querySelector("[data-load]");
  if (!btn) return;
  btn.addEventListener("click", () => {
    state = loadState();
    if (currentPage === "dashboard") renderDashboard();
    else if (currentPage === "approvals") renderApprovals();
    else if (currentPage === "settings") updateProfileUI();
    else renderTable(currentPage);
  });
}

function renderApprovals() {
  const leave = document.getElementById("approvalsLeaveTable");
  const incident = document.getElementById("approvalsIncidentTable");
  if (!leave || !incident) return;
  leave.innerHTML = state.leaves.map((r, i) => r.status === "Pending" ? `<tr><td>${r.employee}</td><td>${r.type}</td><td>${r.start}</td><td>${r.end}</td><td>${r.status}</td><td><button class="secondary-btn" data-approval="leave" data-index="${i}" data-action="Approved" type="button">Approve</button> <button class="danger-btn" data-approval="leave" data-index="${i}" data-action="Rejected" type="button">Reject</button></td></tr>` : "").join("");
  incident.innerHTML = state.incidents.map((r, i) => r.resolution !== "Resolved" ? `<tr><td>${r.employee}</td><td>${r.date}</td><td>${r.incident}</td><td>${r.resolution}</td><td><button class="secondary-btn" data-approval="incident" data-index="${i}" data-action="Resolved" type="button">Resolve</button></td></tr>` : "").join("");
}

function setupApprovalHandler() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-approval]");
    if (!btn) return;
    const i = Number(btn.dataset.index);
    if (btn.dataset.approval === "leave") state.leaves[i].status = btn.dataset.action;
    if (btn.dataset.approval === "incident") state.incidents[i].resolution = btn.dataset.action;
    saveState();
    renderApprovals();
  });
}

function renderMetrics() {
  const metrics = document.getElementById("metrics");
  if (!metrics) return;
  const cards = [
    ["Total Employees", state.employees.length],
    ["Active Employees", state.employees.filter((e) => e.status === "Active").length],
    ["Candidates", state.recruitment.length],
    ["Shifts", state.shifts.length],
    ["Pending Leaves", state.leaves.filter((l) => l.status === "Pending").length],
    ["Payroll Runs", state.payroll.length],
    ["Compliance Alerts", state.compliance.filter((c) => c.status !== "Valid").length],
    ["Open Incidents", state.incidents.filter((i) => i.resolution !== "Resolved").length]
  ];
  metrics.innerHTML = cards.map(([t,v]) => `<article class="metric"><h3>${t}</h3><p>${v}</p></article>`).join("");
}

function drawBarChart(canvas, labels, values) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const max = Math.max(...values,1); const pad=35; const gap=14; const bw=(canvas.width-pad*2-gap*(values.length-1))/values.length;
  values.forEach((v,i)=>{ const x=pad+i*(bw+gap); const h=((canvas.height-80)*v)/max; const y=canvas.height-40-h; const g=ctx.createLinearGradient(0,y,0,canvas.height-40); g.addColorStop(0,'#4f7df0'); g.addColorStop(1,'#8fb2ff'); ctx.fillStyle=g; ctx.fillRect(x,y,bw,h); ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--text'); ctx.font='12px Inter'; ctx.fillText(labels[i],x,canvas.height-18); });
}
function drawLineChart(canvas, labels, values) {
  if (!canvas) return; const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height); const p=45; const max=Math.max(...values,1);
  ctx.strokeStyle='#2b66da'; ctx.lineWidth=3; ctx.beginPath(); values.forEach((v,i)=>{ const x=p+(i*(canvas.width-p*2))/Math.max(values.length-1,1); const y=canvas.height-p-(v/max)*(canvas.height-p*2); i?ctx.lineTo(x,y):ctx.moveTo(x,y);}); ctx.stroke();
  values.forEach((v,i)=>{ const x=p+(i*(canvas.width-p*2))/Math.max(values.length-1,1); const y=canvas.height-p-(v/max)*(canvas.height-p*2); ctx.fillStyle='#2b66da'; ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fill(); ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--text'); ctx.font='11px Inter'; ctx.fillText(labels[i],x-10,canvas.height-18); });
}
function drawDonutChart(canvas, data) {
  if (!canvas) return; const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height); const total=data.reduce((s,i)=>s+i.value,0)||1; let st=-Math.PI/2; const c=[["#4e7cec"],["#35a96a"],["#efae45"],["#d45a5a"]];
  data.forEach((d,i)=>{ const sl=(d.value/total)*Math.PI*2; ctx.beginPath(); ctx.arc(140,canvas.height/2,80,st,st+sl); ctx.arc(140,canvas.height/2,50,st+sl,st,true); ctx.closePath(); ctx.fillStyle=c[i%4][0]; ctx.fill(); st+=sl;});
}

function renderDashboard() {
  renderMetrics();
  const stages = ["Applied","Screening","Interview","Offer","Hired","Rejected"];
  drawBarChart(document.getElementById("pipelineChart"), stages, stages.map((s)=>state.recruitment.filter((r)=>r.stage===s).length));
  const byMonth={}; state.payroll.forEach((p)=>{byMonth[p.month]=(byMonth[p.month]||0)+Number(String(p.net).replace(/[^0-9.-]/g,''));});
  const labels=Object.keys(byMonth).sort().slice(-6); const vals=labels.map((l)=>byMonth[l]);
  drawLineChart(document.getElementById("payrollTrendChart"), labels.length?labels:["-"], vals.length?vals:[0]);
  drawDonutChart(document.getElementById("leaveDonutChart"), [
    {label:"Pending", value: state.leaves.filter((l)=>l.status==="Pending").length},
    {label:"Approved", value: state.leaves.filter((l)=>l.status==="Approved").length},
    {label:"Rejected", value: state.leaves.filter((l)=>l.status==="Rejected").length}
  ]);
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
    reader.onload = (e) => {
      pendingAvatar = String(e.target?.result || "");
      const preview = document.getElementById("settingsAvatarPreview");
      const navAvatar = document.getElementById("sessionAvatar");
      if (preview) preview.src = pendingAvatar;
      if (navAvatar) navAvatar.src = pendingAvatar;
    };
    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const existing = getUserPrefs(currentUser.email);
    saveUserPrefs(currentUser.email, { theme: data.theme, avatar: pendingAvatar || existing.avatar || "" });
    updateProfileUI();
    message.textContent = "Settings saved.";
    message.className = "message success";
  });
}

function init() {
  if (!currentPage) return;
  if (!setupAccessControl()) return;
  setActiveNav();
  setupLogout();
  updateProfileUI();
  setupLoadButton();

  if (currentPage === "dashboard") renderDashboard();
  if (currentPage === "approvals") { renderApprovals(); setupApprovalHandler(); }
  if (currentPage === "settings") setupSettings();

  if (pageConfig[currentPage]) {
    bindPageForm(currentPage);
    renderTable(currentPage);
    setupDeleteHandler();
  }
}

init();
