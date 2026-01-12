(function () {
  function isAuthed() {
    const authBtn = document.getElementById("auth-btn");
    if (!authBtn) return false;
    return authBtn.dataset.auth === "1";
  }

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

  const REGIONS = [
    { name: "Автономна Республіка Крим", isAvailable: false, internalName: "crimea" },
    { name: "Вінницька область", isAvailable: false, internalName: "vinnytsia" },
    { name: "Волинська область", isAvailable: false, internalName: "volyn" },
    { name: "Дніпропетровська область", isAvailable: false, internalName: "dnipro" },
    { name: "Донецька область", isAvailable: false, internalName: "donetsk" },
    { name: "Житомирська область", isAvailable: true, internalName: "zhytomyr" },
    { name: "Закарпатська область", isAvailable: false, internalName: "zakarpattia" },
    { name: "Запорізька область", isAvailable: false, internalName: "zaporizhzhia" },
    { name: "Івано-Франківська область", isAvailable: false, internalName: "ivano-frankivsk" },
    { name: "Київська область", isAvailable: false, internalName: "kyiv" },
    { name: "Кіровоградська область", isAvailable: false, internalName: "kyrovohrad" },
    { name: "Луганська область", isAvailable: false, internalName: "luhansk" },
    { name: "Львівська область", isAvailable: false, internalName: "lviv" },
    { name: "Миколаївська область", isAvailable: false, internalName: "mykolaiv" },
    { name: "Одеська область", isAvailable: false, internalName: "odesa" },
    { name: "Полтавська область", isAvailable: false, internalName: "poltava" },
    { name: "Рівненська область", isAvailable: false, internalName: "rivne" },
    { name: "Сумська область", isAvailable: false, internalName: "sumy" },
    { name: "Тернопільська область", isAvailable: false, internalName: "ternopil" },
    { name: "Харківська область", isAvailable: false, internalName: "kharkiv" },
    { name: "Херсонська область", isAvailable: false, internalName: "kherson" },
    { name: "Хмельницька область", isAvailable: false, internalName: "khmelnytskyi" },
    { name: "Черкаська область", isAvailable: false, internalName: "cherkasy" },
    { name: "Чернівецька область", isAvailable: false, internalName: "chernivtsi" },
    { name: "Чернігівська область", isAvailable: false, internalName: "chernihiv" }
  ];

  let selectedRegion = null;
  let selectedMonumentId = null;
  let isSubmitting = false;

  function setError(text) {
    const box = document.getElementById("suggest-error");
    if (!box) return;
    if (!text) {
      box.style.display = "none";
      box.textContent = "";
      return;
    }
    box.style.display = "block";
    box.textContent = text;
  }

  function closeAllDropdowns() {
    const r = document.getElementById("suggest-region-dropdown");
    const m = document.getElementById("suggest-monument-dropdown");
    if (r) r.style.display = "none";
    if (m) m.style.display = "none";
  }

  function getMonumentsForRegion(regionKey) {
    if (regionKey === "zhytomyr") {
      if (window.getZhytomyrData) return window.getZhytomyrData();
      if (window.zhytomyrQuizSourceData) return window.zhytomyrQuizSourceData;
      return [];
    }
    return [];
  }

  function renderRegionDropdown() {
    const dd = document.getElementById("suggest-region-dropdown");
    if (!dd) return;

    const sorted = [...REGIONS].sort((a, b) => a.name.localeCompare(b.name));

    dd.innerHTML = sorted
      .map((r) => {
        if (r.isAvailable) {
          return `
            <div class="suggest-option" data-region="${escapeHtml(r.internalName)}">
              <span>${escapeHtml(r.name)}</span>
              <span class="suggest-ok">✅</span>
            </div>
          `;
        }
        return `
          <div class="suggest-option suggest-option-disabled">
            <span>${escapeHtml(r.name)}</span>
          </div>
        `;
      })
      .join("");

    dd.onclick = (e) => {
      const opt = e.target.closest("[data-region]");
      if (!opt) return;
      const key = opt.getAttribute("data-region");
      if (!key) return;

      const region = REGIONS.find((x) => x.internalName === key);
      if (!region || !region.isAvailable) return;

      selectedRegion = region;
      selectedMonumentId = null;

      const rv = document.getElementById("suggest-region-value");
      if (rv) rv.textContent = region.name;

      const mv = document.getElementById("suggest-monument-value");
      if (mv) mv.textContent = "Оберіть пам’ятку";

      const msel = document.getElementById("suggest-monument-select");
      if (msel) msel.classList.remove("suggest-disabled");

      renderMonumentDropdown();
      closeAllDropdowns();
    };
  }

  function renderMonumentDropdown() {
    const dd = document.getElementById("suggest-monument-dropdown");
    if (!dd) return;

    if (!selectedRegion) {
      dd.innerHTML = "";
      return;
    }

    const monuments = getMonumentsForRegion(selectedRegion.internalName);
    const sorted = [...monuments].sort((a, b) => String(a.name).localeCompare(String(b.name)));

    dd.innerHTML = sorted
      .map((m) => {
        return `
          <div class="suggest-option" data-monument="${escapeHtml(String(m.id))}">
            <span>${escapeHtml(m.name)}</span>
          </div>
        `;
      })
      .join("");

    dd.onclick = (e) => {
      const opt = e.target.closest("[data-monument]");
      if (!opt) return;
      const id = opt.getAttribute("data-monument");
      if (!id) return;

      selectedMonumentId = String(id);
      const mv = document.getElementById("suggest-monument-value");
      const selected = sorted.find((x) => String(x.id) === selectedMonumentId);
      if (mv) mv.textContent = selected ? selected.name : "Обрано";

      closeAllDropdowns();
    };
  }

  function ensureSuggestScreen() {
    if (document.getElementById("suggest-screen")) return;

    const el = document.createElement("div");
    el.id = "suggest-screen";
    el.className = "quiz-screen";
    el.style.display = "none";

    el.innerHTML = `
      <div class="quiz-content">
        <div class="suggest-modal">
          <div class="suggest-header">
            <div class="suggest-title">Запропонувати зміни</div>
            <button id="suggest-close-btn" class="suggest-close" type="button">✕</button>
          </div>

          <div class="suggest-body">
            <div class="suggest-field">
              <div class="suggest-label">Область</div>
              <div class="suggest-select" id="suggest-region-select" role="button" tabindex="0">
                <span id="suggest-region-value">Оберіть область</span>
                <span class="suggest-arrow">▾</span>
              </div>
              <div class="suggest-dropdown" id="suggest-region-dropdown" style="display:none;"></div>
            </div>

            <div class="suggest-field">
              <div class="suggest-label">Пам’ятка</div>
              <div class="suggest-select suggest-disabled" id="suggest-monument-select" role="button" tabindex="0">
                <span id="suggest-monument-value">Спочатку оберіть область</span>
                <span class="suggest-arrow">▾</span>
              </div>
              <div class="suggest-dropdown" id="suggest-monument-dropdown" style="display:none;"></div>
            </div>

            <div class="suggest-field">
              <div class="suggest-label">Фото</div>
              <input id="suggest-file" class="suggest-file" type="file" accept="image/jpeg,image/png,image/webp" />
            </div>

            <div class="suggest-field">
              <div class="suggest-label">Коментар (необов’язково)</div>
              <textarea id="suggest-comment" class="suggest-textarea" rows="3" placeholder="Наприклад: де зроблено фото, що на ньому, чому важливо"></textarea>
            </div>

            <div id="suggest-error" class="suggest-error" style="display:none;"></div>

            <div class="suggest-actions">
              <button id="suggest-submit" class="suggest-btn suggest-btn-primary" type="button">Надіслати на модерацію</button>
              <button id="suggest-cancel" class="suggest-btn" type="button">Закрити</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(el);

    const closeBtn = document.getElementById("suggest-close-btn");
    const cancelBtn = document.getElementById("suggest-cancel");
    if (closeBtn) closeBtn.addEventListener("click", window.closeSuggestScreen);
    if (cancelBtn) cancelBtn.addEventListener("click", window.closeSuggestScreen);
  }

  function setSubmitEnabled(enabled) {
    const btn = document.getElementById("suggest-submit");
    if (!btn) return;
    btn.disabled = !enabled;
    btn.style.opacity = enabled ? "" : "0.7";
    btn.style.cursor = enabled ? "" : "not-allowed";
  }

  window.openSuggestScreen = function () {
    if (typeof window.closeQuizScreen === "function") window.closeQuizScreen();
    if (typeof window.closeResultsScreen === "function") window.closeResultsScreen();
    if (typeof window.closeAuthScreen === "function") window.closeAuthScreen();

    const el = document.getElementById("suggest-screen");
    if (!el) return;

    el.style.display = "flex";
  };

  window.closeSuggestScreen = function () {
    const el = document.getElementById("suggest-screen");
    if (!el) return;

    closeAllDropdowns();
    setError("");
    el.style.display = "none";
  };

  function formatBackendErrors(payload) {
    if (!payload) return "Помилка.";
    if (payload.error && typeof payload.error === "string") return payload.error;
    if (payload.errors && typeof payload.errors === "object") {
      const lines = [];
      for (const k of Object.keys(payload.errors)) {
        const v = payload.errors[k];
        if (Array.isArray(v)) lines.push(`${k}: ${v.join(" ")}`);
        else if (typeof v === "string") lines.push(`${k}: ${v}`);
      }
      if (lines.length) return lines.join("\n");
    }
    return "Помилка.";
  }

  async function submitSuggestion() {
    if (isSubmitting) return;

    const file = document.getElementById("suggest-file");
    const comment = document.getElementById("suggest-comment");

    if (!selectedRegion) {
      setError("Оберіть область.");
      return;
    }
    if (!selectedMonumentId) {
      setError("Оберіть пам’ятку.");
      return;
    }
    if (!file || !file.files || !file.files[0]) {
      setError("Оберіть файл зображення.");
      return;
    }

    const f = file.files[0];
    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(f.type)) {
      setError("Непідтримуваний формат. Дозволено: JPG, PNG, WEBP.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Файл завеликий. Максимум 5 MB.");
      return;
    }

    const c = comment ? String(comment.value || "").trim() : "";
    setError("");

    const token = getCookie("csrftoken");
    if (!token) {
      setError("Немає CSRF токена. Оновіть сторінку.");
      return;
    }

    const fd = new FormData();
    fd.append("region", selectedRegion.internalName);
    fd.append("monument_id", selectedMonumentId);
    fd.append("image", f);
    if (c) fd.append("comment", c);

    isSubmitting = true;
    setSubmitEnabled(false);

    let res;
    let payload = null;

    try {
      res = await fetch("/api/suggestions/submit/", {
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
      setError("Не вдалося надіслати запит. Перевір інтернет або сервер.");
      return;
    }

    if (!res || !res.ok) {
      isSubmitting = false;
      setSubmitEnabled(true);
      setError(formatBackendErrors(payload) || `Помилка: ${res ? res.status : ""}`);
      return;
    }

    const fileInput = document.getElementById("suggest-file");
    const commentInput = document.getElementById("suggest-comment");
    if (fileInput) fileInput.value = "";
    if (commentInput) commentInput.value = "";

    selectedMonumentId = null;
    const mv = document.getElementById("suggest-monument-value");
    if (mv) mv.textContent = "Оберіть пам’ятку";

    isSubmitting = false;
    setSubmitEnabled(true);
    window.closeSuggestScreen();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!isAuthed()) return;

    ensureSuggestScreen();

    const btn = document.getElementById("suggest-btn");
    if (btn) btn.addEventListener("click", window.openSuggestScreen);

    renderRegionDropdown();

    const regionSelect = document.getElementById("suggest-region-select");
    const regionDd = document.getElementById("suggest-region-dropdown");

    const monumentSelect = document.getElementById("suggest-monument-select");
    const monumentDd = document.getElementById("suggest-monument-dropdown");

    if (regionSelect && regionDd) {
      regionSelect.addEventListener("click", () => {
        const isOpen = regionDd.style.display === "block";
        closeAllDropdowns();
        regionDd.style.display = isOpen ? "none" : "block";
      });
    }

    if (monumentSelect && monumentDd) {
      monumentSelect.addEventListener("click", () => {
        if (!selectedRegion) return;
        if (monumentSelect.classList.contains("suggest-disabled")) return;
        const isOpen = monumentDd.style.display === "block";
        closeAllDropdowns();
        monumentDd.style.display = isOpen ? "none" : "block";
      });
    }

const submitBtn = document.getElementById("suggest-submit");
if (submitBtn) {
  submitBtn.addEventListener("click", async () => {
    const fileEl = document.getElementById("suggest-file");
    const commentEl = document.getElementById("suggest-comment");

    if (!selectedRegion) {
      setError("Оберіть область.");
      return;
    }
    if (!selectedMonumentId) {
      setError("Оберіть пам’ятку.");
      return;
    }
    if (!fileEl || !fileEl.files || !fileEl.files[0]) {
      setError("Оберіть файл зображення.");
      return;
    }

    const f = fileEl.files[0];
    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(f.type)) {
      setError("Непідтримуваний формат. Дозволено: JPG, PNG, WEBP.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Файл завеликий. Максимум 5 MB.");
      return;
    }

    const comment = commentEl ? String(commentEl.value || "").trim() : "";
    setError("");

    const csrftoken = (() => {
      const parts = String(document.cookie || "").split("; ").filter(Boolean);
      for (const p of parts) {
        const i = p.indexOf("=");
        if (i === -1) continue;
        const k = p.slice(0, i).trim();
        const v = p.slice(i + 1);
        if (k === "csrftoken") return decodeURIComponent(v);
      }
      return "";
    })();

    const fd = new FormData();
    fd.append("region", selectedRegion.internalName);
    fd.append("monument_id", selectedMonumentId);
    fd.append("comment", comment);
    fd.append("image", f);

    submitBtn.disabled = true;

    try {
      const resp = await fetch("/api/suggestions/submit/", {
        method: "POST",
        credentials: "same-origin",
        headers: { "X-CSRFToken": csrftoken },
        body: fd
      });

      const text = await resp.text();
      let data = null;
      try { data = JSON.parse(text); } catch (e) {}

      if (!resp.ok) {
        if (data && data.errors) {
          const flat = Object.values(data.errors).flat().join("\n");
          setError(flat || "Помилка відправки.");
        } else if (data && data.error) {
          setError(String(data.error));
        } else {
          setError(text || "Помилка відправки.");
        }
        return;
      }

      if (data && data.ok) {
        fileEl.value = "";
        if (commentEl) commentEl.value = "";
        selectedMonumentId = null;
        const mv = document.getElementById("suggest-monument-value");
        if (mv) mv.textContent = "Оберіть пам’ятку";
        alert("Фото надіслано на модерацію ✅");
      } else {
        setError("Невідома відповідь сервера.");
      }
    } catch (e) {
      setError("Не вдалося відправити запит.");
    } finally {
      submitBtn.disabled = false;
    }
  });
}


    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!t) return;
      const inSuggest = t.closest("#suggest-screen");
      if (!inSuggest) return;
      const inSelect = t.closest(".suggest-select");
      const inDropdown = t.closest(".suggest-dropdown");
      if (!inSelect && !inDropdown) closeAllDropdowns();
    });
  });
})();
