/* Progressive enhancement: the complete project collection works without JS. */
(() => {
  'use strict';
  document.body.classList.add('js');
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const persist = (key, value) => { try { localStorage.setItem(key, value); } catch (_) { /* Optional storage. */ } };
  const themeButton = document.querySelector('.day-toggle');
  function syncTheme() {
    const light = root.dataset.theme === 'light';
    if (themeButton) {
      themeButton.hidden = false;
      themeButton.setAttribute('aria-pressed', String(light));
      themeButton.setAttribute('aria-label', light ? 'Switch to night ocean' : 'Switch to day logbook');
      themeButton.querySelector('.theme-label').textContent = light ? 'Night ocean' : 'Day logbook';
      themeButton.querySelector('span').textContent = light ? '☾' : '☼';
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#f0e7d5' : '#0b1522');
  }
  syncTheme();
  themeButton?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    persist('pirate-theme', root.dataset.theme);
    syncTheme();
  });
  const gearButton = document.querySelector('.gear-toggle');
  function syncGear() {
    if (!gearButton) return;
    const awake = root.classList.contains('gear-five');
    gearButton.hidden = false;
    gearButton.setAttribute('aria-pressed', String(awake));
    gearButton.querySelector('.gear-label').textContent = awake ? 'Return to calm seas' : 'Awaken Gear 5';
    document.querySelector('.gear-status').textContent = awake ? 'Gear 5 awakened. Imagination takes the helm.' : 'Calm seas. The next adventure is waiting.';
  }
  syncGear();
  gearButton?.addEventListener('click', () => {
    const active = root.classList.toggle('gear-five');
    persist('bb-gear', active ? 'on' : 'off');
    syncGear();
  });
  let motionPaused = false;
  try { motionPaused = localStorage.getItem('bb-motion') === 'paused'; } catch (_) { /* Storage is optional. */ }
  const motionButton = document.querySelector('.motion-toggle');
  function syncMotion() {
    const paused = reduced.matches || motionPaused;
    root.classList.toggle('motion-paused', paused);
    if (!motionButton) return;
    motionButton.hidden = false;
    motionButton.disabled = reduced.matches;
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.querySelector('.motion-label').textContent = reduced.matches ? 'Reduced motion' : paused ? 'Motion off' : 'Motion on';
    motionButton.title = reduced.matches ? 'Reduced motion follows your system preference' : paused ? 'Enable decorative motion' : 'Pause decorative motion';
    motionButton.setAttribute('aria-label', motionButton.title);
  }
  syncMotion();
  reduced.addEventListener('change', syncMotion);
  motionButton?.addEventListener('click', () => {
    motionPaused = !motionPaused;
    try { localStorage.setItem('bb-motion', motionPaused ? 'paused' : 'on'); } catch (_) { /* Continue without persistence. */ }
    syncMotion();
  });

  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.main-nav');
  function closeMenu(restoreFocus = false) {
    menu?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) menuButton?.focus();
  }
  if (menuButton && menu) {
    menuButton.hidden = false;
    menuButton.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.classList.contains('is-open')) closeMenu(true);
    });
    window.matchMedia('(min-width:651px)').addEventListener('change', () => closeMenu());
  }

  const progress = document.querySelector('.reading-progress');
  let framePending = false;
  function updateProgress() {
    const range = root.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0})`;
    framePending = false;
  }
  function scheduleProgress() {
    if (!framePending) { framePending = true; requestAnimationFrame(updateProgress); }
  }
  window.addEventListener('scroll', scheduleProgress, { passive: true });
  window.addEventListener('resize', scheduleProgress, { passive: true });
  updateProgress();

  const printButton = document.getElementById('print-resume');
  if (printButton) { printButton.hidden = false; printButton.addEventListener('click', () => window.print()); }

  const worldTabs = Array.from(document.querySelectorAll('.world-tabs [role="tab"]'));
  if (worldTabs.length) {
    document.querySelector('.world-tabs').hidden = false;
    function selectWorld(tab, focus = false) {
      worldTabs.forEach(button => {
        const active = button === tab;
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
        document.getElementById(button.getAttribute('aria-controls')).hidden = !active;
      });
      if (focus) tab.focus();
      scheduleProgress();
    }
    worldTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectWorld(tab));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % worldTabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + worldTabs.length) % worldTabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = worldTabs.length - 1;
        if (next === undefined) return;
        event.preventDefault(); selectWorld(worldTabs[next], true);
      });
    });
    selectWorld(worldTabs[0]);
  }

  const collection = document.querySelector('.project-grid');
  if (!collection) return;
  const layoutControls = document.querySelector('.fleet-layout-tools');
  layoutControls.hidden = false;
  let layout = 'cards';
  try { layout = localStorage.getItem('bb-layout') === 'list' ? 'list' : 'cards'; } catch (_) { /* Optional storage. */ }
  function syncLayout() {
    collection.classList.toggle('manifest', layout === 'list');
    layoutControls.querySelectorAll('[data-layout]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.layout === layout)));
    scheduleProgress();
  }
  layoutControls.addEventListener('click', event => {
    const button = event.target.closest('[data-layout]');
    if (!button) return;
    layout = button.dataset.layout;
    persist('bb-layout', layout);
    syncLayout();
  });
  syncLayout();
  const cards = Array.from(collection.querySelectorAll('.project-card'));
  const controls = document.querySelector('.fleet-controls');
  const buttons = Array.from(document.querySelectorAll('[data-filter]'));
  const search = document.getElementById('project-search');
  const more = document.getElementById('show-more');
  const count = document.getElementById('project-count');
  const empty = document.querySelector('.empty-state');
  const params = new URLSearchParams(location.search);
  const validCategories = buttons.map(button => button.dataset.filter);
  let category = validCategories.includes(params.get('category')) ? params.get('category') : 'All';
  let expanded = params.get('view') === 'all';
  search.value = params.get('q') || '';
  controls.hidden = false;

  function saveState() {
    const url = new URL(location.href);
    if (category === 'All') url.searchParams.delete('category'); else url.searchParams.set('category', category);
    if (search.value.trim()) url.searchParams.set('q', search.value.trim()); else url.searchParams.delete('q');
    if (expanded) url.searchParams.set('view', 'all'); else url.searchParams.delete('view');
    history.replaceState(null, '', url);
  }
  function filterProjects(save = true) {
    const words = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    const matching = cards.filter(card => (category === 'All' || card.dataset.category === category) && words.every(word => card.dataset.search.includes(word)));
    const limited = category === 'All' && !words.length && !expanded;
    const visible = new Set(limited ? matching.slice(0, 9) : matching);
    cards.forEach(card => {
      const wasHidden = card.hidden;
      card.hidden = !visible.has(card);
      card.classList.toggle('just-revealed', wasHidden && !card.hidden);
    });
    buttons.forEach(button => {
      const active = button.dataset.filter === category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    count.textContent = `Showing ${visible.size} of ${matching.length} ${matching.length === 1 ? 'voyage' : 'voyages'}${category !== 'All' ? ' · ' + category : ''}`;
    empty.hidden = matching.length !== 0;
    more.hidden = !limited || matching.length <= 9;
    more.innerHTML = `Unroll the complete logbook <span>+${Math.max(0, matching.length - 9)}</span>`;
    if (save) saveState();
    scheduleProgress();
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    expanded = false;
    filterProjects();
  }));
  search.addEventListener('input', () => { expanded = false; filterProjects(); });
  more.addEventListener('click', () => {
    const firstHidden = cards.find(card => card.hidden);
    expanded = true;
    filterProjects();
    firstHidden?.querySelector('h3 a')?.focus({ preventScroll: true });
    firstHidden?.scrollIntoView({ block: 'nearest', behavior: root.classList.contains('motion-paused') ? 'instant' : 'smooth' });
  });
  document.getElementById('reset-search').addEventListener('click', () => {
    category = 'All'; search.value = ''; expanded = false; filterProjects(); search.focus();
  });
  document.querySelectorAll('[data-set-filter]').forEach(anchor => anchor.addEventListener('click', () => {
    category = anchor.dataset.setFilter;
    search.value = ''; expanded = false; filterProjects();
  }));
  document.addEventListener('keydown', event => {
    const editing = /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable;
    if (event.key === '/' && !editing && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault(); search.focus(); search.scrollIntoView({ block: 'center' });
    }
  });
  window.addEventListener('popstate', () => {
    const state = new URLSearchParams(location.search);
    category = validCategories.includes(state.get('category')) ? state.get('category') : 'All';
    expanded = state.get('view') === 'all'; search.value = state.get('q') || ''; filterProjects(false);
  });
  filterProjects(false);

  if ('IntersectionObserver' in window) {
    const navigation = Array.from(document.querySelectorAll('.main-nav a'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navigation.forEach(anchor => {
          if (anchor.hash === '#' + entry.target.id) anchor.setAttribute('aria-current', 'location');
          else anchor.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -60% 0px' });
    ['projects', 'about', 'skills'].forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
  }
})();
