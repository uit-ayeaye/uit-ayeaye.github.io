#!/usr/bin/env python3
"""Idempotent shared navigation; never modify the independently built scene engines."""
from pathlib import Path
import re
from hashlib import sha256
ROOT=Path(__file__).resolve().parents[1]
CSS='<link rel="stylesheet" href="/css/expedition-shell.css">'
PAPER='<link rel="stylesheet" href="/css/studio-fonts.css"><link rel="stylesheet" href="/css/scroll-logbook.css">'
JS='<script src="/js/tactile-voyage.js" defer></script><script src="/js/expedition-shell.js" defer></script>'
DOCK='''<!-- expedition-shell:start --><details class="expedition-dock"><summary><img src="/images/jolly-roger-cyber-nobg.png" alt="" width="48" height="35">Voyage log <span aria-hidden="true">⌁</span></summary><div class="expedition-chart"><h2>Chart your next stop.</h2><p>BACKBENCHERS / THE GRAND LINE</p><nav aria-label="Voyage destinations"><a href="/"><img src="/images/captain/thomas-captain-v2.webp" alt="" width="1129" height="1393">Meet the captain<span>↗</span></a><a href="/#projects"><img src="/images/backbenchers-ship.png" alt="" width="400" height="533">Project fleet<span>↗</span></a><a href="/showcase/"><img src="/images/jolly-roger-cyber-nobg.png" alt="" width="48" height="35">Explore all six worlds<span>↗</span></a><a href="/resume/"><img src="/images/captain/thomas-captain-v2.webp" alt="" width="1046" height="1503">Captain’s résumé<span>↗</span></a></nav></div></details><!-- expedition-shell:end -->'''
paths=[ROOT/'showcase'/slug/'index.html' for slug in ['hledan','elbaf','onigashima','one-piece','naruto','jjk']]+list((ROOT/'blog').glob('*.html'))
for p in paths:
    s=re.sub(r'(expedition-shell\.(?:css|js))\?v=[a-f0-9]+', r'\1', p.read_text());s=re.sub(r'<!-- expedition-shell:start -->.*?<!-- expedition-shell:end -->','',s,flags=re.S);s=s.replace(CSS,'').replace('</head>',CSS+'</head>');s=re.sub(r'<script src="/js/tactile-voyage.js(?:\?v=[a-f0-9]+)?" defer></script>', '', s);s=s.replace(JS,'').replace('<script src="/js/expedition-shell.js" defer></script>','').replace('</body>',DOCK+JS+'</body>')
    s=re.sub(r'<link rel="stylesheet" href="/css/(?:scroll-logbook|studio-fonts)\.css(?:\?v=[a-f0-9]+)?">','',s).replace('</head>',PAPER+'</head>')
    # Canvas-led worlds still need an accessible document title.
    if '<h1' not in s.lower():
        title = {'hledan':'Hledan Junction — Real-Time 3D Yangon','naruto':'Naruto — Sage Mode Awakening'}.get(p.parent.name)
        if title: s=re.sub(r'(<body[^>]*>)', r'\1<h1 class="expedition-heading">'+title+'</h1>',s,count=1)
    if p.parent.name=='blog':
        s=s.replace("localStorage.getItem('pirate-theme')","localStorage.getItem('bb-theme-v2')")
        s=s.replace('/images/captain/thomas-captain.webp','/images/captain/thomas-captain-v2.webp')
        s=s.replace('<body>','<body class="logbook-article">').replace('../images/my-profile.png','/images/captain/thomas-captain-v2.webp')
        # Portrait asset is an original illustration, never a real headshot.
        s=s.replace('alt="Thomas D. Lynn"','alt="Illustrated captain portrait of Thomas D. Lynn"')
    for asset in ['css/studio-fonts.css', 'css/scroll-logbook.css', 'css/expedition-shell.css', 'js/expedition-shell.js', 'js/tactile-voyage.js']:
        digest=sha256((ROOT / asset).read_bytes()).hexdigest()[:12]
        s=s.replace('"/'+asset+'"','"/'+asset+'?v='+digest+'"')
    p.write_text(s)
print(f'Applied the voyage log to {len(paths)} standalone pages.')
