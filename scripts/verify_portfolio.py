#!/usr/bin/env python3
"""Validate generated routes, local assets, anchors, and private-project boundaries."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
from hashlib import sha256
ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'data/projects.json').read_text())
class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.refs=[]; self.ids=[]; self.h1=0; self.feed(text)
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag=='h1':self.h1+=1
        for k in ['src','href']:
            if a.get(k):self.refs.append(a[k])
        if tag=='img':assert 'alt' in a, 'Missing alt attribute'
files=[ROOT/'index.html', ROOT/'resume/index.html', ROOT/'showcase/index.html', ROOT/'showcase/jjk/index.html']+[ROOT/'projects'/p['id']/'index.html' for p in DATA]
errors=[]
for f in files:
    page=Page(f.read_text())
    if page.h1 != 1:errors.append(f'{f.name}: expected one h1')
    if len(page.ids) != len(set(page.ids)):errors.append(f'{f}: duplicate IDs')
    for ref in page.refs:
        u=urlsplit(ref)
        if u.scheme or u.netloc:continue
        target=(ROOT/unquote(u.path).lstrip('/')) if u.path.startswith('/') else f.parent/unquote(u.path)
        if not u.path:target=f
        if target.is_dir():target=target/'index.html'
        if not target.exists():errors.append(f'{f.relative_to(ROOT)}: missing {ref}')
        elif u.fragment and target.suffix=='.html' and u.fragment not in Page(target.read_text()).ids:errors.append(f'{f.relative_to(ROOT)}: missing anchor {ref}')
som=next(p for p in DATA if p['id']=='som-bi')
assert som['url'] is None and not som['links'], 'SOM must not link to internal service'
assert som['preview_kind'] == 'synthetic-interface'
for image in [som['image'], *[item['image'] for item in som['gallery']]]:
    assert 'SAMPLE DATA' in (ROOT / image.lstrip('/')).with_suffix('.svg').read_text(), 'Label all recreated SOM screens'
combined='\n'.join(f.read_text() for f in files)
for private in ['som.mlbbshop.app','staff_code','6631503092','6631503097','6631503088','/Users/thomas','api_key','DATABASE_URL']:
    assert private not in combined, f'Unexpected private detail: {private}'
assert 'Madric A' in (ROOT/'projects/hledan/index.html').read_text()
assert 'Meghamittal0920' in (ROOT/'projects/grand-line-fizz/index.html').read_text()
assert 'currently unavailable' in (ROOT/'projects/epst/index.html').read_text().lower()
assert (ROOT/'resume/pdf-source.sha256').read_text().strip() == sha256((ROOT/'templates/resume.html').read_bytes()).hexdigest(), 'Rebuild the PDF after changing the résumé template'
for slug in ['golden-gates', 'strikers']:
    assert any(p['id'] == slug for p in DATA)
assert 'ztvmm.live' not in next(p for p in DATA if p['id']=='golden-gates')['url'], 'Keep STRIKERS separate from logistics'
assert 'THE CAPTAIN' not in (ROOT/'resume/thomas-d-lynn-resume.txt').read_text(), 'Text résumé must omit decorative labels'
for slug in ['unilab','chinese-studio','academy','mahar-yangon','thakhin-os','campus-one']:
    assert any(p['id'] == slug and p['image'] and p['features'] and p['links'] for p in DATA)
assert 'backbenchers-identity.webp' in next(p for p in DATA if p['id']=='backbenchers')['image']
assert 'awam-loading.webp' in next(p for p in DATA if p['id']=='awam')['image']
assert 'wanted-original' in (ROOT/'index.html').read_text(), 'Preserve original wanted-poster text layer'
if errors:raise SystemExit('\n'.join(errors))
print(f'PASS: {len(files)} generated pages; local routes, assets, anchors, credits, private-project boundaries.')
