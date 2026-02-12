const STORAGE_KEY = "pharma_hr_erp";
const PREFS_KEY = "pharma_hr_user_prefs";

const defaultState = {
  employees: [], recruitment: [], shifts: [], attendance: [], leaves: [], payroll: [], compliance: [], incidents: [], performance: []
};

const roleAccess = {
  admin: ["modules","dashboard","approvals","employees","recruitment","shifts","attendance","leaves","payroll","compliance","incidents","performance","settings"],
  "hr personnel": ["modules","employees","recruitment","shifts","attendance","leaves","payroll","compliance","incidents","performance","settings"],
  supervisor: ["modules","employees","shifts","attendance","leaves","incidents","performance","settings"]
};

const tableConfig = {
  employees: { tableId: "employeesTable", cols: ["name", "role", "license", "hireDate", "status"] },
  recruitment: { tableId: "recruitTable", cols: ["candidate", "position", "stage"] },
  shifts: { tableId: "shiftTable", cols: ["employee", "date", "shift", "location"] },
  attendance: { tableId: "attendanceTable", cols: ["employee", "date", "hoursWorked", "overtime"] },
  leaves: { tableId: "leaveTable", cols: ["employee", "type", "start", "end", "status"] },
  payroll: { tableId: "payrollTable", cols: ["employee", "month", "gross", "deductions", "net"] },
  compliance: { tableId: "complianceTable", cols: ["employee", "module", "expiry", "status"] },
  incidents: { tableId: "incidentTable", cols: ["employee", "date", "incident", "resolution"] },
  performance: { tableId: "performanceTable", cols: ["employee", "reviewDate", "score", "notes"] }
};

let state = loadState();
let currentUser = null;
const currentPage = document.body.dataset.page;
let allowed = [];
let pendingAvatar = "";

function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (["admin", "administrator", "hr manager"].includes(value)) return "admin";
  if (["hr personnel", "hr officer", "hr"].includes(value)) return "hr personnel";
  if (value === "supervisor") return "supervisor";
  return "hr personnel";
}

function prettyRole(role) {
  const r = normalizeRole(role);
  if (r === "admin") return "Admin";
  if (r === "supervisor") return "Supervisor";
  return "HR Personnel";
}

function loadState() { try { return { ...structuredClone(defaultState), ...(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")) }; } catch { return structuredClone(defaultState); } }
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function getSessionUser() { return JSON.parse(localStorage.getItem("pharma_hr_session") || "null"); }
function getPrefsMap() { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"); }
function getUserPrefs(email) { return getPrefsMap()[email] || { theme: "light", avatar: "" }; }
function saveUserPrefs(email, prefs) { const map = getPrefsMap(); map[email] = { ...getUserPrefs(email), ...prefs }; localStorage.setItem(PREFS_KEY, JSON.stringify(map)); }
function currency(a) { return `$${Number(a).toFixed(2)}`; }
function applyTheme(t) { document.body.classList.toggle("dark-theme", t === "dark"); }

function setupAccessControl() {
  currentUser = getSessionUser();
  allowed = roleAccess[normalizeRole(currentUser?.role)] || roleAccess["hr personnel"];

  if (!allowed.includes(currentPage)) {
    window.location.href = "modules.html";
    return false;
  }

  document.querySelectorAll("[data-module-link]").forEach((link) => {
    if (!allowed.includes(link.dataset.moduleLink)) link.remove();
    else link.classList.toggle("active", link.dataset.moduleLink === currentPage);
  });

  document.querySelectorAll("[data-module-card]").forEach((card) => {
    if (!allowed.includes(card.dataset.moduleCard)) card.remove();
  });

  return true;
}

function updateProfileUI() {
  if (!currentUser) return;
  const prefs = getUserPrefs(currentUser.email);
  const avatarSrc = prefs.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=1f4aa9&color=fff`;
  document.querySelectorAll("#sessionAvatar").forEach((el) => { el.src = avatarSrc; });
  const nameEl = document.getElementById("sessionUserName");
  const roleEl = document.getElementById("sessionUserRole");
  if (nameEl) nameEl.textContent = currentUser.name;
  if (roleEl) roleEl.textContent = prettyRole(currentUser.role);
  const toggle = document.getElementById("themeToggle");
  if (toggle) toggle.checked = (prefs.theme || "light") === "dark";
  applyTheme(prefs.theme || "light");
}

function setupLogout() {
  const btn = document.getElementById("logoutBtn");
  btn?.addEventListener("click", () => {
    localStorage.removeItem("pharma_hr_session");
    window.location.href = "login.html";
  });
}

function renderTable(name) {
  const cfg = tableConfig[name];
  if (!cfg) return;
  const tbody = document.getElementById(cfg.tableId);
  if (!tbody) return;
  tbody.innerHTML = state[name].map((row, i) => `<tr>${cfg.cols.map((k) => `<td>${row[k] ?? ""}</td>`).join("")}<td><button class="danger-btn" data-delete="${name}" data-index="${i}" type="button">Delete</button></td></tr>`).join("");
}

function renderMetrics() {
  const metrics = document.getElementById("metrics");
  if (!metrics) return;
  const cards = [
    ["Total Employees", state.employees.length],
    ["Active Employees", state.employees.filter((e) => e.status === "Active").length],
    ["Candidates", state.recruitment.length],
    ["Pending Leaves", state.leaves.filter((l) => l.status === "Pending").length],
    ["Payroll Runs", state.payroll.length],
    ["Open Incidents", state.incidents.filter((i) => i.resolution !== "Resolved").length]
  ];
  metrics.innerHTML = cards.map(([t, v]) => `<article class="metric"><h3>${t}</h3><p>${v}</p></article>`).join("");
}

function drawBarChart(canvas, labels, values) { if (!canvas) return; const c = canvas.getContext("2d"); c.clearRect(0,0,canvas.width,canvas.height); const m=Math.max(...values,1),p=35,g=14,b=(canvas.width-p*2-g*(values.length-1))/values.length; values.forEach((v,i)=>{const x=p+i*(b+g),h=((canvas.height-80)*v)/m,y=canvas.height-40-h; const gr=c.createLinearGradient(0,y,0,canvas.height-40); gr.addColorStop(0,'#4f7df0'); gr.addColorStop(1,'#8fb2ff'); c.fillStyle=gr; c.fillRect(x,y,b,h); c.fillStyle=getComputedStyle(document.body).getPropertyValue('--text'); c.font='12px Inter'; c.fillText(labels[i],x,canvas.height-18);}); }
function drawLineChart(canvas, labels, values) { if(!canvas) return; const c=canvas.getContext('2d'); c.clearRect(0,0,canvas.width,canvas.height); const p=45,m=Math.max(...values,1); c.strokeStyle='#2b66da'; c.lineWidth=3; c.beginPath(); values.forEach((v,i)=>{const x=p+(i*(canvas.width-p*2))/Math.max(values.length-1,1); const y=canvas.height-p-(v/m)*(canvas.height-p*2); i?c.lineTo(x,y):c.moveTo(x,y);}); c.stroke(); }
function drawDonutChart(canvas, data) { if(!canvas) return; const c=canvas.getContext('2d'); c.clearRect(0,0,canvas.width,canvas.height); const t=data.reduce((s,i)=>s+i.value,0)||1; let st=-Math.PI/2; const cols=['#4e7cec','#35a96a','#efae45','#d45a5a']; data.forEach((d,i)=>{const sl=(d.value/t)*Math.PI*2; c.beginPath(); c.arc(140,canvas.height/2,80,st,st+sl); c.arc(140,canvas.height/2,50,st+sl,st,true); c.closePath(); c.fillStyle=cols[i%cols.length]; c.fill(); st+=sl;}); }

function renderCharts() {
  drawBarChart(document.getElementById("pipelineChart"), ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"], ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"].map((s) => state.recruitment.filter((r) => r.stage === s).length));
  const byMonth = {}; state.payroll.forEach((p) => { byMonth[p.month] = (byMonth[p.month] || 0) + Number(String(p.net).replace(/[^0-9.-]/g, "")); });
  const labels = Object.keys(byMonth).sort().slice(-6); const vals = labels.map((l) => byMonth[l]);
  drawLineChart(document.getElementById("payrollTrendChart"), labels.length ? labels : ["-"], vals.length ? vals : [0]);
  drawDonutChart(document.getElementById("leaveDonutChart"), [{ label: "Pending", value: state.leaves.filter((l) => l.status === "Pending").length }, { label: "Approved", value: state.leaves.filter((l) => l.status === "Approved").length }, { label: "Rejected", value: state.leaves.filter((l) => l.status === "Rejected").length }]);
}

function renderApprovals() {
  const leave = document.getElementById("approvalsLeaveTable");
  const incident = document.getElementById("approvalsIncidentTable");
  if (!leave || !incident) return;
  leave.innerHTML = state.leaves.map((r, i) => r.status === "Pending" ? `<tr><td>${r.employee}</td><td>${r.type}</td><td>${r.start}</td><td>${r.end}</td><td>${r.status}</td><td><button class="secondary-btn" data-approval="leave" data-index="${i}" data-action="Approved" type="button">Approve</button> <button class="danger-btn" data-approval="leave" data-index="${i}" data-action="Rejected" type="button">Reject</button></td></tr>` : "").join("");
  incident.innerHTML = state.incidents.map((r, i) => r.resolution !== "Resolved" ? `<tr><td>${r.employee}</td><td>${r.date}</td><td>${r.incident}</td><td>${r.resolution}</td><td><button class="secondary-btn" data-approval="incident" data-index="${i}" data-action="Resolved" type="button">Resolve</button></td></tr>` : "").join("");
}

function renderPage() {
  if (currentPage === "dashboard") { renderMetrics(); renderCharts(); return; }
  if (currentPage === "approvals") { renderApprovals(); return; }
  if (tableConfig[currentPage]) renderTable(currentPage);
}

function bindForms() {
  const bind = (id, collection, map = (d) => d) => {
    const form = document.getElementById(id);
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = map(Object.fromEntries(new FormData(form).entries()));
      state[collection].unshift(data);
      saveState();
      form.reset();
      renderPage();
    });
  };

  bind("employeeForm", "employees");
  bind("recruitForm", "recruitment");
  bind("shiftForm", "shifts");
  bind("attendanceForm", "attendance");
  bind("leaveForm", "leaves");
  bind("payrollForm", "payroll", (d) => {
    const gross = Number(d.basic) + Number(d.allowance);
    return { employee: d.employee, month: d.month, gross: currency(gross), deductions: currency(d.deductions), net: currency(gross - Number(d.deductions)) };
  });
  bind("complianceForm", "compliance");
  bind("incidentForm", "incidents");
  bind("performanceForm", "performance");
}

function bindSettings() {
  const form = document.getElementById("settingsForm");
  const toggle = document.getElementById("themeToggle");
  const message = document.getElementById("settingsMessage");
  if (!form || !currentUser) return;

  toggle?.addEventListener("change", () => {
    applyTheme(toggle.checked ? "dark" : "light");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const existing = getUserPrefs(currentUser.email);
    saveUserPrefs(currentUser.email, { theme: toggle.checked ? "dark" : "light", avatar: existing.avatar || "" });
    updateProfileUI();
    message.textContent = "Preferences saved.";
    message.className = "message success";
  });
}

function bindHub() {
  const search = document.getElementById("moduleSearch");
  const upload = document.getElementById("hubAvatarInput");
  const cards = [...document.querySelectorAll("[data-module-card]")];
  if (!search) return;

  search.addEventListener("input", () => {
    const term = search.value.trim().toLowerCase();
    cards.forEach((card) => {
      const txt = card.textContent.toLowerCase();
      card.classList.toggle("hidden", term && !txt.includes(term));
    });
  });

  upload?.addEventListener("change", () => {
    const file = upload.files?.[0];
    if (!file || !currentUser) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      pendingAvatar = String(e.target?.result || "");
      saveUserPrefs(currentUser.email, { avatar: pendingAvatar });
      updateProfileUI();
    };
    reader.readAsDataURL(file);
  });
}

function bindButtons() {
  document.querySelectorAll("[data-load]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state = loadState();
      if (btn.dataset.load === "settings") updateProfileUI();
      renderPage();
    });
  });

  document.addEventListener("click", (e) => {
    const del = e.target.closest("[data-delete]");
    if (del) {
      state[del.dataset.delete].splice(Number(del.dataset.index), 1);
      saveState();
      renderPage();
      return;
    }

    const ap = e.target.closest("[data-approval]");
    if (!ap) return;
    const i = Number(ap.dataset.index);
    if (ap.dataset.approval === "leave") state.leaves[i].status = ap.dataset.action;
    if (ap.dataset.approval === "incident") state.incidents[i].resolution = ap.dataset.action;
    saveState();
    renderApprovals();
  });
}

function init() {
  if (!setupAccessControl()) return;
  updateProfileUI();
  setupLogout();
  bindForms();
  bindSettings();
  bindHub();
  bindButtons();
  renderPage();
}

init();
