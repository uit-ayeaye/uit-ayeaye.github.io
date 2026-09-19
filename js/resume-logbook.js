/* One canonical résumé, progressively enhanced into a native modal logbook. */
(() => {
  'use strict';
  const dialog = document.querySelector('.resume-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const root = document.documentElement;
  const content = dialog.querySelector('.resume-dialog-content');
  const status = dialog.querySelector('.resume-load-status');
  const print = dialog.querySelector('.resume-print');
  const scroller = dialog.querySelector('.resume-dialog-scroll');
  let opener;
  let pending;
  let loaded = false;

  async function loadResume() {
    if (loaded) return;
    if (pending) return pending;
    status.hidden = false;
    status.textContent = 'Opening the logbook…';
    status.setAttribute('role', 'status');
    content.setAttribute('aria-busy', 'true');
    pending = (async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(`/resume/?v=${encodeURIComponent(dialog.dataset.resumeVersion || 'logbook')}`, { signal: controller.signal, cache: 'no-cache' });
        if (!response.ok) throw new Error('Resume unavailable');
        const documentCopy = new DOMParser().parseFromString(await response.text(), 'text/html');
        const paper = documentCopy.querySelector('.resume-paper');
        if (!paper) throw new Error('Resume document unavailable');
        // The popup title is h2; maintain a coherent heading hierarchy beneath it.
        paper.querySelectorAll('h1,h2,h3').forEach(heading => {
          const replacement = document.createElement(`h${Number(heading.tagName.slice(1)) + 1}`);
          replacement.replaceChildren(...heading.childNodes);
          heading.replaceWith(replacement);
        });
        content.replaceChildren(document.importNode(paper, true));
        status.hidden = true;
        print.disabled = false;
        loaded = true;
      } catch (_) {
        status.setAttribute('role', 'alert');
        status.textContent = 'The logbook could not load. ';
        const fallback = document.createElement('a');
        fallback.href = '/resume/';
        fallback.textContent = 'Open the full résumé';
        status.append(fallback);
      } finally {
        clearTimeout(timeout);
        content.removeAttribute('aria-busy');
        pending = null;
      }
    })();
    return pending;
  }

  document.querySelectorAll('[data-resume]').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      opener = link;
      dialog.showModal();
      root.classList.add('resume-open');
      scroller.scrollTop = 0;
      dialog.querySelector('.resume-close').focus({ preventScroll: true });
      loadResume();
    });
  });
  print.addEventListener('click', async () => {
    // Let fonts/images settle before the native print preview captures the document.
    if (document.fonts) await document.fonts.ready;
    window.print();
  });
  dialog.querySelector('.resume-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = Array.from(dialog.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]'))
      .filter(element => element.getClientRects().length > 0);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first?.focus();
    }
  });
  let backdropDown = false;
  const outside = event => {
    const box = dialog.getBoundingClientRect();
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  };
  dialog.addEventListener('pointerdown', event => { backdropDown = event.target === dialog && outside(event); });
  dialog.addEventListener('click', event => {
    if (backdropDown && event.target === dialog && outside(event)) dialog.close();
    backdropDown = false;
  });
  dialog.addEventListener('close', () => {
    root.classList.remove('resume-open');
    const returnTarget = opener?.getClientRects().length ? opener : document.querySelector('.menu-toggle');
    returnTarget?.focus({ preventScroll: true });
  });
})();
