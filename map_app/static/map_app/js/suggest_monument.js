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
      const k = p.slice(0, i).trim();
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
  let isSubmitting = false;

  function setError(text) {
    const box = document.getElementById("suggest-monument-error");
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
    const r = document.getElementById("suggest-monument-region-dropdown");
    if (r) r.style.display = "none";
  }

  function renderRegionDropdown() {
    const dd = document.getElementById("suggest-monument-region-dropdown");
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

      const rv = document.getElementById("suggest-monument-region-value");
      if (rv) rv.textContent = region.name;

      closeAllDropdowns();
    };
  }

  function ensureScreen() {
    if (document.getElementById("suggest-monument-screen")) return;

    const el = document.createElement("div");
    el.id = "suggest-monument-screen";
    el.className = "quiz-screen";
    el.style.display = "none";

    el.innerHTML = `
      <div class="quiz-content">
        <div class="suggest-modal">
          <div class="suggest-header">
            <div class="suggest-title">Додати пам’ятку</div>
            <button id="suggest-monument-close-btn" class="suggest-close" type="button">✕</button>
          </div>

          <div class="suggest-body">
            <div class="suggest-field">
              <div class="suggest-label">Область</div>
              <div class="suggest-select" id="suggest-monument-region-select" role="button" tabindex="0">
                <span id="suggest-monument-region-value">Оберіть область</span>
                <span class="suggest-arrow">▾</span>
              </div>
              <div class="suggest-dropdown" id="suggest-monument-region-dropdown" style="display:none;"></div>
            </div>

            <div class="suggest-field">
              <div class="suggest-label">Назва</div>
              <input id="suggest-monument-name" class="suggest-file" type="text" placeholder="Напр.: Скелі Дениші" />
            </div>

            <div class="suggest-field">
              <div class="suggest-label">Опис</div>
              <textarea id="suggest-monument-description" class="suggest-textarea" rows="4" placeholder="Коротко опиши пам’ятку"></textarea>
            </div>

            <div class="suggest-field">
              <div class="suggest-label">Координати (широта)</div>
              <input id="suggest-monument-lat" class="suggest-file" type="text" placeholder="50.2..." />
            </div>

            <div class="suggest-field">
              <div class="suggest-label">Координати (довгота)</div>
              <input id="suggest-monument-lng" class="suggest-file" type="text" placeholder="28.6..." />
            </div>

            <div class="suggest-field">
              <div class="suggest-label">Фото</div>
              <input id="suggest-monument-file" class="suggest-file" type="file" accept="image/jpeg,image/png,image/webp" />
            </div>

            <div id="suggest-monument-error" class="suggest-error" style="display:none;"></div>

            <div class="suggest-actions">
              <button id="suggest-monument-submit" class="suggest-btn suggest-btn-primary" type="button">Надіслати на модерацію</button>
              <button id="suggest-monument-cancel" class="suggest-btn" type="button">Закрити</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(el);

    const closeBtn = document.getElementById("suggest-monument-close-btn");
    const cancelBtn = document.getElementById("suggest-monument-cancel");

    if (closeBtn) closeBtn.addEventListener("click", window.closeSuggestMonumentScreen);
    if (cancelBtn) cancelBtn.addEventListener("click", window.closeSuggestMonumentScreen);
  }

  window.openSuggestMonumentScreen = function () {
    if (typeof window.closeQuizScreen === "function") window.closeQuizScreen();
    if (typeof window.closeResultsScreen === "function") window.closeResultsScreen();
    if (typeof window.closeAuthScreen === "function") window.closeAuthScreen();
    if (typeof window.closeSuggestScreen === "function") window.closeSuggestScreen();

    const el = document.getElementById("suggest-monument-screen");
    if (!el) return;

    setError("");
    el.style.display = "flex";
  };

  window.closeSuggestMonumentScreen = function () {
    const el = document.getElementById("suggest-monument-screen");
    if (!el) return;

    closeAllDropdowns();
    setError("");
    el.style.display = "none";
  };

  async function submit() {
    if (isSubmitting) return;

    const nameEl = document.getElementById("suggest-monument-name");
    const descEl = document.getElementById("suggest-monument-description");
    const latEl = document.getElementById("suggest-monument-lat");
    const lngEl = document.getElementById("suggest-monument-lng");
    const fileEl = document.getElementById("suggest-monument-file");

    if (!selectedRegion) {
      setError("Оберіть область.");
      return;
    }

    const name = String(nameEl ? nameEl.value : "").trim();
    const description = String(descEl ? descEl.value : "").trim();
    const lat = String(latEl ? latEl.value : "").trim();
    const lng = String(lngEl ? lngEl.value : "").trim();

    if (!name) {
      setError("Вкажіть назву.");
      return;
    }
    if (!lat) {
      setError("Вкажіть широту.");
      return;
    }
    if (!lng) {
      setError("Вкажіть довготу.");
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

    const csrftoken = getCookie("csrftoken");
    if (!csrftoken) {
      setError("Немає CSRF токена. Оновіть сторінку.");
      return;
    }

    const fd = new FormData();
    fd.append("region", selectedRegion.internalName);
    fd.append("name", name);
    fd.append("description", description);
    fd.append("lat", lat);
    fd.append("lng", lng);
    fd.append("image", f);

    const btn = document.getElementById("suggest-monument-submit");
    if (btn) btn.disabled = true;

    isSubmitting = true;
    setError("");

    try {
      const resp = await fetch("/api/monuments/suggest/", {
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
        if (nameEl) nameEl.value = "";
        if (descEl) descEl.value = "";
        if (latEl) latEl.value = "";
        if (lngEl) lngEl.value = "";
        if (fileEl) fileEl.value = "";
        selectedRegion = null;
        const rv = document.getElementById("suggest-monument-region-value");
        if (rv) rv.textContent = "Оберіть область";
        alert("Пам’ятку надіслано на модерацію ✅");
        window.closeSuggestMonumentScreen();
      } else {
        setError("Невідома відповідь сервера.");
      }
    } catch (e) {
      setError("Не вдалося відправити запит.");
    } finally {
      isSubmitting = false;
      if (btn) btn.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!isAuthed()) return;

    ensureScreen();
    renderRegionDropdown();

    const btn = document.getElementById("suggest-monument-btn");
    if (btn) btn.addEventListener("click", window.openSuggestMonumentScreen);

    const regionSelect = document.getElementById("suggest-monument-region-select");
    const regionDd = document.getElementById("suggest-monument-region-dropdown");

    if (regionSelect && regionDd) {
      regionSelect.addEventListener("click", () => {
        const isOpen = regionDd.style.display === "block";
        closeAllDropdowns();
        regionDd.style.display = isOpen ? "none" : "block";
      });
    }

    const submitBtn = document.getElementById("suggest-monument-submit");
    if (submitBtn) submitBtn.addEventListener("click", submit);

    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!t) return;
      const inScreen = t.closest("#suggest-monument-screen");
      if (!inScreen) return;
      const inSelect = t.closest(".suggest-select");
      const inDropdown = t.closest(".suggest-dropdown");
      if (!inSelect && !inDropdown) closeAllDropdowns();
    });
  });
})();
