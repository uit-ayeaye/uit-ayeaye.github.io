/* Native details works without JavaScript; add Escape and outside dismissal. */
(() => {
  const dock = document.querySelector('.expedition-dock');
  if (!dock) return;
  dock.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dock.open) {
      event.preventDefault();
      event.stopPropagation();
      dock.open = false;
      dock.querySelector('summary').focus();
    }
  });
  document.addEventListener('pointerdown', event => {
    if (dock.open && !dock.contains(event.target)) dock.open = false;
  });
})();
