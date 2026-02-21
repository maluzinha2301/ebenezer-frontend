// =======================
// Ebenezer - app.js (modernizado)
// =======================

(() => {
  'use strict';

  // ---------- Helpers utilitários ----------
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

  const storage = {
    get(key, fallback = null) {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Seletores principais ----------
  const menuBtn     = $('#menuBtn');
  const mainNav     = $('#mainNav');
  const navOverlay  = $('#navOverlay');
  const cartCounter = $('#cartCounter');

  // ---------- Controle do scroll ao abrir menu ----------
  let _prevBodyOverflow = '';
  const lockScroll = () => {
    _prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  };
  const unlockScroll = () => { document.body.style.overflow = _prevBodyOverflow || ''; };

  // ---------- Menu responsivo ----------
  function openMenu() {
    if (!mainNav || !navOverlay || !menuBtn) return;

    // Microtransição elegante (fallback se usuário não reduzir animações)
    const show = () => {
      mainNav.classList.add('show-menu');
      navOverlay.classList.add('active');
      navOverlay.hidden = false;
      menuBtn.setAttribute('aria-expanded', 'true');
      lockScroll();
      // Foco no primeiro item navegável
      const firstLink = mainNav.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
      firstLink?.focus();
    };

    if (!prefersReducedMotion && document.startViewTransition) {
      document.startViewTransition(show);
    } else {
      show();
    }
  }

  function closeMenu({ returnFocus = true } = {}) {
    if (!mainNav || !navOverlay || !menuBtn) return;
    mainNav.classList.remove('show-menu');
    navOverlay.classList.remove('active');
    menuBtn.setAttribute('aria-expanded', 'false');

    const finish = () => {
      navOverlay.hidden = !navOverlay.classList.contains('active');
      unlockScroll();
      if (returnFocus) menuBtn.focus();
    };

    if (!prefersReducedMotion) {
      setTimeout(finish, 300);
    } else {
      finish();
    }
  }

  function toggleMenu() {
    if (!mainNav) return;
    const isOpen = mainNav.classList.contains('show-menu');
    isOpen ? closeMenu() : openMenu();
  }

  menuBtn?.addEventListener('click', toggleMenu);
  navOverlay?.addEventListener('click', () => closeMenu());

  // Fecha o menu ao clicar em QUALQUER link ou botão dentro do nav (mobile)
  if (mainNav) {
    mainNav.addEventListener('click', (ev) => {
      const target = ev.target.closest('a, button');
      if (!target) return;
      if (window.matchMedia('(max-width: 800px)').matches) closeMenu();
    });
  }

  // Fecha com tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav?.classList.contains('show-menu')) {
      closeMenu();
    }
  });

  // ---------- Acessibilidade: foco ao tentar sair do menu aberto ----------
  document.addEventListener('focusin', (e) => {
    if (!mainNav?.classList.contains('show-menu')) return;
    if (!mainNav.contains(e.target)) {
      const firstLink = mainNav.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
      firstLink?.focus();
    }
  });

  // ---------- Abas (Tabs) ----------
  const tabButtons = $$('.tab-btn');
  const tabs = {
    profile : $('#tab-profile'),
    security: $('#tab-security'),
    billing : $('#tab-billing'),
  };

  function setActiveTab(tabName, { persist = true } = {}) {
    // Esconde todas usando atributo nativo
    Object.values(tabs).forEach((sec) => { if (sec) sec.hidden = true; });

    // Atualiza estado visual/ARIA dos botões
    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.tab === tabName;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
      btn.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    // Mostra a selecionada
    const section = tabs[tabName];
    if (section) section.hidden = false;

    // Persiste e atualiza hash
    if (persist) {
      storage.set('accountActiveTab', tabName);
      const newHash = `#tab=${encodeURIComponent(tabName)}`;
      if (location.hash !== newHash) history.replaceState(null, '', newHash);
    }
  }

  // Clique nas abas
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
    btn.addEventListener('keydown', (e) => {
      // Navegação por setas entre abas (acessibilidade)
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const idx = tabButtons.indexOf?.(btn) ?? tabButtons.findIndex((b) => b === btn);
      let nextIdx = idx;
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabButtons.length;
      if (e.key === 'ArrowLeft')  nextIdx = (idx - 1 + tabButtons.length) % tabButtons.length;
      if (e.key === 'Home')       nextIdx = 0;
      if (e.key === 'End')        nextIdx = tabButtons.length - 1;
      const nextBtn = tabButtons[nextIdx];
      nextBtn?.focus();
      nextBtn?.click();
    });
  });

  // Gatilho genérico: QUALQUER botão/link do site com data-go-tab="security|billing|profile"
  document.body.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-go-tab]');
    if (!el) return;
    const tab = String(el.getAttribute('data-go-tab') || '').trim();
    if (tab && has(tabs, tab)) {
      const onAccountPage = !!(tabs.profile || tabs.security || tabs.billing);
      if (onAccountPage) {
        setActiveTab(tab);
      } else {
        window.location.href = `conta.html#tab=${encodeURIComponent(tab)}`;
      }
    }
  });

  // Ao carregar, tenta usar hash (#tab=security) -> localStorage -> padrão 'profile'
  (function initActiveTabOnLoad() {
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    const hashTab = hash.get('tab');
    const saved = storage.get('accountActiveTab');
    const candidate = hashTab || saved || 'profile';
    const valid = has(tabs, candidate) ? candidate : 'profile';
    setActiveTab(valid, { persist: false });
  })();

  // Ouve mudanças no hash (ex.: usuário cola #tab=billing)
  window.addEventListener('hashchange', () => {
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    const hashTab = hash.get('tab');
    if (hashTab && has(tabs, hashTab)) setActiveTab(hashTab);
  });

  // ---------- Botões "Salvar" / "Cancelar" das seções ----------
  $$('#tab-profile .btn, #tab-security .btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const currentBtn = e.currentTarget;
      const isOutline = currentBtn.classList.contains('btn-outline');
      const card = currentBtn.closest('.card');
      if (!card) return;

      if (isOutline) {
        // Cancelar: reseta os inputs do card atual
        card.querySelectorAll('input, textarea, select').forEach((field) => {
          if (field.type === 'password' || field.tagName === 'TEXTAREA') field.value = '';
          if (field.type === 'text' || field.type === 'email') field.value = '';
          if (field.tagName === 'SELECT') field.selectedIndex = 0;
        });
      } else {
        // Salvar/Atualizar: simulação (troque por sua API)
        console.log('Salvar/Atualizar clicado em:', card.id || '(sem id)');
        showToast('Alterações salvas com sucesso!');
      }
    });
  });

  // ---------- Carrinho ----------
  (function initCartCounter() {
    const count = Number(storage.get('cartCount', 0)) || 0;
    if (cartCounter) cartCounter.textContent = String(count);
  })();

  // Exponho helpers opcionais no window, caso queira usar em outras páginas
  window.addToCart = function addToCart(qtd = 1) {
    const current = Number(storage.get('cartCount', 0)) || 0;
    const next = current + Number(qtd || 0);
    storage.set('cartCount', next);
    if (cartCounter) cartCounter.textContent = String(next);
    showToast('Item adicionado ao carrinho');
  };

  // ---------- Catálogo / VARIANTS (mantido e saneado) ----------
  const VARIANTS = {
    'Caixa de Som': {
      alt: 'Caixa de Som HMASTON',
      colors: [
        { key: 'Branco', label: 'Branco', hex: '#EDEDED' },
        { key: 'Verde',  label: 'Verde',  hex: '#18a324' },
      ],
      angles: ['1', '2', '3'], // 3 imagens: 1.jpg, 2.jpg, 3.jpg
    },

    headset: {
      alt: 'Headset',
      colors: [{ key: 'preto', label: 'Preto', hex: '#111111' }],
      angles: ['frente', 'lado'], // img/headset/preto/frente.jpg e .../lado.jpg
    },

    smartwatch: {
      alt: 'Smartwatch',
      colors: [{ key: 'preto', label: 'Preto', hex: '#111111' }],
      angles: Array.from({ length: 5 }, (_, i) => String(i + 1)), // 1..5
    },
    // ...demais produtos
  };
  // Disponibiliza para outras partes do app, se necessário
  window.EBENEZER_VARIANTS = VARIANTS;

  // ---------- Toast moderno com ARIA ----------
  const toastHost = document.createElement('div');
  toastHost.setAttribute('aria-live', 'polite');
  toastHost.setAttribute('aria-atomic', 'true');
  Object.assign(toastHost.style, {
    position: 'fixed',
    inset: 'auto 0 16px 0',
    display: 'grid',
    placeItems: 'center',
    gap: '10px',
    pointerEvents: 'none',
    zIndex: 9999,
  });
  document.body.appendChild(toastHost);

  function showToast(msg = '') {
    if (!msg) return;
    const t = document.createElement('div');
    t.textContent = msg;
    t.role = 'status';
    Object.assign(t.style, {
      pointerEvents: 'auto',
      maxWidth: '92vw',
      padding: '12px 16px',
      background: 'rgba(15, 15, 15, 0.92)',
      color: '#fff',
      borderRadius: '12px',
      fontSize: '14px',
      boxShadow: '0 10px 30px rgba(0,0,0,.35)',
      transform: 'translateY(12px)',
      opacity: '0',
      transition: prefersReducedMotion ? 'none' : 'transform .25s ease, opacity .25s ease',
    });

    toastHost.appendChild(t);
    // força recálculo para animar
    t.getBoundingClientRect();
    t.style.transform = 'translateY(0)';
    t.style.opacity = '1';

    const remove = () => {
      if (prefersReducedMotion) {
        t.remove();
        return;
      }
      t.style.transform = 'translateY(8px)';
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 220);
    };

    setTimeout(remove, 1500);
  }

})();
