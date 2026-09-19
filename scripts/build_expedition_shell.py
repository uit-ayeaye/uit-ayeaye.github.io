#!/usr/bin/env python3
"""Idempotent shared navigation; never modify the independently built scene engines."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
CSS='<link rel="stylesheet" href="/css/expedition-shell.css">'
JS='<script src="/js/expedition-shell.js" defer></script>'
DOCK='''<!-- expedition-shell:start --><details class="expedition-dock"><summary><img src="/images/jolly-roger-cyber-nobg.png" alt="" width="48" height="35">Voyage log <span aria-hidden="true">⌁</span></summary><div class="expedition-chart"><h2>Chart your next stop.</h2><p>BACKBENCHERS / THE GRAND LINE</p><nav aria-label="Voyage destinations"><a href="/"><img src="/images/captain/thomas-captain.webp" alt="" width="1129" height="1393">Meet the captain<span>↗</span></a><a href="/#projects"><img src="/images/backbenchers-ship.png" alt="" width="400" height="533">Project fleet<span>↗</span></a><a href="/showcase/"><img src="/images/jolly-roger-cyber-nobg.png" alt="" width="48" height="35">Explore all six worlds<span>↗</span></a><a href="/resume/"><img src="/images/captain/thomas-wanted.webp" alt="" width="1046" height="1503">Captain’s résumé<span>↗</span></a></nav></div></details><!-- expedition-shell:end -->'''
paths=[ROOT/'showcase'/slug/'index.html' for slug in ['hledan','elbaf','onigashima','one-piece','naruto','jjk']]+list((ROOT/'blog').glob('*.html'))
for p in paths:
    s=p.read_text();s=re.sub(r'<!-- expedition-shell:start -->.*?<!-- expedition-shell:end -->','',s,flags=re.S);s=s.replace(CSS,'').replace('</head>',CSS+'</head>');s=s.replace(JS,'').replace('</body>',DOCK+JS+'</body>')
    if p.parent.name=='blog':
        s=s.replace('<body>','<body class="logbook-article">').replace('../images/my-profile.png','/images/captain/thomas-captain.webp')
        # Portrait asset is an original illustration, never a real headshot.
        s=s.replace('alt="Thomas D. Lynn"','alt="Illustrated captain portrait of Thomas D. Lynn"')
    p.write_text(s)
print(f'Applied the voyage log to {len(paths)} standalone pages.')
