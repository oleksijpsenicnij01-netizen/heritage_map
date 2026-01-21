(function () {
  function getCookie(name) {
    const parts = String(document.cookie || "").split("; ").filter(Boolean);
    for (const p of parts) {
      const i = p.indexOf("=");
      if (i === -1) continue;
      const k = p.slice(0, i);
      const v = p.slice(i + 1);
      if (k === name) return decodeURIComponent(v);
    }
    return "";
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  let isSubmitting = false;

  function setError(text) {
    const box = document.getElementById("contact-error");
    if (!box) return;
    if (!text) {
      box.style.display = "none";
      box.textContent = "";
      return;
    }
    box.style.display = "block";
    box.textContent = text;
  }

  function setSubmitEnabled(enabled) {
    const b = document.getElementById("contact-submit-btn");
    if (!b) return;
    b.disabled = !enabled;
    b.classList.toggle("suggest-disabled", !enabled);
  }

  function ensureContactScreen() {
    if (document.getElementById("contact-screen")) return;

    const el = document.createElement("div");
    el.id = "contact-screen";
    el.className = "quiz-screen";
    el.style.display = "none";

    el.innerHTML = `
      <div class="quiz-content">
        <div class="suggest-modal">
          <div class="suggest-header">
            <div class="suggest-title">Звʼязатися з автором</div>
            <button id="contact-close-btn" class="suggest-close" type="button">✕</button>
          </div>

          <div class="suggest-body">
            <div id="contact-error" class="suggest-error" style="display:none;"></div>

            <div class="suggest-field">
              <div class="suggest-label">Імʼя (необовʼязково)</div>
            <input id="contact-name" class="suggest-text" type="text" maxlength="200" placeholder="" />
            </div>

            <div class="suggest-field">
              <div class="suggest-label">Контакт для відповіді (необовʼязково)</div>
              <input id="contact-contact" class="suggest-text" type="text" maxlength="200" placeholder="Email / Telegram @username" />
            </div>

            <div class="suggest-field">
              <div class="suggest-label">Повідомлення</div>
              <textarea id="contact-message" class="suggest-textarea" rows="5" maxlength="2000" placeholder="Напишіть, що ви хочете повідомити або запропонувати"></textarea>
            </div>
          </div>

<div class="suggest-actions">
  <button id="contact-close2-btn" class="suggest-btn suggest-btn-secondary" type="button">Закрити</button>
  <button id="contact-submit-btn" class="suggest-btn" type="button">Надіслати</button>
</div>

        </div>
      </div>
    `;

    document.body.appendChild(el);

    const closeBtn = document.getElementById("contact-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", window.closeContactScreen);

    const submitBtn = document.getElementById("contact-submit-btn");
    if (submitBtn) submitBtn.addEventListener("click", submit);
    const close2Btn = document.getElementById("contact-close2-btn");
if (close2Btn) close2Btn.addEventListener("click", window.closeContactScreen);


  }

  async function submit() {
    if (isSubmitting) return;
    setError("");

    const token = getCookie("csrftoken");
    const name = (document.getElementById("contact-name")?.value || "").trim();
    const contact = (document.getElementById("contact-contact")?.value || "").trim();
    const message = (document.getElementById("contact-message")?.value || "").trim();

    if (!message) {
      setError("Напишіть повідомлення.");
      return;
    }

    isSubmitting = true;
    setSubmitEnabled(false);

    const fd = new FormData();
    fd.append("name", name);
    fd.append("contact", contact);
    fd.append("message", message);

    let res;
    let payload = null;
    try {
      res = await fetch("/api/contact/submit/", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
        headers: {
          "X-CSRFToken": token
        }
      });
      payload = await res.json().catch(() => null);
    } catch (e) {
      isSubmitting = false;
      setSubmitEnabled(true);
      setError("Не вдалося надіслати. Перевір інтернет або сервер.");
      return;
    }

    if (!res || !res.ok || !payload || !payload.ok) {
      isSubmitting = false;
      setSubmitEnabled(true);
      const msg = payload && payload.errors
        ? Object.values(payload.errors).flat().map(escapeHtml).join("\n")
        : `Помилка: ${res ? res.status : ""}`;
      setError(msg);
      return;
    }

    const nm = document.getElementById("contact-name");
    const ct = document.getElementById("contact-contact");
    const ms = document.getElementById("contact-message");
    if (nm) nm.value = "";
    if (ct) ct.value = "";
    if (ms) ms.value = "";

    isSubmitting = false;
    setSubmitEnabled(true);
    window.closeContactScreen();
  }

window.openContactScreen = function () {
  if (typeof window.closeSuggestScreen === "function") window.closeSuggestScreen();
  if (typeof window.closeSuggestMonumentScreen === "function") window.closeSuggestMonumentScreen();
  if (typeof window.closeQuizScreen === "function") window.closeQuizScreen();
  if (typeof window.closeResultsScreen === "function") window.closeResultsScreen();
  if (typeof window.closeAuthScreen === "function") window.closeAuthScreen();

  ensureContactScreen();
  const screen = document.getElementById("contact-screen");
  if (screen) screen.style.display = "flex";
};


  window.closeContactScreen = function () {
    const screen = document.getElementById("contact-screen");
    if (screen) screen.style.display = "none";
    setError("");
  };

  document.addEventListener("DOMContentLoaded", () => {
    ensureContactScreen();
    const btn = document.getElementById("contact-btn");
    if (btn) btn.addEventListener("click", window.openContactScreen);
  });
})();
