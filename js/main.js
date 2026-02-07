/* ===================================
   Main JS — One Piece Theme
   =================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Particles (ocean bubbles)
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer && window.innerWidth > 768) {
        for (let i = 0; i < 25; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDelay = Math.random() * 10 + 's';
            p.style.animationDuration = (8 + Math.random() * 8) + 's';
            const s = 2 + Math.random() * 4;
            p.style.width = s + 'px';
            p.style.height = s + 'px';
            const colors = ['#d4a846','#f0d070','#2e86c1','#c0392b','#a07820'];
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            particlesContainer.appendChild(p);
        }
    }

    // Navbar scroll
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
        const scrollPos = window.scrollY + 200;
        sections.forEach(sec => {
            const top = sec.offsetTop;
            const id = sec.getAttribute('id');
            if (scrollPos >= top && scrollPos < top + sec.offsetHeight) {
                navLinks.forEach(l => {
                    l.classList.remove('active');
                    if (l.getAttribute('href') === '#' + id) l.classList.add('active');
                });
            }
        });
    });

    // Mobile nav
    const navToggle = document.getElementById('navToggle');
    const navLinksContainer = document.getElementById('navLinks');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinksContainer.classList.toggle('active');
        });
        navLinksContainer.querySelectorAll('.nav-link').forEach(l => {
            l.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navLinksContainer.classList.remove('active');
            });
        });
    }

    // Typewriter
    const tw = document.getElementById('typewriter');
    if (tw) {
        const phrases = [
            ' navigating the Grand Line of code...',
            ' converting PHP → Node.js at Gear 5th speed!',
            ' upgrading Laravel like a true pirate!',
            ' building iOS apps without knowing Swift!',
            ' AI is my Devil Fruit power! 😈',
            ' one engineer + AI = unlimited potential!',
        ];
        let pi = 0, ci = 0, deleting = false, speed = 60;
        function type() {
            const cur = phrases[pi];
            if (deleting) { tw.textContent = cur.substring(0, ci - 1); ci--; speed = 25; }
            else { tw.textContent = cur.substring(0, ci + 1); ci++; speed = 55; }
            if (!deleting && ci === cur.length) { speed = 2200; deleting = true; }
            else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; speed = 400; }
            setTimeout(type, speed);
        }
        setTimeout(type, 800);
    }

    // Counter
    const statNums = document.querySelectorAll('.stat-number');
    const counterObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const el = e.target;
                const target = parseInt(el.dataset.count);
                let start = null;
                function step(ts) {
                    if (!start) start = ts;
                    const p = Math.min((ts - start) / 1500, 1);
                    el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target);
                    if (p < 1) requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
                counterObs.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    statNums.forEach(n => counterObs.observe(n));

    // Scroll reveal
    const revealEls = document.querySelectorAll('.about-card, .skill-category, .blog-card, .contact-card, .section-header');
    const revealObs = new IntersectionObserver(entries => {
        entries.forEach((e, i) => {
            if (e.isIntersecting) {
                setTimeout(() => e.target.classList.add('reveal', 'visible'), i * 80);
                revealObs.unobserve(e.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    revealEls.forEach(el => { el.classList.add('reveal'); revealObs.observe(el); });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            const t = document.querySelector(a.getAttribute('href'));
            if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    // Card tilt (desktop)
    if (window.innerWidth > 768) {
        document.querySelectorAll('.blog-card:not(.coming-soon), .about-card').forEach(card => {
            card.addEventListener('mousemove', e => {
                const r = card.getBoundingClientRect();
                const rx = (e.clientY - r.top - r.height / 2) / 25;
                const ry = (r.width / 2 - (e.clientX - r.left)) / 25;
                card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
            });
            card.addEventListener('mouseleave', () => { card.style.transform = ''; });
        });
    }
});
