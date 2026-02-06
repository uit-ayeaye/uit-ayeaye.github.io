/* ===================================
   Blog Post JavaScript
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ---------- Reading Progress Bar ----------
    const progressBar = document.createElement('div');
    progressBar.classList.add('reading-progress');
    document.body.prepend(progressBar);

    window.addEventListener('scroll', () => {
        const article = document.querySelector('.post-content');
        if (!article) return;

        const articleTop = article.offsetTop;
        const articleHeight = article.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollPos = window.scrollY;

        const progress = Math.min(
            Math.max((scrollPos - articleTop + windowHeight * 0.3) / articleHeight, 0),
            1
        );
        progressBar.style.width = (progress * 100) + '%';
    });

    // ---------- Scroll reveal for post elements ----------
    const postElements = document.querySelectorAll(
        '.callout, .code-block, .version-flow, .highlight-box, .principle-card, .comparison-block, .post-closing, .post-author-card, .styled-list'
    );

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('reveal', 'visible');
                }, index * 60);
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    postElements.forEach(el => {
        el.classList.add('reveal');
        revealObserver.observe(el);
    });

    // ---------- Heading anchor hover ----------
    document.querySelectorAll('.post-body h2[id]').forEach(heading => {
        heading.style.cursor = 'pointer';
        heading.addEventListener('click', () => {
            const url = window.location.origin + window.location.pathname + '#' + heading.id;
            navigator.clipboard.writeText(url).then(() => {
                const hash = heading.querySelector('.heading-hash');
                const original = hash.textContent;
                hash.textContent = '✓';
                hash.style.opacity = '1';
                hash.style.color = '#00d26a';
                setTimeout(() => {
                    hash.textContent = original;
                    hash.style.opacity = '';
                    hash.style.color = '';
                }, 1500);
            });
        });
    });
});
