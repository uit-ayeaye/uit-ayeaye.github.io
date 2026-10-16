/* Apply before styles: dark by default; preserve an explicit light preference. */
(() => {
  let theme = 'dark';
  try {
    if (localStorage.getItem('bb-theme-v2') === 'light') theme = 'light';
  } catch (_) { /* Storage may be unavailable in privacy mode. */ }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
