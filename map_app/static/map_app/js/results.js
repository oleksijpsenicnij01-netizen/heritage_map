(function () {
  const resultsScreen = document.getElementById("results-screen");
  const resultsBody = document.getElementById("results-body");
  const resultsTitle = document.getElementById("results-title");
  const closeTopBtn = document.getElementById("close-results-btn");

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
    { name: "Кіровоградська область", isAvailable: false, internalName: "kirovohrad" },
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

  const GAME_CATALOG = [
    { key: "match_photo", name: "Співпадання (Назва & Фото)" },
    { key: "match_description", name: "Співпадання (Назва & Опис)" },
    { key: "chronology", name: "Хронологія" },
    { key: "location", name: "Де знаходиться?" }
  ];

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function fetchByRegion(regionKey) {
    const url1 = `/api/my-results/?region=${encodeURIComponent(regionKey)}`;
    const url2 = `/api/results/by-region/?region=${encodeURIComponent(regionKey)}`;

    let res = null;

    try {
      res = await fetch(url1, { headers: { Accept: "application/json" } });
      if (res.status === 404) {
        res = await fetch(url2, { headers: { Accept: "application/json" } });
      }
    } catch (e) {
      return { ok: false, error: "NETWORK" };
    }

    if (!res) return { ok: false, error: "NETWORK" };
    if (res.status === 401 || res.status === 403) return { ok: false, error: "AUTH" };
    if (!res.ok) return { ok: false, error: "SERVER" };

    const data = await res.json();
    return { ok: true, data };
  }

  function show() {
    if (!resultsScreen) return;
    if (closeTopBtn) closeTopBtn.style.display = "none";
    resultsScreen.style.display = "flex";
    resultsScreen.classList.add("active");
    renderRegions();
  }

  function close() {
    if (!resultsScreen) return;
    resultsScreen.classList.remove("active");
    resultsScreen.style.display = "none";
    if (resultsBody) resultsBody.innerHTML = "";
  }

  function renderRegions() {
    if (!resultsTitle || !resultsBody) return;

    resultsTitle.textContent = "Виберіть область для перегляду результатів";

    const sorted = [...REGIONS].sort((a, b) => a.name.localeCompare(b.name));

    const regionBlocks = sorted
      .map((r) => {
        if (r.isAvailable) {
          return `
            <div class="region-block active" data-region="${escapeHtml(r.internalName)}">
              <span>${escapeHtml(r.name)}</span>
              <span class="check-mark">✅</span>
            </div>
          `;
        }
        return `
          <div class="region-block disabled">
            <span>${escapeHtml(r.name)}</span>
          </div>
        `;
      })
      .join("");

    resultsBody.innerHTML = `
      <div class="results-region-wrap">
<div id="results-region-list">
  ${regionBlocks}
</div>

        <div class="results-bottom">
          <button id="results-close-bottom" class="quiz-control-btn" type="button">❌ Закрити</button>
        </div>
      </div>
    `;

const regionList = resultsBody.querySelector("#results-region-list");
if (regionList) {
  regionList.addEventListener("click", (e) => {
    const block = e.target.closest("[data-region]");
    if (!block) return;
    const key = block.getAttribute("data-region");
    if (!key) return;
    renderTable(key);
  });
}


    const closeBottom = document.getElementById("results-close-bottom");
    if (closeBottom) closeBottom.addEventListener("click", close);
  }

  async function renderTable(regionKey) {
    if (!resultsTitle || !resultsBody) return;

    resultsTitle.textContent = "Мої результати";
    resultsBody.innerHTML = `<div class="loading">Завантаження...</div>`;

    const resp = await fetchByRegion(regionKey);

    if (!resp.ok) {
      const msg =
        resp.error === "AUTH"
          ? "Увійдіть у профіль, щоб бачити результати."
          : "Помилка завантаження результатів.";

resultsBody.innerHTML = `
  <div class="results-region-wrap">
    <div id="results-region-list">
      ${regionBlocks}
    </div>

    <div class="results-bottom">
      <button id="results-close-bottom" class="quiz-control-btn" type="button">❌ Закрити</button>
    </div>
  </div>
`;

      const c = document.getElementById("results-close-bottom2");
      if (c) c.addEventListener("click", close);
      return;
    }

    const items = Array.isArray(resp.data.results) ? resp.data.results : [];
    const byKey = {};
    for (const it of items) {
      if (it && it.game_key) byKey[it.game_key] = it;
    }

    const rows = GAME_CATALOG.map((g) => {
      const it = byKey[g.key];
const TOTAL = 9;

const raw = it && it.best_score !== undefined && it.best_score !== null ? Number(it.best_score) : null;
const score = Number.isFinite(raw) ? `${raw}/${TOTAL}` : "—";

      return `
        <tr>
          <td>${escapeHtml(g.name)}</td>
          <td>${escapeHtml(score)}</td>
        </tr>
      `;
    }).join("");

    resultsBody.innerHTML = `
      <div class="results-table-wrap">
        <table class="results-table">
          <thead>
            <tr>
              <th>Гра</th>
              <th>Рекорд</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>

      <div class="results-bottom results-bottom-actions">
        <button id="results-back-btn" class="quiz-control-btn" type="button">← Назад</button>
        <button id="results-close-bottom3" class="quiz-control-btn" type="button">❌ Закрити</button>
      </div>
    `;

    const back = document.getElementById("results-back-btn");
    if (back) back.addEventListener("click", renderRegions);

    const closeBottom = document.getElementById("results-close-bottom3");
    if (closeBottom) closeBottom.addEventListener("click", close);
  }

  window.openResultsScreen = show;
  window.closeResultsScreen = close;
  window.renderResultsRegions = renderRegions;

  if (closeTopBtn) closeTopBtn.addEventListener("click", close);
})();
