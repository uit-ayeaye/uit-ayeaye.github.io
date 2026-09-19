#!/usr/bin/env python3
"""Build the portfolio's static HTML from reviewed project data; no dependencies."""
from pathlib import Path
from html import escape as esc
from urllib.parse import quote, urlparse
import json
import re
from hashlib import sha256

ROOT = Path(__file__).resolve().parents[1]
PROJECTS = json.loads((ROOT / 'data/projects.json').read_text())
LOOPS = json.loads((ROOT / 'data/preview-loops.json').read_text()) if (ROOT / 'data/preview-loops.json').exists() else {}
for project in PROJECTS:
    if project['id'] in LOOPS:
        project['video'] = LOOPS[project['id']]['src']
        project['video_caption'] = LOOPS[project['id']]['caption']
CATEGORIES = ['Games', 'Platforms', 'Commerce', 'People & Culture', 'Tools', 'Immersive']
assert len({p['id'] for p in PROJECTS}) == len(PROJECTS), 'Duplicate project IDs'
assert all(p['category'] in CATEGORIES for p in PROJECTS)
assert next(p for p in PROJECTS if p['id'] == 'som-bi')['url'] is None


def external(url):
    return ' target="_blank" rel="noopener noreferrer"' if url.startswith('https://') else ''


def link(label, url, cls=''):
    assert url.startswith(('/', 'https://', 'mailto:')), f'Invalid link: {url}'
    return f'<a class="{esc(cls)}" href="{esc(url)}"{external(url)}>{esc(label)}</a>'


def version_assets(markup):
    def replace(match):
        attr, url = match.groups()
        digest = sha256((ROOT / url.lstrip('/')).read_bytes()).hexdigest()[:12]
        return f'{attr}="{url}?v={digest}"'
    return re.sub(r'(href|src)="(/(?:css|js)/[^"?]+)"', replace, markup)


def head(title, description, canonical, image='/images/og-thomas.jpg'):
    full_image = image if image.startswith('https://') else 'https://thomasdlynn.dev' + image
    schema = {'@context': 'https://schema.org', '@type': 'Person', 'name': 'Thomas D. Lynn', 'alternateName': 'Thiha Lynn', 'url': 'https://thomasdlynn.dev', 'jobTitle': 'Software Engineer', 'sameAs': ['https://github.com/uit-ayeaye'], 'worksFor': {'@type': 'Organization', 'name': 'Backbenchers Studio'}}
    schema.update({'@id': 'https://thomasdlynn.dev/#person', 'image': 'https://thomasdlynn.dev/images/captain/thomas-captain-v2.webp', 'email': 'mailto:hello@thomasdlynn.dev', 'knowsAbout': ['Software engineering', 'Game development', 'Web development', 'Mobile applications', 'Logistics software']})
    schema = {'@context': 'https://schema.org', '@graph': [schema, {'@type': 'ProfilePage' if canonical == '/resume/' else 'WebPage', '@id': 'https://thomasdlynn.dev' + canonical, 'url': 'https://thomasdlynn.dev' + canonical, 'name': title, 'description': description, 'inLanguage': 'en', 'mainEntity': {'@id': 'https://thomasdlynn.dev/#person'}}]}
    if canonical.startswith('/projects/'):
        project = next(p for p in PROJECTS if canonical == '/projects/' + p['id'] + '/')
        work_id = 'https://thomasdlynn.dev' + canonical + '#work'
        schema['@graph'][1]['mainEntity'] = {'@id': work_id}
        schema['@graph'].append({'@type': 'CreativeWork', '@id': work_id, 'name': project['title'], 'description': project['summary'], 'url': 'https://thomasdlynn.dev' + canonical, 'image': full_image, 'creator': {'@id': 'https://thomasdlynn.dev/#person'}, 'genre': project['category'], 'creditText': project['credit'] or ''})
        schema['@graph'].append({'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'Portfolio', 'item': 'https://thomasdlynn.dev/'}, {'@type': 'ListItem', 'position': 2, 'name': project['title'], 'item': 'https://thomasdlynn.dev' + canonical}]})
    if canonical == '/':
        schema['@graph'].append({'@type': 'WebSite', '@id': 'https://thomasdlynn.dev/#website', 'name': 'Thomas D. Lynn — Backbenchers Studio', 'url': 'https://thomasdlynn.dev/'})
    return version_assets(f'''<!doctype html>
<html lang="en" data-theme="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script>try{{document.documentElement.dataset.theme=localStorage.getItem('bb-theme-v2')==='light'?'light':'dark';document.documentElement.classList.toggle('gear-five',localStorage.getItem('bb-gear')==='on')}}catch(e){{}}</script>
<title>{esc(title)}</title><meta name="description" content="{esc(description)}"><meta name="theme-color" content="#0b1522">
<link rel="canonical" href="https://thomasdlynn.dev{canonical}"><meta property="og:type" content="website"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="https://thomasdlynn.dev{canonical}"><meta property="og:image" content="{esc(full_image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{esc(title)}"><meta name="twitter:description" content="{esc(description)}"><meta name="twitter:image" content="{esc(full_image)}"><meta property="og:site_name" content="Thomas D. Lynn · Backbenchers Studio"><meta property="og:locale" content="en_US"><meta property="og:image:alt" content="{esc(title)}"><meta name="author" content="Thomas D. Lynn"><meta name="robots" content="index, follow, max-image-preview:large">
<link rel="icon" href="/images/jolly-roger-cyber-nobg.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Pirata+One&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/captains-log.css"><link rel="stylesheet" href="/css/pirate-voyage.css"><link rel="stylesheet" href="/css/logbook-refinement.css"><link rel="stylesheet" href="/css/resume-logbook.css"><link rel="stylesheet" href="/css/grand-line-logbook.css"><link rel="stylesheet" href="/css/project-log.css"><link rel="stylesheet" href="/css/tactile-voyage.css"><script src="/js/tactile-voyage.js" defer></script><script src="/js/captains-log.js" defer></script><script src="/js/resume-logbook.js" defer></script><script src="/js/preview-loops.js" defer></script><script type="application/ld+json">{json.dumps(schema)}</script></head><body>
<a class="skip-link" href="#main">Skip to content</a><div class="reading-progress" aria-hidden="true"></div>
<header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="Backbenchers Studio, home"><img src="/images/jolly-roger-cyber-nobg.png" width="48" height="35" alt=""><span>BACKBENCHERS<small>STUDIO / THOMAS D. LYNN</small></span></a><nav class="main-nav" id="main-nav" aria-label="Main navigation"><a href="/#projects">Projects</a><a href="/#about">About</a><a href="/#skills">Toolkit</a><a href="/#playground">Worlds</a><a href="/resume/" data-resume>CV ↗</a></nav><div class="header-tools"><button class="day-toggle" aria-label="Switch to day logbook" aria-pressed="false" hidden><span aria-hidden="true">☼</span><span class="theme-label">Day logbook</span></button><button class="motion-toggle" aria-pressed="false" title="Pause decorative motion" hidden><span aria-hidden="true">◌</span> <span class="motion-label">Motion on</span></button><a class="header-contact" href="/#contact">LET’S TALK ↗</a><button class="menu-toggle" aria-controls="main-nav" aria-expanded="false" hidden>MENU <span aria-hidden="true">☰</span></button></div></div></header>''')


PREVIEW_DIALOG = '''<dialog class="preview-dialog project-log" aria-labelledby="preview-title"><div class="preview-toolbar"><div><p class="eyebrow">PROJECT LOG / BACKBENCHERS</p><h2 id="preview-title">Project overview</h2></div><button class="preview-close" aria-label="Close preview">×</button></div><div class="project-log-scroll"><div class="project-log-grid"><div class="project-log-visual"><div class="preview-viewport" tabindex="0" role="region" aria-label="Project preview. Scroll to explore when enlarged."><img alt="" id="preview-image"><video class="preview-loop" id="preview-loop" muted loop playsinline preload="none" aria-hidden="true" hidden></video><p class="preview-unavailable" hidden>Project illustration</p></div><p class="preview-caption"></p><div class="preview-gallery" aria-label="Project views"></div><button class="preview-zoom" aria-pressed="false">Inspect image ⊕</button><button class="preview-motion" aria-pressed="false" hidden>Play preview ▷</button></div><article class="project-log-paper"><p class="preview-meta"></p><p class="preview-summary"></p><h3>Inside the project</h3><ul class="preview-features"></ul><h3>Built with</h3><ul class="preview-stack"></ul><details class="preview-context"><summary>The story & my contribution <span aria-hidden="true">＋</span></summary><p class="preview-story"></p><h3>My contribution</h3><p class="preview-role"></p><p class="preview-credit"></p></details><nav class="preview-sources" aria-label="Project sources"></nav></article></div></div><div class="preview-footer"><span class="preview-tip">A page from the project log</span><a class="text-link preview-case" href="/">Full case study ↗</a><a class="button preview-live" href="/" target="_blank" rel="noopener noreferrer">Visit project ↗</a><nav class="record-navigation" aria-label="Browse project logs"><button data-record-step="-1" aria-label="Previous project">←</button><span class="record-position" aria-live="polite"></span><button data-record-step="1" aria-label="Next project">→</button></nav></div></dialog>'''
PROJECT_DATA = '<script type="application/json" id="project-data">' + json.dumps(PROJECTS, ensure_ascii=False).replace('<', '\\u003c') + '</script>'


RESUME_DIALOG = '''<dialog class="resume-dialog" aria-labelledby="resume-dialog-title"><div class="resume-dialog-toolbar"><div><p class="eyebrow">BACKBENCHERS / CREW RECORD</p><h2 id="resume-dialog-title">The captain’s logbook</h2></div><div class="resume-dialog-actions"><a href="/resume/thomas-d-lynn-resume.pdf" download class="resume-pdf">Download PDF ↓</a><button class="resume-print" disabled>Print</button><button class="resume-close" aria-label="Close résumé">×</button></div></div><div class="resume-dialog-scroll"><p class="resume-load-status" role="status">Opening the logbook…</p><div class="resume-dialog-content"></div></div><div class="resume-dialog-footer"><a href="/resume/" class="resume-full-page">Full résumé page ↗</a><a href="/resume/thomas-d-lynn-resume.txt" download>Text résumé ↓</a></div></dialog>'''

RESUME_DIALOG = RESUME_DIALOG.replace('class="resume-dialog"', 'class="resume-dialog" data-resume-version="' + sha256((ROOT / 'templates/resume.html').read_bytes() + (ROOT / 'data/projects.json').read_bytes()).hexdigest()[:12] + '"')

FOOTER = PROJECT_DATA + PREVIEW_DIALOG + RESUME_DIALOG + '''<footer class="site-footer wrap"><a href="/" class="footer-brand"><img src="/images/jolly-roger-cyber-nobg.png" alt="" width="38" height="27"> BACKBENCHERS STUDIO</a><p>© 2026 Thomas D. Lynn · Backbenchers Studio.<br>One Piece fan tribute. Original characters belong to their creators.</p><a href="#main">BACK TO TOP ↑</a></footer></body></html>'''


def video_preview(p):
    if not p.get('video'): return ''
    return f'<video class="preview-loop" data-src="{esc(p["video"])}" poster="{esc(p["image"])}" muted loop playsinline preload="none" aria-hidden="true"></video>'


def illustration(p):
    if p['image']:
        cls = ' project-image-contain'
        return f'<span class="motion-preview"><img class="project-image{cls}" src="{esc(p["image"])}" alt="{esc(p.get('preview_caption',p['title']))}" width="1440" height="1000" loading="lazy" decoding="async">{video_preview(p)}</span>'
    if p['id'] == 'som-bi':
        return '<div class="concept-art som-art" aria-label="SOM BI typographic project illustration"><span class="concept-kicker">SCHOOL OF MANAGEMENT</span><strong>SOM<span>BI</span></strong><div class="concept-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><span>TEACHING / RESEARCH / INSIGHT</span><small>PROJECT ILLUSTRATION · NO UNIVERSITY DATA</small></div>'
    return '<div class="concept-art epst-art"><span>ECONOMICS / IDEAS / ACADEMIC LIFE</span><strong>EPST<span>↗</span></strong><span>A STUDENT’S PERSPECTIVE</span></div>'


def preview_attrs(p):
    return f'data-project-id="{p["id"]}" data-preview="{esc(p["image"] or "")}" data-preview-title="{esc(p["title"])}" data-preview-case="/projects/{p["id"]}/" data-preview-url="{esc(p["url"] or "")}" aria-label="Explore {esc(p["title"])} project"'


def preview_cover(p, index):
    if not p['image']:
        return f'<a class="project-cover" href="/projects/{p["id"]}/" {preview_attrs(p)}>{illustration(p)}</a>'
    address = urlparse(p['url']).netloc if p['url'] else 'PROJECT PREVIEW'
    return f'''<a class="project-cover framed-preview" href="/projects/{p['id']}/" {preview_attrs(p)}><span class="preview-chrome"><span class="preview-lights" aria-hidden="true"><i></i><i></i><i></i></span><span>{esc(address)}</span><span class="preview-counter">{index:02}</span></span><span class="preview-screen">{illustration(p)}</span><span class="preview-bottom"><span>OPEN PROJECT LOG</span><span>Overview <b aria-hidden="true">⤢</b></span></span></a>'''


def card(p, index):
    terms = ' '.join([p['title'], p['eyebrow'], p['summary'], p['story'], p['role'], *p['features'], *p['stack'], p['category'], p['status'], p['credit'] or ''])
    return f'''<article class="project-card" data-category="{esc(p['category'])}" data-search="{esc(terms.lower())}">{preview_cover(p, index)}<div class="project-body"><p class="project-eyebrow">{esc(p['category'])}</p><h3><a href="/projects/{p['id']}/" {preview_attrs(p)}>{esc(p['title'])}<span aria-hidden="true">↗</span></a></h3><p class="project-summary">{esc(p['summary'])}</p></div></article>'''


SKILLS = [
    ('01', 'Games & real-time worlds', 'Unity · C# · Photon · Three.js · React Three Fiber · WebGL', 'Multiplayer, playable scenes, lighting, weather, and interaction.', 'endgame', 'End Game Union & browser worlds'),
    ('02', 'Web platforms & commerce', 'Next.js · React · Vue / Nuxt · Astro · Laravel', 'From public storefronts to the admin tools running the business.', 'burmamart', 'BurmaMart & commerce projects'),
    ('03', 'Mobile experiences', 'Flutter / Dart · Android / Java · iOS / Swift', 'Buyer apps, merchant tools, and companion experiences for real products.', 'welmal', 'Welmal & mobile ecosystems'),
    ('04', 'Backends & integrations', 'Node.js · Express · PHP · MySQL · PostgreSQL · Prisma', 'APIs, shared data models, provider integrations, and operational workflows.', 'som-bi', 'SOM BI & connected systems'),
    ('05', 'Media & creative tools', 'FFmpeg · HLS · Python · OpenType · fontmake', 'Publishing, adaptive video, and tools for making Myanmar type.', 'glyph-studio', 'Glyph Studio & AWAM'),
    ('06', 'Bots, motion & delivery', 'Telegram · Messenger · GSAP · GitHub Pages · Nginx', 'Conversational operations, expressive interfaces, and web delivery.', 'dk-gaming', 'DK Gaming & automation'),
]


def playground():
    ids = ['onigashima', 'elbaf', 'hledan', 'grand-line-fizz', 'naruto', 'jjk']
    names = ['Onigashima', 'Elbaf', 'Hledan', 'Grand Line Fizz', 'Naruto', 'Jujutsu Kaisen']
    modes = ['SAIL / EXPLORE', 'PLAY / EXPLORE', 'WALK / WEATHER', '3D / INTERACTION', 'SCROLL / MOTION', 'SCROLL / MOTION']
    voyages = [next(p for p in PROJECTS if p['id'] == key) for key in ids]
    tabs = ''.join(f'<button role="tab" id="world-tab-{p["id"]}" aria-controls="world-{p["id"]}" aria-selected="{str(i == 0).lower()}" tabindex="{0 if i == 0 else -1}"><img src="{p["image"]}" alt="" width="160" height="90" loading="lazy"><span><small>{i+1:02} / {modes[i]}</small>{names[i]}</span></button>' for i, p in enumerate(voyages))
    panels = ''
    for i, p in enumerate(voyages):
        sources = ''.join(link(label + ' ↗', url, 'world-source') for label, url in p['links'])
        panels += f'''<article class="world-panel" id="world-{p['id']}" role="tabpanel" aria-labelledby="world-tab-{p['id']}" tabindex="0"><div class="world-scene"><div class="world-preview"><img src="{p['image']}" alt="{esc(p['title'])} preview" width="1200" height="630" loading="lazy">{video_preview(p)}</div><div class="world-hud"><span>BB / INTERACTIVE LAB</span><span>{modes[i]} <i aria-hidden="true">◈</i></span></div><div class="world-copy"><p class="eyebrow">EXPERIMENT {i+1:02} / {esc(p['stack'][0])}</p><h3>{esc(p['title'])}</h3><p>{esc(p['summary'])}</p><div class="world-actions">{link('Launch experience ↗', p['url'], 'button red-button')}{link('Project details ↗', '/projects/'+p['id']+'/', 'text-link')}</div></div><span class="world-index" aria-hidden="true">0{i+1}</span></div><details class="world-caption"><summary>Sources & creator credits <span aria-hidden="true">＋</span></summary><div class="world-sources">{sources}</div><p class="world-credit">{esc(p['credit'])}</p></details></article>'''
    return f'''<section class="playground section-space" id="playground"><div class="wrap"><div class="section-top"><p class="eyebrow">02 / PLAYABLE WORLDS</p><a class="text-link" href="/showcase/">Open gallery ↗</a></div><div class="section-heading"><h2>Worlds you can<span class="serif">step into.</span></h2><div class="world-heading-meta"><p>Six browser adventures. Choose a world and step inside.</p><div class="world-navigation" hidden><span id="world-position" aria-live="polite">01 / 06</span><button data-world-step="-1" aria-label="Previous experience">←</button><button data-world-step="1" aria-label="Next experience">→</button></div></div></div><div class="world-stage">{panels}</div><div class="rail-navigation" hidden><p>Pick a world · drag or swipe</p><div><button data-world-step="-1" aria-label="Previous world in gallery">←</button><button data-world-step="1" aria-label="Next world in gallery">→</button></div></div><div class="world-tabs" role="tablist" aria-label="Choose a showcase" hidden>{tabs}</div></div></section>'''


def personal_collection():
    entries = [('nyan', 'Nyan Production', 'Creative producer & director', 'A film-led portfolio with a clear editorial rhythm.'), ('phyoe', 'Phyoe Dhana', 'Filmmaker', 'Films and documentary work, presented with space to breathe.'), ('hein', 'Hein Zaw', 'Fitness trainer', 'A focused identity for coaching and personal training.'), ('yoon', 'Yoon Nadi Htet', 'English teacher', 'A warm, approachable portfolio built around learning.'), ('lynn-khar', 'Lynn Khar', 'Poet & author', 'Writing, books, and a connected pre-order workflow.')]
    cards = ''
    for i, (slug, name, role, desc) in enumerate(entries):
        p = next(p for p in PROJECTS if p['id'] == slug)
        domain = p['url'].replace('https://','').rstrip('/')
        cards += f'''<article class="personal-card"><div class="browser-frame"><div class="browser-bar"><span class="browser-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>{domain}</span><span aria-hidden="true">↗</span></div><a class="personal-preview" href="/projects/{p['id']}/" {preview_attrs(p)}><img src="{p['image']}" alt="" width="1440" height="1000" loading="lazy">{video_preview(p)}<span class="preview-personal-hint">Explore project ↗</span></a></div><div class="personal-copy"><p class="eyebrow">{role}</p><h3>{link(name, '/projects/'+slug+'/')}<span>0{i+1}</span></h3><div class="personal-links">{link('View case study ↗', '/projects/'+slug+'/', 'text-link')}{link('Visit website ↗', p['url'], 'text-link')}</div></div></article>'''
    return f'''<section class="personal-collection" id="portfolio-sites"><div class="wrap"><details class="personal-disclosure"><summary><span><span class="eyebrow">A CLOSER LOOK / PERSONAL WEBSITES</span><span class="collection-title">Five people. Five distinct identities.</span></span><span class="disclosure-action">Explore collection <b aria-hidden="true">＋</b></span></summary><div class="personal-toolbar"><span>DESIGN & DEVELOPMENT / SELECTED SITES</span><div class="personal-controls" hidden><button data-personal-step="-1" aria-label="Previous personal website">←</button><button data-personal-step="1" aria-label="Next personal website">→</button></div></div><div class="personal-track" tabindex="0" role="region" aria-label="Personal website collection. Use arrow keys or swipe to browse.">{cards}</div><p class="collection-hint">Scroll or swipe to explore <span aria-hidden="true">⟷</span></p></details></div></section>'''


TECH = [
 [('Unity','unity'),('C#','csharp'),('Photon',None),('Three.js','threejs'),('React Three Fiber','react'),('WebGL',None)],
 [('Next.js','nextjs'),('React','react'),('Vue','vuejs'),('Nuxt','nuxtjs'),('Astro','astro'),('Laravel','laravel')],
 [('Flutter','flutter'),('Dart','dart'),('Android','android'),('Java','java'),('Swift','swift')],
 [('Node.js','nodejs'),('Express','express'),('PHP','php'),('MySQL','mysql'),('PostgreSQL','postgresql'),('Prisma','prisma')],
 [('Python','python'),('FFmpeg',None),('HLS',None),('OpenType',None),('fontmake',None)],
 [('Telegram',None),('Messenger',None),('GSAP',None),('GitHub Pages','github'),('Nginx','nginx')],
]
GLYPHS = [
 '<path d="m8 8-3 4 3 4m8-8 3 4-3 4M10 19l4-14"/>',
 '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01M8 13h8m-8 3h5"/>',
 '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4m-3 14h2M9 9h6v5H9z"/>',
 '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>',
 '<path d="m4 20 7-16h2l7 16M7 14h10M3 20h4m10 0h4"/><circle cx="12" cy="4" r="1"/>',
 '<path d="m3 12 18-9-6 18-4-7-8-2Z M11 14 21 3"/>',
]
MONOGRAMS = {'Photon':'P','WebGL':'GL','FFmpeg':'▶','HLS':'≋','OpenType':'Aa','fontmake':'ƒ','Telegram':'↗','Messenger':'↯','GSAP':'G'}
TECH_DOCS = {'Dart':'https://dart.dev/overview', 'Node.js':'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs', 'Nginx':'https://nginx.org/en/docs/'}

def skill_cards():
    out = ''
    for i, (n, title, _, desc, slug, label) in enumerate(SKILLS):
        chips = ''
        for name, icon in TECH[i]:
            visual = f'<img src="/images/tech/{icon}.svg" alt="" width="28" height="28" loading="lazy">' if icon else f'<span class="tech-monogram" aria-hidden="true">{MONOGRAMS[name]}</span>'
            if name in TECH_DOCS:
                chips += f'<a class="tech-chip" href="{TECH_DOCS[name]}" target="_blank" rel="noopener noreferrer" aria-label="{esc(name)} documentation (opens in a new tab)" title="{esc(name)} documentation">{visual}<span>{esc(name)} ↗</span></a>'
            else:
                chips += f'<a class="tech-chip" href="/?q={quote(name)}#projects" data-tech="{esc(name)}" aria-label="Find projects using {esc(name)}">{visual}<span>{esc(name)}</span></a>'
        out += f'<details class="skill"><summary><span class="skill-header"><svg viewBox="0 0 24 24" aria-hidden="true">{GLYPHS[i]}</svg><span class="skill-number">0{i+1}</span><span class="skill-plus" aria-hidden="true">＋</span></span><h3>{title}</h3><span class="skill-teaser">{" · ".join(name for name, _ in TECH[i][:3])}</span></summary><div class="skill-detail"><p>{desc}</p><div class="tech-grid">{chips}</div><a href="/projects/{slug}/">{label} ↗</a></div></details>'
    return out


def build_gallery():
    entries = [p for p in PROJECTS if p['category'] == 'Immersive']
    cards = ''
    for i, p in enumerate(entries):
        sources = ''.join(link(label + ' ↗', url) for label, url in p['links'])
        cards += f'''<article class="experiment-card"><a class="experiment-cover" href="/projects/{p['id']}/" {preview_attrs(p)}><img src="{p['image']}" alt="{esc(p['title'])} preview" width="1200" height="630" loading="lazy">{video_preview(p)}<span class="experiment-number">0{i+1} / INTERACTIVE</span><span class="experiment-launch" aria-hidden="true">↗</span></a><div class="experiment-copy"><p class="eyebrow">{' / '.join(esc(t) for t in p['stack'][:2])}</p><h2>{link(p['title'], p['url'])}</h2><p>{esc(p['summary'])}</p><div class="showcase-sources">{sources}{link('Project details ↗', '/projects/'+p['id']+'/')}</div><p class="experiment-credit">{esc(p['credit'])}</p></div></article>'''
    content = f'''<main id="main" class="gallery-page wrap"><a class="back-link" href="/">← BACK TO THE PORTFOLIO</a><div class="section-heading"><div><p class="eyebrow">BACKBENCHERS / INTERACTIVE LAB</p><h1>Playable worlds.<span class="serif">Creative experiments.</span></h1></div><p>Six browser experiences across real-time 3D, interactive storytelling, and animation. Open a project log, then launch its world.</p></div><div class="experiment-grid">{cards}</div></main>'''
    (ROOT / 'showcase/index.html').write_text(head('Interactive Lab — Thomas D. Lynn', 'Explore six interactive browser experiences, with project stories, source code, and creator credits.', '/showcase/') + content + FOOTER)


def build_home():
    template = (ROOT / 'templates/home.html').read_text()
    filters = f'<button class="filter active" data-filter="All" aria-pressed="true">All projects <sup>{len(PROJECTS)}</sup></button>'
    for cat in CATEGORIES:
        filters += f'<button class="filter" data-filter="{esc(cat)}" aria-pressed="false">{esc(cat)} <sup>{sum(p["category"] == cat for p in PROJECTS)}</sup></button>'
    skills = skill_cards()
    content = template.replace('{{COUNT}}', str(len(PROJECTS))).replace('{{FILTERS}}', filters).replace('{{CARDS}}', '\n'.join(card(p, i) for i, p in enumerate(PROJECTS, 1))).replace('{{SKILLS}}', skills).replace('{{PLAYGROUND}}', playground()).replace('{{PERSONAL_COLLECTION}}', personal_collection())
    home_head = head('Thomas D. Lynn — Software Engineer & Creative Developer', 'Independent software engineering, games, commerce, and creative web development. Explore the projects and stories of Thomas D. Lynn, aka Thiha Lynn.', '/').replace('href="/#', 'href="#')
    (ROOT / 'index.html').write_text(home_head + content + FOOTER)


def build_project(p, i):
    credit = f'<aside class="credit-note"><p class="eyebrow">COLLABORATORS / CREDITS</p><p>{esc(p["credit"])}</p></aside>' if p['credit'] else ''
    sources = list(p['links'])
    if p['url'] and p['url'] not in [s[1] for s in sources]:
        sources.insert(0, ['Visit the project', p['url']])
    source_html = '<ul class="source-list">' + ''.join(f'<li>{link(label + " ↗", url)}</li>' for label, url in sources) + '</ul>' if sources else '<p>This is an internal university project. A public case study is shared here; the deployment and university data remain private.</p>'
    call_to_action = link('Visit the project ↗', p['url'], 'button red-button') if p['url'] else '<span class="private-label">INTERNAL CASE STUDY · NO PUBLIC DEPLOYMENT</span>' if p['id'] == 'som-bi' else '<span class="private-label">PROJECT ADDRESS CURRENTLY UNAVAILABLE</span>'
    next_p = PROJECTS[(i + 1) % len(PROJECTS)]
    gallery = ''
    if p.get('gallery'):
        gallery = '<p class="case-preview-note">' + esc(p.get('gallery_note', 'Interface recreations based on the SOM BI source layouts. All names and metrics are synthetic sample data.')) + '</p><div class="system-gallery">'
        for item in p['gallery']:
            attrs = preview_attrs({**p, 'image': item['image'], 'title': p['title'] + ' — ' + item['title']})
            gallery += f'<figure><a href="{item["image"]}" {attrs}><img src="{item["image"]}" alt="{esc(item["title"])} project view" width="1440" height="1000" loading="lazy"></a><figcaption><strong>{esc(item["title"])}</strong><p>{esc(item["description"])}</p></figcaption></figure>'
        gallery += '</div>'
    signoff = '<div class="crew-signoff"><img src="/images/captain/thomas-captain-v2.webp" alt="Thomas in a straw hat" width="1129" height="1393" loading="lazy"><div><strong>A page from my logbook.</strong><a href="/resume/" data-resume>Meet the builder · Open my CV ↗</a></div></div>'

    markup = f'''<main id="main" class="case-page"><div class="wrap"><a class="back-link" href="/#projects">← ALL PROJECTS</a><div class="case-top"><p class="eyebrow">PROJECT {i+1:02} / {esc(p['category'])}</p><span class="small-label">{esc(p['status'])}</span></div><h1>{esc(p['title'])}</h1><p class="case-deck">{esc(p['summary'])}</p><p class="eyebrow case-org">{esc(p['eyebrow'])}</p><div class="case-hero">{illustration(p)}</div>{gallery}<div class="case-grid"><div class="case-main"><section><p class="eyebrow red">THE STORY</p><h2>The context.</h2><p>{esc(p['story'])}</p></section><section><p class="eyebrow red">MY CONTRIBUTION</p><h2>My role.</h2><p>{esc(p['role'])}</p></section><section><p class="eyebrow red">INSIDE THE BUILD</p><h2>The details that make it work.</h2><ul class="feature-list">{''.join('<li>'+esc(f)+'</li>' for f in p['features'])}</ul></section>{credit}{signoff}</div><aside class="case-sidebar"><p class="eyebrow">TECHNOLOGIES</p><ul class="stack-list">{''.join('<li>'+esc(t)+'</li>' for t in p['stack'])}</ul>{call_to_action}<div class="case-sources"><p class="eyebrow">EXPLORE / SOURCES</p>{source_html}</div><p class="case-date">PROJECT NOTES · SEPTEMBER 2026</p></aside></div><nav class="next-voyage" aria-label="Next project"><span class="eyebrow">KEEP EXPLORING</span><a href="/projects/{next_p['id']}/">{esc(next_p['title'])}<span>↗</span></a></nav></div></main>'''
    dest = ROOT / 'projects' / p['id']
    dest.mkdir(parents=True, exist_ok=True)
    (dest / 'index.html').write_text(head(p['title'] + ' — Thomas D. Lynn', p['summary'], '/projects/' + p['id'] + '/', p['image'] or '/images/og-thomas.jpg') + markup + FOOTER)


def build_resume():
    paper = (ROOT / 'templates/resume.html').read_text().replace('{{COUNT}}', str(len(PROJECTS)))
    content = f'''<main id="main" class="resume-page"><div class="resume-page-toolbar"><a class="back-link" href="/">← BACK TO PORTFOLIO</a><div><a class="button logbook-button" href="/resume/thomas-d-lynn-resume.pdf" download>Download PDF ↓</a><a href="/resume/thomas-d-lynn-resume.txt" download>Text résumé ↓</a><button class="button" id="print-resume" hidden>Print ↗</button></div></div><p class="resume-print-hint">A captain’s log on screen. A clean, single-column résumé when printed.</p><div class="resume-stage">{paper}</div></main>'''
    (ROOT / 'resume').mkdir(exist_ok=True)
    (ROOT / 'resume/index.html').write_text(head('Thomas D. Lynn — Software Engineer Résumé & CV', 'Thomas D. Lynn (Thiha Lynn): software engineering project experience in games, logistics, commerce, web and mobile. Read, print, or download a text résumé.', '/resume/') + content + FOOTER)
    from html.parser import HTMLParser
    class ResumeText(HTMLParser):
        def __init__(self):
            super().__init__(); self.parts = []; self.skip = 0
        def handle_starttag(self, tag, attrs):
            a = dict(attrs)
            if tag in ['img', 'br', 'hr']: return
            if self.skip or a.get('aria-hidden') == 'true' or tag == 'figure': self.skip += 1
            elif tag in ['p', 'h1', 'h2', 'h3', 'li', 'a', 'address', 'footer']: self.parts.append('\n')
        def handle_endtag(self, tag):
            if self.skip and tag not in ['img', 'br']: self.skip -= 1
            elif not self.skip and tag in ['p', 'h1', 'h2', 'h3', 'li', 'a']: self.parts.append('\n')
        def handle_data(self, data):
            if not self.skip: self.parts.append(data)
    parser = ResumeText(); parser.feed(paper)
    lines = [line.strip().replace('↗', '').strip() for line in ''.join(parser.parts).splitlines() if line.strip()]
    lines = [line for line in lines if line not in ['THE CAPTAIN’S LOG']]
    (ROOT / 'resume/thomas-d-lynn-resume.txt').write_text('\n\n'.join(lines) + '\n')


from runpy import run_path
run_path(str(ROOT / 'scripts/build_expedition_shell.py'), run_name='__main__')
build_home()
for i, p in enumerate(PROJECTS):
    build_project(p, i)
build_resume()
build_gallery()
paths = ['/', '/resume/', '/showcase/', '/blog/opus-4-6-ai-engineering.html'] + ['/projects/' + p['id'] + '/' for p in PROJECTS]
paths += ['/showcase/' + slug + '/' for slug in ['hledan', 'elbaf', 'onigashima', 'one-piece', 'naruto', 'jjk']]
(ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(f'<url><loc>https://thomasdlynn.dev{p}</loc></url>' for p in paths) + '\n</urlset>\n')
print(f'Built homepage, showcase gallery, {len(PROJECTS)} case studies, résumé, and sitemap.')
