window.openAuthScreen = function () {
  closeOverlays();
  if (typeof window.closeQuizScreen === "function") window.closeQuizScreen();
  if (typeof window.closeResultsScreen === "function") window.closeResultsScreen();

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
  if (typeof window.closeSuggestScreen === "function") window.closeSuggestScreen();
  if (typeof window.closeSuggestMonumentScreen === "function") window.closeSuggestMonumentScreen();
  if (typeof window.closeContactScreen === "function") window.closeContactScreen();
}


document.addEventListener("DOMContentLoaded", () => {
  const gamesBtn = document.getElementById("games-btn");
  const authBtn = document.getElementById("auth-btn");
  const sidebarResultsBtn = document.getElementById("results-btn");

  if (gamesBtn) {
gamesBtn.addEventListener("click", () => {
  closeOverlays();
  window.closeAuthScreen();
  if (typeof window.closeResultsScreen === "function") window.closeResultsScreen();

      if (typeof window.openRegionSelectionView === "function") {
        window.openRegionSelectionView();
      } else {
        const qs = document.getElementById("quiz-screen");
        if (qs) qs.style.display = "flex";
      }
    });
  }

  if (authBtn) {
    authBtn.addEventListener("click", () => {
      window.openAuthScreen();
    });
  }

  if (sidebarResultsBtn) {
sidebarResultsBtn.addEventListener("click", () => {
  closeOverlays();
  window.closeAuthScreen();
  if (typeof window.closeQuizScreen === "function") window.closeQuizScreen();

      if (typeof window.openResultsScreen === "function") {
        window.openResultsScreen();
      }
    });
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("#auth-close-btn")) window.closeAuthScreen();
  });
});
