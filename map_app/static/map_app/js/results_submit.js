(function () {
  function getCookie(name) {
    const parts = document.cookie.split(";").map((x) => x.trim());
    for (const p of parts) {
      if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
    }
    return "";
  }

  window.submitGameResult = async function ({ region, game_key, score }) {
    const csrf = getCookie("csrftoken");

    const payload = {
      region: String(region || "").trim(),
      game_key: String(game_key || "").trim(),
      score: Number(score || 0),
    };

    const res = await fetch("/api/results/submit/", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    let data = null;
    try {
      data = await res.json();
    } catch (e) {}

    if (!res.ok) {
      return { ok: false, status: res.status, data };
    }

    return { ok: true, data };
  };
})();
