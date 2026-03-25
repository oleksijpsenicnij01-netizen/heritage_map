const mobileBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('sidebar');

if (mobileBtn) {
  mobileBtn.addEventListener('click', () => {
    sidebar.classList.toggle('active');
  });
}