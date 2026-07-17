/* ===================================================================
   Voyages gallery — bouncy, magnetic showcase cards + iris-wipe launch.
   Layered on top of the portfolio's main.js (theme/preloader/particles).
   =================================================================== */
(function () {
    'use strict';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const cards = Array.from(document.querySelectorAll('.showcase-card'));

    // ---- Springy staggered entrance (IntersectionObserver) ----
    if (!reduce && 'IntersectionObserver' in window) {
        cards.forEach(c => c.classList.add('reveal'));
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                const idx = cards.indexOf(e.target);
                setTimeout(() => e.target.classList.add('pop'), Math.max(0, idx) * 130);
                obs.unobserve(e.target);
            });
        }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
        cards.forEach(c => obs.observe(c));
    }

    // ---- Magnetic spring tilt (pointer-follow + elastic settle via CSS) ----
    if (fine && !reduce) {
        cards.forEach((card) => {
            let raf = 0;
            card.addEventListener('pointermove', (e) => {
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                if (raf) cancelAnimationFrame(raf);
                raf = requestAnimationFrame(() => {
                    card.style.transition = 'box-shadow .3s, border-color .3s';
                    card.style.transform =
                        `perspective(900px) rotateX(${(-py * 9).toFixed(2)}deg) rotateY(${(px * 11).toFixed(2)}deg) ` +
                        `translate3d(${(px * 14).toFixed(1)}px, ${(py * 12).toFixed(1)}px, 0) scale(1.035)`;
                });
            });
            const reset = () => {
                if (raf) cancelAnimationFrame(raf);
                // spring back with a back.out overshoot
                card.style.transition = 'transform .6s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow .3s';
                card.style.transform = '';
            };
            card.addEventListener('pointerleave', reset);
            card.addEventListener('blur', reset, true);
        });
    }

    // ---- Iris-wipe launch (colored per destination), then navigate ----
    cards.forEach((card) => {
        card.addEventListener('click', (e) => {
            const href = card.getAttribute('href');
            if (!href) return;
            // let modified clicks / new-tab behave normally
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            if (reduce) return; // native navigation, no wipe
            e.preventDefault();
            const color = getComputedStyle(card).getPropertyValue('--show-void').trim() || '#06030c';
            const wipe = document.createElement('div');
            wipe.className = 'iris-wipe';
            wipe.style.setProperty('--iris-color', color);
            wipe.style.setProperty('--ix', e.clientX + 'px');
            wipe.style.setProperty('--iy', e.clientY + 'px');
            document.body.appendChild(wipe);
            requestAnimationFrame(() => wipe.classList.add('go'));
            let navigated = false;
            const go = () => { if (!navigated) { navigated = true; window.location.href = href; } };
            wipe.addEventListener('transitionend', go);
            setTimeout(go, 700); // failsafe
        });
    });
})();
