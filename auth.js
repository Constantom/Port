const USERS_KEY = "pharma_hr_users";
const SESSION_KEY = "pharma_hr_session";
const PREFS_KEY = "pharma_hr_user_prefs";
const PROTECTED_PAGES = [
  "dashboard.html",
  "approvals.html",
  "employees.html",
  "recruitment.html",
  "shifts.html",
  "attendance.html",
  "leaves.html",
  "payroll.html",
  "compliance.html",
  "incidents.html",
  "performance.html",
  "settings.html"
];

function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (["admin", "administrator", "hr manager"].includes(value)) return "admin";
  if (["hr personnel", "hr officer", "hr"].includes(value)) return "hr personnel";
  if (value === "supervisor") return "supervisor";
  return "hr personnel";
}

function getUsers() { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); }
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function getSessionUser() { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
function setSessionUser(user) { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); }
function clearSessionUser() { localStorage.removeItem(SESSION_KEY); }

function getUserPrefs(email) {
  const map = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
  return map[email] || { theme: "light", avatar: "" };
}

function applyThemeFromSession() {
  const session = getSessionUser();
  if (!session?.email) return;
  const prefs = getUserPrefs(session.email);
  document.body.classList.toggle("dark-theme", prefs.theme === "dark");
}

function requireAuth() {
  const path = window.location.pathname.split("/").pop();
  if (!PROTECTED_PAGES.includes(path)) return;
  const session = getSessionUser();
  if (!session) window.location.href = "login.html";
}

function bindRegister() {
  const form = document.getElementById("registerForm");
  if (!form) return;
  const message = document.getElementById("registerMessage");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const users = getUsers();
    if (users.some((user) => user.email === data.email)) {
      message.textContent = "This email is already registered.";
      message.className = "message error";
      return;
    }
    users.push({ name: data.name, email: data.email, password: data.password, role: normalizeRole(data.role) });
    saveUsers(users);
    message.textContent = "Account created successfully. Redirecting to login...";
    message.className = "message success";
    form.reset();
    setTimeout(() => { window.location.href = "login.html"; }, 800);
  });
}

function bindLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  const message = document.getElementById("loginMessage");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const user = getUsers().find((u) => u.email === data.email && u.password === data.password);
    if (!user) {
      message.textContent = "Invalid email or password.";
      message.className = "message error";
      return;
    }
    setSessionUser({ name: user.name, email: user.email, role: normalizeRole(user.role) });
    message.textContent = "Login successful. Redirecting...";
    message.className = "message success";
    setTimeout(() => { window.location.href = "dashboard.html"; }, 400);
  });
}

function bindLogoutPublic() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    clearSessionUser();
    window.location.href = "login.html";
  });
}

applyThemeFromSession();
requireAuth();
bindRegister();
bindLogin();
bindLogoutPublic();
