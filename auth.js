const USERS_KEY = "pharma_hr_users";
const SESSION_KEY = "pharma_hr_session";

function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (["admin", "administrator", "hr manager"].includes(value)) return "admin";
  if (["hr personnel", "hr officer", "hr"].includes(value)) return "hr personnel";
  if (value === "supervisor") return "supervisor";
  return "hr personnel";
}

function prettyRole(role) {
  const normalized = normalizeRole(role);
  if (normalized === "admin") return "Admin";
  if (normalized === "supervisor") return "Supervisor";
  return "HR Personnel";
}

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSessionUser() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
}

function setSessionUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSessionUser() {
  localStorage.removeItem(SESSION_KEY);
}

function requireAuth() {
  if (!window.location.pathname.endsWith("dashboard.html")) return;
  const sessionUser = getSessionUser();
  if (!sessionUser) {
    window.location.href = "login.html";
    return;
  }

  const sessionUserLabel = document.getElementById("sessionUser");
  if (sessionUserLabel) {
    sessionUserLabel.textContent = `${sessionUser.name} (${prettyRole(sessionUser.role)})`;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      clearSessionUser();
      window.location.href = "login.html";
    });
  }
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

    users.push({
      name: data.name,
      email: data.email,
      password: data.password,
      role: normalizeRole(data.role)
    });

    saveUsers(users);
    message.textContent = "Account created successfully. Redirecting to login...";
    message.className = "message success";
    form.reset();
    setTimeout(() => {
      window.location.href = "login.html";
    }, 900);
  });
}

function bindLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const message = document.getElementById("loginMessage");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const users = getUsers();

    const foundUser = users.find(
      (user) => user.email === data.email && user.password === data.password
    );

    if (!foundUser) {
      message.textContent = "Invalid email or password.";
      message.className = "message error";
      return;
    }

    const sessionUser = {
      name: foundUser.name,
      email: foundUser.email,
      role: normalizeRole(foundUser.role)
    };
    setSessionUser(sessionUser);
    message.textContent = "Login successful. Redirecting...";
    message.className = "message success";
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 500);
  });
}

requireAuth();
bindRegister();
bindLogin();
