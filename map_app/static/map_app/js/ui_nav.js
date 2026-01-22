window.openAuthScreen = function () {
  const auth = document.getElementById("auth-screen");
  if (!auth) return;
  auth.style.display = "flex";
  auth.classList.add("active");
};

window.closeAuthScreen = function () {
  const auth = document.getElementById("auth-screen");
  if (!auth) return;
  auth.classList.remove("active");
  auth.style.display = "none";
};

function closeOverlays() {
  if (window.destroyLocationGame) window.destroyLocationGame();

  if (typeof window.closeQuizScreen === "function") window.closeQuizScreen();
  if (typeof window.closeResultsScreen === "function") window.closeResultsScreen();

  if (typeof window.closeSuggestScreen === "function") window.closeSuggestScreen();
  if (typeof window.closeSuggestMonumentScreen === "function") window.closeSuggestMonumentScreen();
  if (typeof window.closeContactScreen === "function") window.closeContactScreen();

  if (typeof window.closeAuthScreen === "function") window.closeAuthScreen();
}

window.closeOverlays = closeOverlays;

document.addEventListener("DOMContentLoaded", () => {
  const gamesBtn = document.getElementById("games-btn");
  const authBtn = document.getElementById("auth-btn");
  const resultsBtn = document.getElementById("results-btn");

  const suggestBtn = document.getElementById("suggest-btn");
  const suggestMonumentBtn = document.getElementById("suggest-monument-btn");
  const addPhotoBtn = document.getElementById("add-photo-btn");
  const addMonumentBtn = document.getElementById("add-monument-btn");
  const contactBtn = document.getElementById("contact-btn");

  if (gamesBtn) {
    gamesBtn.addEventListener("click", () => {
      closeOverlays();
      if (typeof window.openRegionSelectionView === "function") {
        window.openRegionSelectionView();
        return;
      }
      const qs = document.getElementById("quiz-screen");
      if (qs) qs.style.display = "flex";
    });
  }

  if (authBtn) {
    authBtn.addEventListener("click", () => {
      closeOverlays();
      window.openAuthScreen();
    });
  }

  if (resultsBtn) {
    resultsBtn.addEventListener("click", () => {
      closeOverlays();
      if (typeof window.openResultsScreen === "function") {
        window.openResultsScreen();
      }
    });
  }

  if (suggestBtn) {
    suggestBtn.addEventListener("click", () => {
      closeOverlays();
      if (typeof window.openSuggestScreen === "function") {
        window.openSuggestScreen();
      }
    });
  }

  if (suggestMonumentBtn) {
    suggestMonumentBtn.addEventListener("click", () => {
      closeOverlays();
      if (typeof window.openSuggestMonumentScreen === "function") {
        window.openSuggestMonumentScreen();
      }
    });
  }

  if (addPhotoBtn) {
    addPhotoBtn.addEventListener("click", () => {
      closeOverlays();
      if (typeof window.openSuggestScreen === "function") {
        window.openSuggestScreen();
      }
    });
  }

  if (addMonumentBtn) {
    addMonumentBtn.addEventListener("click", () => {
      closeOverlays();
      if (typeof window.openSuggestMonumentScreen === "function") {
        window.openSuggestMonumentScreen();
      }
    });
  }

  if (contactBtn) {
    contactBtn.addEventListener("click", () => {
      closeOverlays();
      if (typeof window.openContactScreen === "function") {
        window.openContactScreen();
      }
    });
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("#auth-close-btn")) window.closeAuthScreen();
  });
});
