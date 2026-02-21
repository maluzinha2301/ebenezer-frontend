// navbar-loader.js
document.addEventListener("DOMContentLoaded", function () {
  fetch("navbar.html")
    .then(r => r.text())
    .then(html => {
      // injeta a navbar no topo do body
      document.body.insertAdjacentHTML("afterbegin", html);
      initNavbar();
    })
    .catch(err => console.error("Erro ao carregar a navbar:", err));
});

function initNavbar() {
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('mainNav');
  const overlay = document.getElementById('navOverlay');

  function toggleMenu(show) {
    const willOpen = typeof show === 'boolean' ? show : !nav.classList.contains('show-menu');
    nav.classList.toggle('show-menu', willOpen);
    overlay.classList.toggle('active', willOpen);
    menuBtn.setAttribute('aria-expanded', String(willOpen));
    document.body.style.overflow = willOpen ? 'hidden' : '';
  }

  // abrir/fechar
  menuBtn?.addEventListener('click', () => toggleMenu());
  overlay?.addEventListener('click', () => toggleMenu(false));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

  // clique nos links: fecha e navega; se for âncora na MESMA página, faz scroll suave
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href') || '';

      // fecha o menu se aberto
      if (nav.classList.contains('show-menu')) toggleMenu(false);

      // âncora local (ex.: sobre.html#sobre) → se a âncora pertence à MESMA página aberta
      const isSamePageHash = href.startsWith('#');
      if (isSamePageHash) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 180);
        }
      }
      // se for outra página (ex.: produtos.html), o navegador abre normalmente
    });
  });
}