/* ===================================
   Main JS — One Piece Grand Line Theme
   =================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Particles (golden fireflies + ocean stars)
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer && window.innerWidth > 768) {
        // Floating particles
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDelay = Math.random() * 10 + 's';
            p.style.animationDuration = (8 + Math.random() * 8) + 's';
            const s = 2 + Math.random() * 4;
            p.style.width = s + 'px';
            p.style.height = s + 'px';
            const colors = ['#f5c842','#ffe066','#42a5f5','#dc3545','#c9991a','#64b5f6'];
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            particlesContainer.appendChild(p);
        }

        // Twinkling stars
        for (let i = 0; i < 50; i++) {
            const star = document.createElement('div');
            star.style.position = 'absolute';
            star.style.width = (1 + Math.random() * 2) + 'px';
            star.style.height = star.style.width;
            star.style.background = Math.random() > 0.7 ? '#f5c842' : '#e8dcc8';
            star.style.borderRadius = '50%';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 60 + '%';
            star.style.opacity = (0.1 + Math.random() * 0.5).toString();
            star.style.animation = `twinkle ${2 + Math.random() * 4}s ease-in-out infinite`;
            star.style.animationDelay = Math.random() * 5 + 's';
            particlesContainer.appendChild(star);
        }

        // Add twinkle keyframe dynamically
        if (!document.getElementById('twinkle-style')) {
            const style = document.createElement('style');
            style.id = 'twinkle-style';
            style.textContent = '@keyframes twinkle{0%,100%{opacity:0.2;transform:scale(1)}50%{opacity:1;transform:scale(1.5)}}';
            document.head.appendChild(style);
        }
    }

    // Lightning overlay
    const lightning = document.createElement('div');
    lightning.classList.add('lightning-overlay');
    document.body.appendChild(lightning);

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

    // Typewriter — One Piece themed
    const tw = document.getElementById('typewriter');
    if (tw) {
        const phrases = [
            ' navigating the Grand Line of code...',
            ' converting PHP → Node.js at Gear 5th speed!',
            ' upgrading Laravel like finding One Piece!',
            ' building iOS apps — Devil Fruit powers! 😈',
            ' AI is my Hito Hito no Mi, Model: Nika! ⚡',
            ' one pirate + AI = the whole fleet! 🏴‍☠️',
            ' Gear 5th Engineering activated! 🔥',
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

    // Cursor trail effect (golden sparkles on click)
    document.addEventListener('click', e => {
        for (let i = 0; i < 5; i++) {
            const spark = document.createElement('div');
            spark.style.cssText = `
                position:fixed; width:4px; height:4px; border-radius:50%;
                background:${['#f5c842','#ffe066','#dc3545'][Math.floor(Math.random()*3)]};
                left:${e.clientX}px; top:${e.clientY}px;
                pointer-events:none; z-index:9999;
                transition: all 0.6s ease-out;
            `;
            document.body.appendChild(spark);
            requestAnimationFrame(() => {
                spark.style.transform = `translate(${(Math.random()-0.5)*60}px, ${(Math.random()-0.5)*60}px) scale(0)`;
                spark.style.opacity = '0';
            });
            setTimeout(() => spark.remove(), 700);
        }
    });
});
