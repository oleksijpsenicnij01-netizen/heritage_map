(function () {
  const authScreen = document.getElementById("auth-screen");
  const authBtn = document.getElementById("auth-btn");
  const closeBtn = document.getElementById("auth-close-btn");

  const tabBtns = document.querySelectorAll(".auth-tab-btn");
  const tabLogin = document.getElementById("auth-tab-login");
  const tabRegister = document.getElementById("auth-tab-register");

  const loginForm = document.getElementById("auth-login-form");
  const signupForm = document.getElementById("auth-signup-form");
  const errorsBox = document.getElementById("auth-errors");

  function openAuth() {
    if (!authScreen) return;
    authScreen.style.display = "flex";
  }

  function clearErrors() {
    if (!errorsBox) return;
    errorsBox.style.display = "none";
    errorsBox.textContent = "";
  }

  function closeAuth() {
    if (!authScreen) return;
    authScreen.style.display = "none";
    clearErrors();
  }

  function setTab(tab) {
    tabBtns.forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
    if (!tabLogin || !tabRegister) return;
    tabLogin.style.display = (tab === "login") ? "block" : "none";
    tabRegister.style.display = (tab === "register") ? "block" : "none";
    clearErrors();
  }

  function showError(text) {
    if (!errorsBox) return;
    errorsBox.textContent = text;
    errorsBox.style.display = "block";
  }

  async function submitFormAjax(form) {
    clearErrors();
    if (!form) return;

    const url = form.getAttribute("action");
    const formData = new FormData(form);

    let resp;
    try {
      resp = await fetch(url, {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        body: formData,
        credentials: "same-origin",
      });
    } catch {
      showError("Помилка мережі. Спробуйте ще раз.");
      return;
    }

    let data;
    try {
      data = await resp.json();
    } catch {
      showError("Помилка відповіді сервера.");
      return;
    }

    if (data.ok) {
      location.reload();
      return;
    }

    const errors = data.errors || {};
    const messages = [];
    Object.keys(errors).forEach((key) => {
      const arr = errors[key] || [];
      arr.forEach((msg) => messages.push(msg));
    });

    showError(messages.length ? messages.join("\n") : "Перевірте введені дані.");
  }

  if (authBtn) authBtn.addEventListener("click", openAuth);
  if (closeBtn) closeBtn.addEventListener("click", closeAuth);

  tabBtns.forEach(btn => btn.addEventListener("click", () => setTab(btn.dataset.tab)));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAuth();
  });

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      submitFormAjax(loginForm);
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      submitFormAjax(signupForm);
    });
  }

  if (tabBtns.length) setTab("login");

  function showBlockError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = "block";
    el.textContent = msg;
  }

function hideBlockError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("success");
  el.style.display = "none";
  el.textContent = "";
}

  async function postForm(url, form) {
    const formData = new FormData(form);
    const resp = await fetch(url, {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
      body: formData,
      credentials: "same-origin",
    });

    let data = null;
    try {
      data = await resp.json();
    } catch {
      data = { ok: false, errors: { "__all__": ["Помилка відповіді сервера."] } };
    }

    return { resp, data };
  }

  const profileForm = document.getElementById("profile-form");
  const passwordForm = document.getElementById("password-form");
  const passwordSetForm = document.getElementById("password-set-form");


  const editBtn = document.getElementById("profile-edit-btn");
  const cancelBtn = document.getElementById("profile-cancel-btn");
  const saveBtn = document.getElementById("profile-save-btn");

const actions = document.getElementById("profile-actions");
const logoutForm = document.getElementById("logout-form");

const profileMeta = document.getElementById("profile-meta");
const passChangeBlock = document.getElementById("password-section");
const passSetBlock = document.getElementById("password-set-section");

  const usernameInput = document.getElementById("profile-username");
  const emailInput = document.getElementById("profile-email");

  let originalProfile = null;

function setEditMode(isEdit) {
  if (usernameInput) usernameInput.disabled = !isEdit;
  if (emailInput) emailInput.disabled = !isEdit;

  if (actions) actions.style.display = isEdit ? "flex" : "none";
  if (logoutForm) logoutForm.style.display = isEdit ? "none" : "block";

  const hasPass = profileMeta && profileMeta.dataset.hasPass === "1";

  if (passChangeBlock) passChangeBlock.style.display = (isEdit && hasPass) ? "block" : "none";
  if (passSetBlock) passSetBlock.style.display = (isEdit && !hasPass) ? "block" : "none";

const closeBtn = document.getElementById("auth-close-btn");
if (closeBtn) {
  closeBtn.style.setProperty(
    "display",
    isEdit ? "none" : "inline-block",
    "important"
  );
}

}


  if (editBtn && usernameInput && emailInput) {
    editBtn.addEventListener("click", () => {
      originalProfile = {
        username: usernameInput.value,
        email: emailInput.value
      };
      setEditMode(true);
      usernameInput.focus();
    });
  }

  if (cancelBtn && usernameInput && emailInput) {
    cancelBtn.addEventListener("click", () => {
      if (originalProfile) {
        usernameInput.value = originalProfile.username;
        emailInput.value = originalProfile.email;
      }
      hideBlockError("profile-errors");
      hideBlockError("password-errors");
      setEditMode(false);
    });
  }

  if (saveBtn && profileForm) {
    saveBtn.addEventListener("click", async () => {
      hideBlockError("profile-errors");

      try {
        const { data } = await postForm("/api/profile/", profileForm);
        if (data.ok) {
          location.reload();
          return;
        }
        const errors = data.errors || {};
        const msgs = Object.values(errors).flat();
        showBlockError("profile-errors", msgs.length ? msgs.join("\n") : "Помилка збереження.");
      } catch {
        showBlockError("profile-errors", "Помилка мережі.");
      }
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideBlockError("password-errors");

      try {
        const { data } = await postForm("/api/password/", passwordForm);
        if (data.ok) {
          const pe = document.getElementById("password-errors");
if (pe) pe.classList.add("success");
showBlockError("password-errors", "Пароль успішно змінено.");

          return;
        }
        const errors = data.errors || {};
        const msgs = Object.values(errors).flat();
        showBlockError("password-errors", msgs.length ? msgs.join("\n") : "Помилка зміни паролю.");
      } catch {
        showBlockError("password-errors", "Помилка мережі.");
      }
    });
  }

  if (passwordSetForm) {
  passwordSetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideBlockError("password-set-errors");

    try {
      const { data } = await postForm("/api/password/set/", passwordSetForm);
      if (data.ok) {
        location.reload();
        return;
      }
      const errors = data.errors || {};
      const msgs = Object.values(errors).flat();
      showBlockError("password-set-errors", msgs.length ? msgs.join("\n") : "Помилка створення паролю.");
    } catch {
      showBlockError("password-set-errors", "Помилка мережі.");
    }
  });
}


  setEditMode(false);
})();
