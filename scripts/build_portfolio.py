#!/usr/bin/env python3
"""Build the portfolio's static HTML from reviewed project data; no dependencies."""
from pathlib import Path
from html import escape as esc
import json

ROOT = Path(__file__).resolve().parents[1]
PROJECTS = json.loads((ROOT / 'data/projects.json').read_text())
CATEGORIES = ['Games', 'Platforms', 'Commerce', 'People & Culture', 'Tools', 'Immersive']
assert len({p['id'] for p in PROJECTS}) == len(PROJECTS), 'Duplicate project IDs'
assert all(p['category'] in CATEGORIES for p in PROJECTS)
assert next(p for p in PROJECTS if p['id'] == 'som-bi')['url'] is None


def external(url):
    return ' target="_blank" rel="noopener noreferrer"' if url.startswith('https://') else ''


def link(label, url, cls=''):
    assert url.startswith(('/', 'https://', 'mailto:')), f'Invalid link: {url}'
    return f'<a class="{esc(cls)}" href="{esc(url)}"{external(url)}>{esc(label)}</a>'


def head(title, description, canonical, image='/images/og-thomas.jpg'):
    full_image = image if image.startswith('https://') else 'https://thomasdlynn.dev' + image
    schema = {'@context': 'https://schema.org', '@type': 'Person', 'name': 'Thomas D. Lynn', 'alternateName': 'Thiha Lynn', 'url': 'https://thomasdlynn.dev', 'jobTitle': 'Software Engineer', 'sameAs': ['https://github.com/uit-ayeaye'], 'worksFor': {'@type': 'Organization', 'name': 'Backbenchers Studio'}}
    return f'''<!doctype html>
<html lang="en" data-theme="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script>try{{document.documentElement.dataset.theme=localStorage.getItem('pirate-theme')==='light'?'light':'dark';document.documentElement.classList.toggle('gear-five',localStorage.getItem('bb-gear')==='on')}}catch(e){{}}</script>
<title>{esc(title)}</title><meta name="description" content="{esc(description)}"><meta name="theme-color" content="#0b1522">
<link rel="canonical" href="https://thomasdlynn.dev{canonical}"><meta property="og:type" content="website"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="https://thomasdlynn.dev{canonical}"><meta property="og:image" content="{esc(full_image)}"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/images/jolly-roger-cyber-nobg.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Libre+Caslon+Display&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Pirata+One&family=Cinzel:wght@500;700;900&display=swap" rel="stylesheet"><link rel="stylesheet" href="/css/captains-log.css"><link rel="stylesheet" href="/css/pirate-voyage.css"><script src="/js/captains-log.js" defer></script><script type="application/ld+json">{json.dumps(schema)}</script></head><body>
<a class="skip-link" href="#main">Skip to content</a><div class="reading-progress" aria-hidden="true"></div>
<header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="Backbenchers Studio, home"><img src="/images/jolly-roger-cyber-nobg.png" width="48" height="35" alt=""><span>BACKBENCHERS<small>STUDIO / THOMAS D. LYNN</small></span></a><nav class="main-nav" id="main-nav" aria-label="Main navigation"><a href="/#projects">The fleet</a><a href="/#about">The captain</a><a href="/#skills">Arsenal</a><a href="/showcase/">Playground ↗</a></nav><div class="header-tools"><button class="day-toggle" aria-label="Switch to day logbook" aria-pressed="false" hidden><span aria-hidden="true">☼</span><span class="theme-label">Day logbook</span></button><button class="motion-toggle" aria-pressed="false" title="Pause decorative motion" hidden><span aria-hidden="true">◌</span> <span class="motion-label">Motion on</span></button><a class="header-contact" href="/#contact">LET’S TALK ↗</a><button class="menu-toggle" aria-controls="main-nav" aria-expanded="false" hidden>MENU <span aria-hidden="true">☰</span></button></div></div></header>'''


FOOTER = '''<footer class="site-footer wrap"><a href="/" class="footer-brand"><img src="/images/jolly-roger-cyber-nobg.png" alt="" width="38" height="27"> BACKBENCHERS STUDIO</a><p>© 2026 Thomas D. Lynn. Every voyage has a crew.<br>One Piece fan tribute. Original characters belong to their creators.</p><a href="#main">BACK TO THE DECK ↑</a></footer></body></html>'''


def illustration(p):
    if p['image']:
        cls = ' project-image-contain' if p['id'] == 'backbenchers' else ''
        return f'<img class="project-image{cls}" src="{esc(p["image"])}" alt="{esc(p["title"])} project preview" width="1440" height="1000" loading="lazy" decoding="async">'
    if p['id'] == 'som-bi':
        return '<div class="concept-art som-art" aria-label="SOM BI typographic project illustration"><span class="concept-kicker">SCHOOL OF MANAGEMENT</span><strong>SOM<span>BI</span></strong><div class="concept-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><span>TEACHING / RESEARCH / INSIGHT</span><small>PROJECT ILLUSTRATION · NO UNIVERSITY DATA</small></div>'
    return '<div class="concept-art epst-art"><span>ECONOMICS / IDEAS / ACADEMIC LIFE</span><strong>EPST<span>↗</span></strong><span>A STUDENT’S PERSPECTIVE</span></div>'


def card(p, index):
    terms = ' '.join([p['title'], p['eyebrow'], p['summary'], p['story'], p['role'], *p['features'], *p['stack'], p['category'], p['status'], p['credit'] or ''])
    return f'''<article class="project-card" data-category="{esc(p['category'])}" data-search="{esc(terms.lower())}"><a class="project-cover" href="/projects/{p['id']}/" tabindex="-1" aria-hidden="true">{illustration(p)}<span class="project-number">VOYAGE / {index:02}</span><span class="cover-arrow">↗</span></a><div class="project-body"><p class="project-eyebrow">{esc(p['eyebrow'])}</p><h3><a href="/projects/{p['id']}/">{esc(p['title'])}<span aria-hidden="true">↗</span></a></h3><p class="project-summary">{esc(p['summary'])}</p><div class="project-status"><span class="status-dot"></span>{esc(p['status'])}</div></div></article>'''


SKILLS = [
    ('01', 'Games & real-time worlds', 'Unity · C# · Photon · Three.js · React Three Fiber · WebGL', 'Multiplayer, playable scenes, lighting, weather, and interaction.', 'endgame', 'End Game Union & browser worlds'),
    ('02', 'Web platforms & commerce', 'Next.js · React · Vue / Nuxt · Astro · Laravel', 'From public storefronts to the admin tools running the business.', 'burmamart', 'BurmaMart & commerce projects'),
    ('03', 'Mobile experiences', 'Flutter / Dart · Android / Java · iOS / Swift', 'Buyer apps, merchant tools, and companion experiences for real products.', 'welmal', 'Welmal & mobile ecosystems'),
    ('04', 'Backends & integrations', 'Node.js · Express · PHP · MySQL · PostgreSQL · Prisma', 'APIs, shared data models, provider integrations, and operational workflows.', 'som-bi', 'SOM BI & connected systems'),
    ('05', 'Media & creative tools', 'FFmpeg · HLS · Python · OpenType · fontmake', 'Publishing, adaptive video, and tools for making Myanmar type.', 'glyph-studio', 'Glyph Studio & AWAM'),
    ('06', 'Bots, motion & delivery', 'Telegram · Messenger · GSAP · GitHub Pages · Nginx', 'Conversational operations, expressive interfaces, and web delivery.', 'dk-gaming', 'DK Gaming & automation'),
]


def playground():
    voyages = [next(p for p in PROJECTS if p['id'] == key) for key in ['onigashima', 'elbaf', 'hledan', 'grand-line-fizz', 'naruto', 'jjk']]
    names = ['Onigashima', 'Elbaf', 'Hledan', 'Grand Line Fizz', 'Naruto', 'Jujutsu Kaisen']
    tabs = ''.join(f'<button role="tab" id="world-tab-{p["id"]}" aria-controls="world-{p["id"]}" aria-selected="{str(i == 0).lower()}" tabindex="{0 if i == 0 else -1}">{i+1:02} <span>{names[i]}</span></button>' for i, p in enumerate(voyages))
    panels = ''
    for i, p in enumerate(voyages):
        sources = ''.join(link(label + ' ↗', url, 'world-source') for label, url in p['links'])
        panels += f'''<article class="world-panel" id="world-{p['id']}" role="tabpanel" aria-labelledby="world-tab-{p['id']}" tabindex="0"><div class="world-preview"><img src="{p['image']}" alt="{esc(p['title'])} interactive world preview" width="1200" height="630" loading="lazy"><span class="world-coordinate">ISLAND {i+1:02} / GRAND LINE EXPLORER</span></div><div class="world-copy"><p class="eyebrow gold">{esc(p['eyebrow'])}</p><h3>{esc(p['title'])}</h3><p>{esc(p['summary'])}</p><div class="world-actions">{link('Enter this world ↗', p['url'], 'button red-button')}{link('Captain’s notes ↗', '/projects/'+p['id']+'/', 'text-link')}</div><div class="world-sources">{sources}</div><p class="world-credit">{esc(p['credit'])}</p></div></article>'''
    return f'''<section class="playground section-space" id="playground"><div class="wrap"><div class="section-top"><p class="eyebrow">THE GRAND LINE / INTERACTIVE WORLDS</p><a class="text-link" href="/showcase/">All showcases ↗</a></div><div class="section-heading"><h2>Choose your <span class="serif">next island.</span></h2><p>Storm seas. Giant kingdoms. A little piece of Yangon.<br> Six worlds to explore, with the code and the crew behind each.</p></div><div class="world-tabs" role="tablist" aria-label="Choose a showcase" hidden>{tabs}</div><div class="world-stage">{panels}</div><p class="playground-note">Worlds load when you enter. Keyboard, mouse, and touch controls vary by experience.</p></div></section>'''


def build_home():
    template = (ROOT / 'templates/home.html').read_text()
    filters = f'<button class="filter active" data-filter="All" aria-pressed="true">All voyages <sup>{len(PROJECTS)}</sup></button>'
    for cat in CATEGORIES:
        filters += f'<button class="filter" data-filter="{esc(cat)}" aria-pressed="false">{esc(cat)} <sup>{sum(p["category"] == cat for p in PROJECTS)}</sup></button>'
    lore = ['CONQUEROR’S HAKI', 'GRAND LINE NAVIGATION', 'DEN DEN MUSHI', 'THE ENGINE ROOM', 'DEVIL FRUIT LAB', 'KEEP THE CREW CONNECTED']
    skills = ''.join(f'<article class="skill"><span class="skill-number">{n} / {lore[i]}</span><h3>{title}</h3><p class="skill-tools">{tools}</p><p>{desc}</p><a href="/projects/{slug}/">{label} ↗</a></article>' for i, (n, title, tools, desc, slug, label) in enumerate(SKILLS))
    content = template.replace('{{COUNT}}', str(len(PROJECTS))).replace('{{FILTERS}}', filters).replace('{{CARDS}}', '\n'.join(card(p, i) for i, p in enumerate(PROJECTS, 1))).replace('{{SKILLS}}', skills).replace('{{PLAYGROUND}}', playground())
    home_head = head('Thomas D. Lynn — Software Engineer & Captain of Backbenchers Studio', 'A captain’s log of games, commerce, culture, and creative tools. Explore the projects and stories of Thomas D. Lynn, aka Thiha Lynn.', '/').replace('href="/#', 'href="#')
    (ROOT / 'index.html').write_text(home_head + content + FOOTER)


def build_project(p, i):
    credit = f'<aside class="credit-note"><p class="eyebrow">THE CREW / CREDITS</p><p>{esc(p["credit"])}</p></aside>' if p['credit'] else ''
    sources = list(p['links'])
    if p['url'] and p['url'] not in [s[1] for s in sources]:
        sources.insert(0, ['Visit the project', p['url']])
    source_html = '<ul class="source-list">' + ''.join(f'<li>{link(label + " ↗", url)}</li>' for label, url in sources) + '</ul>' if sources else '<p>This is an internal university project. A public case study is shared here; the deployment and university data remain private.</p>'
    call_to_action = link('Visit the project ↗', p['url'], 'button red-button') if p['url'] else '<span class="private-label">INTERNAL CASE STUDY · NO PUBLIC DEPLOYMENT</span>' if p['id'] == 'som-bi' else '<span class="private-label">PROJECT ADDRESS CURRENTLY UNAVAILABLE</span>'
    next_p = PROJECTS[(i + 1) % len(PROJECTS)]
    markup = f'''<main id="main" class="case-page"><div class="wrap"><a class="back-link" href="/#projects">← RETURN TO THE FLEET</a><div class="case-top"><p class="eyebrow">VOYAGE {i+1:02} / {esc(p['category'])}</p><span class="small-label">{esc(p['status'])}</span></div><h1>{esc(p['title'])}</h1><p class="case-deck">{esc(p['summary'])}</p><p class="eyebrow case-org">{esc(p['eyebrow'])}</p><div class="case-hero">{illustration(p)}</div><div class="case-grid"><div class="case-main"><section><p class="eyebrow red">THE STORY</p><h2>Why this voyage matters.</h2><p>{esc(p['story'])}</p></section><section><p class="eyebrow red">MY CONTRIBUTION</p><h2>What I brought aboard.</h2><p>{esc(p['role'])}</p></section><section><p class="eyebrow red">INSIDE THE BUILD</p><h2>The details that make it work.</h2><ul class="feature-list">{''.join('<li>'+esc(f)+'</li>' for f in p['features'])}</ul></section>{credit}</div><aside class="case-sidebar"><p class="eyebrow">TOOLS ON DECK</p><ul class="stack-list">{''.join('<li>'+esc(t)+'</li>' for t in p['stack'])}</ul>{call_to_action}<div class="case-sources"><p class="eyebrow">EXPLORE / SOURCES</p>{source_html}</div><p class="case-date">PROJECT NOTES · SEPTEMBER 2026</p></aside></div><nav class="next-voyage" aria-label="Next project"><span class="eyebrow">KEEP EXPLORING</span><a href="/projects/{next_p['id']}/">{esc(next_p['title'])}<span>↗</span></a></nav></div></main>'''
    dest = ROOT / 'projects' / p['id']
    dest.mkdir(parents=True, exist_ok=True)
    (dest / 'index.html').write_text(head(p['title'] + ' — Thomas D. Lynn', p['summary'], '/projects/' + p['id'] + '/', p['image'] or '/images/og-thomas.jpg') + markup + FOOTER)


def build_resume():
    selected = ['endgame', 'burmamart', 'awam', 'myotaw', 'dk-gaming', 'welmal', 'glyph-studio', 'som-bi']
    rows = ''.join(f'<article class="resume-project"><h3>{link(p["title"], "/projects/"+p["id"]+"/")}</h3><p class="resume-org">{esc(p["eyebrow"])}</p><p>{esc(p["role"])}</p></article>' for p in PROJECTS if p['id'] in selected)
    skills = ''.join(f'<li><strong>{t}</strong> — {tools}</li>' for _, t, tools, _, _, _ in SKILLS)
    content = f'''<main id="main" class="resume-page wrap"><div class="resume-toolbar"><a class="back-link" href="/">← BACK TO THE CAPTAIN’S LOG</a><button class="button" id="print-resume" hidden>Print / save as PDF ↗</button></div><p class="eyebrow red">PROJECT-BASED RÉSUMÉ · SEPTEMBER 2026</p><h1>Thomas D. Lynn</h1><p class="resume-title">Software Engineer · Captain, Backbenchers Studio</p><p>Also known as Thiha Lynn</p><p class="resume-contact"><a href="mailto:hello@thomasdlynn.dev">hello@thomasdlynn.dev</a> · <a href="https://thomasdlynn.dev">thomasdlynn.dev</a> · <a href="https://github.com/uit-ayeaye">github.com/uit-ayeaye</a></p><section><h2>Profile</h2><p>Independent software engineer working across multiplayer games, web platforms, commerce, mobile applications, automation, and creative tools. Builds public experiences and the supporting APIs, administrative tools, media pipelines, and workflows behind them. Work spans Myanmar-focused products, a Singapore commerce ecosystem, creative portfolios, and university projects.</p></section><section><h2>Selected project experience</h2><div class="resume-projects">{rows}</div></section><section><h2>Technical capabilities</h2><ul class="resume-skills">{skills}</ul></section><section><h2>Academic project</h2><p><strong>SOM BI — Mae Fah Luang University, School of Management.</strong> Vanguard team senior project covering role-based KPI dashboards, university-system integration, setup, and internal deployment.</p></section><section><h2>Creative & interactive work</h2><p>Hledan browser rendering and weather systems (original map by Madric A); One Piece fan experiences; adapted scroll showcases with preserved original credits; portfolios for filmmakers, a producer, a teacher, a trainer, and a poet; and an ongoing site for Myanmar metal band EXTANT.</p><p>Explore all {len(PROJECTS)} project stories at <a href="https://thomasdlynn.dev/#projects">thomasdlynn.dev/#projects</a>.</p></section></main>'''
    (ROOT / 'resume').mkdir(exist_ok=True)
    (ROOT / 'resume/index.html').write_text(head('Thomas D. Lynn — Project-based Résumé', 'Software engineering experience across games, web, mobile, commerce, and creative tools.', '/resume/') + content + FOOTER)


build_home()
for i, p in enumerate(PROJECTS):
    build_project(p, i)
build_resume()
paths = ['/', '/resume/', '/showcase/', '/blog/opus-4-6-ai-engineering.html'] + ['/projects/' + p['id'] + '/' for p in PROJECTS]
paths += ['/showcase/' + slug + '/' for slug in ['hledan', 'elbaf', 'onigashima', 'one-piece', 'naruto', 'jjk']]
(ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(f'<url><loc>https://thomasdlynn.dev{p}</loc></url>' for p in paths) + '\n</urlset>\n')
print(f'Built homepage, {len(PROJECTS)} case studies, résumé, and sitemap.')
