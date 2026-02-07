/* Blog Post JS — One Piece Theme */
document.addEventListener('DOMContentLoaded', () => {
    // Reading progress
    const bar = document.createElement('div');
    bar.classList.add('reading-progress');
    document.body.prepend(bar);

    window.addEventListener('scroll', () => {
        const article = document.querySelector('.post-content');
        if (!article) return;
        const progress = Math.min(Math.max(
            (window.scrollY - article.offsetTop + window.innerHeight * 0.3) / article.offsetHeight, 0), 1);
        bar.style.width = (progress * 100) + '%';
    });

    // Scroll reveal for post elements
    const els = document.querySelectorAll('.callout, .code-block, .version-flow, .highlight-box, .principle-card, .comparison-block, .post-closing, .post-author-card, .styled-list');
    const obs = new IntersectionObserver(entries => {
        entries.forEach((e, i) => {
            if (e.isIntersecting) {
                setTimeout(() => e.target.classList.add('reveal', 'visible'), i * 60);
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => { el.classList.add('reveal'); obs.observe(el); });
});
