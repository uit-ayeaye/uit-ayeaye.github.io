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
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#d8cbb1' : '#0b1522');
  }
  syncTheme();
  themeButton?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    persist('bb-theme-v2', root.dataset.theme);
    syncTheme();
  });
  const gearButton = document.querySelector('.gear-toggle');
  function syncGear() {
    if (!gearButton) return;
    const awake = root.classList.contains('gear-five');
    gearButton.hidden = false;
    gearButton.setAttribute('aria-pressed', String(awake));
    gearButton.querySelector('.gear-label').textContent = awake ? 'Gear 5 accent: on' : 'Gear 5 accent';
    document.querySelector('.gear-status').textContent = awake ? 'Gear 5 color accent enabled.' : 'Classic color accent enabled.';
  }
  syncGear();
  gearButton?.addEventListener('click', () => {
    const active = root.classList.toggle('gear-five');
    persist('bb-gear', active ? 'on' : 'off');
    syncGear();
  });
  let motionPaused = false;
  // Each page arrives with motion on; the visitor can pause this page at any time.
  const motionButton = document.querySelector('.motion-toggle');
  function syncMotion() {
    const paused = reduced.matches || motionPaused;
    root.classList.toggle('motion-paused', paused);
    document.dispatchEvent(new Event('voyage-preferences'));
    if (!motionButton) return;
    motionButton.hidden = false;
    motionButton.disabled = reduced.matches;
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.querySelector('.motion-label').textContent = reduced.matches ? 'Reduced motion' : paused ? 'Motion off' : 'Motion on';
    motionButton.title = reduced.matches ? 'Reduced motion follows your system preference' : paused ? 'Enable animations and preview loops' : 'Pause animations and preview loops';
    motionButton.setAttribute('aria-label', motionButton.title);
  }
  syncMotion();
  reduced.addEventListener('change', syncMotion);
  motionButton?.addEventListener('click', () => {
    motionPaused = !motionPaused;
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
    document.querySelector('.world-navigation').hidden = false;
    document.querySelector('.rail-navigation').hidden = false;
    let selectedWorld = 0;
    function selectWorld(tab, focus = false) {
      selectedWorld = worldTabs.indexOf(tab);
      worldTabs.forEach(button => {
        const active = button === tab;
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
        document.getElementById(button.getAttribute('aria-controls')).hidden = !active;
      });
      window.voyageReveal?.(document.getElementById(tab.getAttribute('aria-controls')));
      document.getElementById('world-position').textContent = `${String(selectedWorld + 1).padStart(2, '0')} / 06`;
      if (focus) tab.focus();
      scheduleProgress();
    }
    function stepWorld(delta) {
      const index = (selectedWorld + delta + worldTabs.length) % worldTabs.length;
      selectWorld(worldTabs[index]);
      const rail = document.querySelector('.world-tabs');
      const item = worldTabs[index];
      rail.scrollTo({left: Math.max(0, item.offsetLeft - rail.offsetLeft - 8), behavior: root.classList.contains('motion-paused') ? 'instant' : 'smooth'});
    }
    document.querySelectorAll('[data-world-step]').forEach(button => button.addEventListener('click', () => stepWorld(Number(button.dataset.worldStep))));
    let gesture;
    const stage = document.querySelector('.world-stage');
    stage.addEventListener('pointerdown', event => {
      gesture = null;
      if (event.pointerType === 'touch' && event.isPrimary && !event.target.closest('a,button,summary,details,input,select,textarea,[role=button]')) gesture = {x:event.clientX, y:event.clientY, id:event.pointerId};
    }, {passive:true});
    stage.addEventListener('pointermove', event => {
      if (gesture && gesture.id === event.pointerId && Math.abs(event.clientY-gesture.y)>10 && Math.abs(event.clientY-gesture.y)>=Math.abs(event.clientX-gesture.x)) gesture=null;
    }, {passive:true});
    stage.addEventListener('pointerup', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      gesture = null;
      if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) stepWorld(dx < 0 ? 1 : -1);
    }, {passive:true});
    stage.addEventListener('pointercancel', () => { gesture = null; });
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

  function revealCollection() {
    if (location.hash === '#portfolio-sites') document.querySelector('.personal-disclosure')?.setAttribute('open', '');
  }
  window.addEventListener('hashchange', revealCollection);
  revealCollection();

  const personalTrack = document.querySelector('.personal-track');
  if (personalTrack) {
    const controls = document.querySelector('.personal-controls');
    controls.hidden = false;
    const prev = controls.querySelector('[data-personal-step="-1"]');
    const next = controls.querySelector('[data-personal-step="1"]');
    function updatePersonalNavigation() {
      prev.disabled = personalTrack.scrollLeft <= 2;
      next.disabled = personalTrack.scrollLeft >= personalTrack.scrollWidth - personalTrack.clientWidth - 2;
    }
    function stepPersonal(delta) {
      const first = personalTrack.querySelector('.personal-card');
      const distance = first.getBoundingClientRect().width + parseFloat(getComputedStyle(personalTrack).gap);
      personalTrack.scrollBy({left: distance * delta, behavior: root.classList.contains('motion-paused') ? 'instant' : 'smooth'});
    }
    controls.addEventListener('click', event => {
      const button = event.target.closest('[data-personal-step]');
      if (button) stepPersonal(Number(button.dataset.personalStep));
    });
    personalTrack.addEventListener('keydown', event => {
      if (event.target !== personalTrack || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
      event.preventDefault(); stepPersonal(event.key === 'ArrowRight' ? 1 : -1);
    });
    personalTrack.addEventListener('scroll', updatePersonalNavigation, {passive:true});
    personalTrack.closest('details')?.addEventListener('toggle', updatePersonalNavigation);
    window.addEventListener('resize', updatePersonalNavigation, {passive:true});
    updatePersonalNavigation();
  }

  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        if (!root.classList.contains('motion-paused')) entry.target.classList.add('studio-arrive');
        reveal.unobserve(entry.target);
      });
    }, {threshold:.12});
    document.querySelectorAll('.section-heading, .skill, .personal-copy, .about-copy').forEach(el => reveal.observe(el));
  }

  const previewDialog = document.querySelector('.preview-dialog');
  if (previewDialog && typeof previewDialog.showModal === 'function') {
    const projects = JSON.parse(document.getElementById('project-data')?.textContent || '[]');
    const previewImage = previewDialog.querySelector('#preview-image');
    const viewport = previewDialog.querySelector('.preview-viewport');
    const zoom = previewDialog.querySelector('.preview-zoom');
    const scroll = previewDialog.querySelector('.project-log-scroll');
    let opener;
    const put = (selector, value) => { previewDialog.querySelector(selector).textContent = value || ''; };
    function setZoom(active) {
      viewport.classList.toggle('is-enlarged', active);
      zoom.setAttribute('aria-pressed', String(active));
      zoom.textContent = active ? 'Fit image ⊖' : 'Inspect image ⊕';
      put('.preview-tip', active ? 'Scroll inside the image to explore' : 'A page from the project log');
      viewport.scrollTo({left:0,top:0,behavior:'instant'});
    }
    function showImage(src, caption) {
      window.setVoyagePreview?.('',src);
      previewImage.hidden = !src;
      if (src) previewImage.src = src; else previewImage.removeAttribute('src');
      previewImage.alt = caption;
      put('.preview-caption',caption);
      zoom.hidden = !src;
      previewDialog.querySelector('.preview-unavailable').hidden = !!src;
      setZoom(false);
    }
    function list(selector, values) {
      const container = previewDialog.querySelector(selector);
      container.replaceChildren(...values.map(value => { const item = document.createElement('li'); item.textContent = value; return item; }));
    }
    let currentProject;
    function openProject(project, initialImageOverride) {
      currentProject = project;
        const initialImage = initialImageOverride || project.image;
        showImage(initialImage,project.preview_caption || `${project.title} preview`);
        window.setVoyagePreview?.(project.video,project.image);
        if(project.video_caption) put('.preview-caption',project.video_caption);
        put('#preview-title',project.title);
        put('.preview-meta',`${project.category} / ${project.status}`);
        put('.preview-summary',project.summary);
        put('.preview-story',project.story);
        put('.preview-role',project.role);
        put('.preview-credit',project.credit);
        previewDialog.querySelector('.preview-credit').hidden = !project.credit;
        previewDialog.querySelector('.preview-context').dispatchEvent(new Event('voyage-reset'));
        previewDialog.querySelector('.preview-context').open = false;
        list('.preview-features',project.features);
        list('.preview-stack',project.stack);
        const sources = previewDialog.querySelector('.preview-sources');
        sources.replaceChildren(...project.links.map(([label,href]) => {
          const a=document.createElement('a'); a.textContent=`${label} ↗`; a.href=href;
          if(href.startsWith('https://')) { a.target='_blank'; a.rel='noopener noreferrer'; }
          return a;
        }));
        const gallery = previewDialog.querySelector('.preview-gallery');
        gallery.replaceChildren();
        if(project.gallery?.length) {
          const views=[{image:project.image,title:'Overview',description:project.preview_caption},...project.gallery];
          views.forEach(view => {
            const button=document.createElement('button'); button.type='button'; button.textContent=view.title;
            button.setAttribute('aria-pressed',String(view.image===initialImage));
            button.addEventListener('click',()=>{
              showImage(view.image,view.description || view.title);
              gallery.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
            }); gallery.append(button);
          });
        }
        previewDialog.querySelector('.preview-case').href=`/projects/${project.id}/`;
        const live=previewDialog.querySelector('.preview-live');
        live.hidden=!project.url; live.href=project.url || '/';

      put('.record-position', `${String(projects.indexOf(project)+1).padStart(2,'0')} / ${projects.length}`);
      if (!previewDialog.open) previewDialog.showModal();
      root.classList.add('preview-open');
      scroll.scrollTop=0;
      // The dialog reveals the paper; keep its text stationary for selection.
    }
    document.querySelectorAll('[data-preview], a[href^="/projects/"]').forEach(link => {
      const id=link.dataset.projectId || link.getAttribute('href').split('/')[2];
      const project=projects.find(p=>p.id===id);
      if(!project) return;
      link.setAttribute('aria-haspopup','dialog');
      link.addEventListener('click',event=>{
        if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey) return;
        event.preventDefault(); opener=link;
        openProject(project,link.dataset.preview);
        previewDialog.querySelector('.preview-close').focus({preventScroll:true});
      });
    });
    previewDialog.querySelectorAll('[data-record-step]').forEach(button=>button.addEventListener('click',()=>{
      const index=(projects.indexOf(currentProject)+Number(button.dataset.recordStep)+projects.length)%projects.length;
      openProject(projects[index]);
    }));
    zoom.addEventListener('click',()=>{ window.setVoyagePreview?.('',previewImage.src); setZoom(zoom.getAttribute('aria-pressed')!=='true'); });
    function closePreview() {
      previewDialog.close(); root.classList.remove('preview-open'); opener?.focus({preventScroll:true});
    }
    previewDialog.querySelector('.preview-close').addEventListener('click',closePreview);
    previewDialog.addEventListener('cancel',event=>{event.preventDefault();closePreview();});
    previewDialog.addEventListener('click',event=>{
      if(event.target!==previewDialog) return;
      const b=previewDialog.getBoundingClientRect();
      if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom) closePreview();
    });
    previewDialog.addEventListener('keydown',event=>{
      if(event.key!=='Tab') return;
      const items=Array.from(previewDialog.querySelectorAll('a[href],button,[tabindex="0"],summary')).filter(el=>!el.hidden&&el.getClientRects().length);
      const first=items[0],last=items.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });
    previewDialog.addEventListener('close',()=>{
      if (!previewDialog.open) root.classList.remove('preview-open');
    });
  }

  // One frame per pointer update; cached bounds avoid read/write layout thrashing.
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('.framed-preview, .browser-frame').forEach(card => {
    let bounds, frame=0, point;
    const reset=()=>{ cancelAnimationFrame(frame); frame=0; bounds=null; card.style.removeProperty('--tilt-x'); card.style.removeProperty('--tilt-y'); };
    card.addEventListener('pointerenter',()=>{bounds=card.getBoundingClientRect();},{passive:true});
    card.addEventListener('pointermove', event => {
      if(!finePointer.matches||root.classList.contains('motion-paused')||!root.classList.contains('immersive-mode')) return;
      point={x:event.clientX,y:event.clientY};
      if(frame) return;
      frame=requestAnimationFrame(()=>{
        frame=0; bounds ||= card.getBoundingClientRect();
        card.style.setProperty('--tilt-x',`${((point.y-bounds.top)/bounds.height-.5)*-2}deg`);
        card.style.setProperty('--tilt-y',`${((point.x-bounds.left)/bounds.width-.5)*2}deg`);
      });
    }, {passive:true});
    card.addEventListener('pointerleave',reset);
    document.addEventListener('voyage-preferences',reset);
  });

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
    if (!root.classList.contains('motion-paused')) {
      collection.animate([{opacity:.5,translate:'0 8px'},{opacity:1,translate:'0 0'}],{duration:260,easing:'ease-out'});
    }
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
    const visible = new Set(limited ? matching.slice(0, 6) : matching);
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
    count.textContent = `Showing ${visible.size} of ${matching.length} ${matching.length === 1 ? 'project' : 'projects'}${category !== 'All' ? ' · ' + category : ''}`;
    empty.hidden = matching.length !== 0;
    more.hidden = !limited || matching.length <= 6;
    more.innerHTML = `View all projects <span>+${Math.max(0, matching.length - 6)}</span>`;
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
  document.querySelectorAll('[data-tech]').forEach(chip => chip.addEventListener('click', event => {
    event.preventDefault();
    category = 'All'; search.value = chip.dataset.tech; expanded = false; filterProjects();
    const url = new URL(location.href); url.hash = 'projects'; history.replaceState(null, '', url);
    search.focus({preventScroll:true});
    document.getElementById('projects').scrollIntoView({block:'start', behavior:root.classList.contains('motion-paused') ? 'instant' : 'smooth'});
  }));
  document.addEventListener('keydown', event => {
    const editing = /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable;
    if (event.key === '/' && !document.querySelector('dialog[open]') && !editing && !event.metaKey && !event.ctrlKey && !event.altKey) {
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
