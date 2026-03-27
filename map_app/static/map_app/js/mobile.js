const mobileBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('sidebar');

if (mobileBtn) {
document.addEventListener('click', (e) => {
  const btn = e.target.closest('#mobile-menu-btn');
  if (!btn) return;

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.classList.toggle('active');
});
}

const sidebarButtons = document.querySelectorAll('#sidebar button');

sidebarButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    sidebar.classList.remove('active');
  });
});