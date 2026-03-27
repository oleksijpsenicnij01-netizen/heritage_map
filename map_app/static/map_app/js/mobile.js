const mobileBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('sidebar');

if (mobileBtn && sidebar) {
  mobileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('active');
  });
}

document.addEventListener('click', (e) => {
  if (e.target.closest('#sidebar button')) {
    sidebar.classList.remove('active');
  }
});

const sidebarButtons = document.querySelectorAll('#sidebar button');

sidebarButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    sidebar.classList.remove('active');
  });
});

const btn = document.getElementById('mobile-menu-btn');

if (btn) {
  btn.onclick = function () {
    this.classList.toggle('test-click');
  };
}