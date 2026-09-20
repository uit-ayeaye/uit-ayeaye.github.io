#!/usr/bin/env python3
"""Normalize public-page sharing/search metadata without touching scene engines."""
from pathlib import Path
from html.parser import HTMLParser
from html import escape, unescape
import json, re
ROOT=Path(__file__).resolve().parents[1]
SITE='https://thomasdlynn.dev'
COVER='/images/social/thomas-captains-studio-v3.jpg'
PROJECTS=json.loads((ROOT/'data/projects.json').read_text())
IMAGES=json.loads((ROOT/'data/social-images.json').read_text())
class Head(HTMLParser):
    def __init__(self,text):
        super().__init__();self.meta={};self.feed(text)
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='meta':self.meta[attrs.get('name',attrs.get('property',''))]=attrs.get('content','')
def tag(key,value):
    attr='property' if key.startswith('og:') else 'name'
    return f'<meta {attr}="{key}" content="{escape(str(value),quote=True)}">'
paths=['/','/resume/','/showcase/']+['/projects/'+p['id']+'/' for p in PROJECTS]
scenes=dict(zip(['onigashima','elbaf','hledan','one-piece','naruto','jjk'],['onigashima','elbaf','hledan','grand-line-fizz','naruto','jjk']))
paths+=['/showcase/'+slug+'/' for slug in scenes]
paths+=['/blog/opus-4-6-ai-engineering.html','/blog/opus-4-6-ai-engineering-mm.html']
for route in paths:
    file=ROOT/(route.strip('/')+('/index.html' if route.endswith('/') else '') if route!='/' else 'index.html')
    markup=file.read_text();head,body=markup.split('</head>',1)
    meta=Head(head).meta
    title=unescape(re.search(r'<title>(.*?)</title>',head,re.S).group(1))
    description=meta.get('description','Explore the work of Thomas D. Lynn, software engineer and creative developer at Backbenchers Studio.')
    image=COVER
    project=next((p for p in PROJECTS if route=='/projects/'+p['id']+'/'),None)
    if route.startswith('/showcase/') and route!='/showcase/':
        project=next(p for p in PROJECTS if p['id']==scenes[route.split('/')[2]])
        title=project['title']+' — Interactive World by Thomas D. Lynn'
        description=project['summary']+' Explore the browser experience, project notes, and original creator credits.'
    if project:image=project['image'] if project['image'] and not project['image'].endswith('.svg') else COVER
    article=route.startswith('/blog/')
    language='my' if route.endswith('-mm.html') else 'en'
    if article and language=='my':title='Opus 4.6 & AI-Powered Engineering (မြန်မာ) — Thomas D. Lynn'
    head=re.sub(r'<title>.*?</title>','<title>'+escape(title)+'</title>',head,count=1,flags=re.S)
    # Rewrite only ordinary head tags, leaving bundled JavaScript strings untouched.
    def remove_meta(match):
        text=match.group(0)
        parsed=Head(text).meta
        return '' if any(k.startswith(('og:','twitter:')) or k in ['description','robots','author'] for k in parsed) else text
    head=re.sub(r'<meta\s+[^>]*>',remove_meta,head,flags=re.I)
    head=re.sub(r'<link\b(?=[^>]*\brel=["\']canonical["\'])[^>]*>','',head,flags=re.I)
    head=re.sub(r'<!-- studio-seo:start -->.*?<!-- studio-seo:end -->','',head,flags=re.S)
    info=IMAGES[image]
    values={'description':description,'author':'Thomas D. Lynn','robots':'index, follow, max-image-preview:large','og:type':'article' if article else 'website','og:title':title,'og:description':description,'og:url':SITE+route,'og:site_name':'Thomas D. Lynn · Backbenchers Studio','og:locale':'my_MM' if language=='my' else 'en_US','og:image':SITE+image,'og:image:secure_url':SITE+image,'og:image:type':info['mime'],'og:image:width':info['width'],'og:image:height':info['height'],'og:image:alt':(project['title']+' project preview' if project else 'Thomas D. Lynn — Software Engineer & Creative Developer, illustrated captain on a midnight sea chart'),'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':SITE+image,'twitter:image:alt':(project['title']+' project preview' if project else 'Thomas D. Lynn and Backbenchers Studio')}
    extras='<link rel="canonical" href="'+SITE+route+'">'+''.join(tag(k,v) for k,v in values.items())
    if article:
        en=SITE+'/blog/opus-4-6-ai-engineering.html';my=SITE+'/blog/opus-4-6-ai-engineering-mm.html'
        extras+=f'<link rel="alternate" hreflang="en" href="{en}"><link rel="alternate" hreflang="my" href="{my}"><link rel="alternate" hreflang="x-default" href="{en}">'
        extras+='<script type="application/ld+json">'+json.dumps({'@context':'https://schema.org','@type':'Article','headline':title,'description':description,'url':SITE+route,'inLanguage':language,'image':SITE+image,'author':{'@type':'Person','name':'Thomas D. Lynn','url':SITE+'/','sameAs':['https://github.com/Thiha-Lynn']},'mainEntityOfPage':SITE+route},ensure_ascii=False)+'</script>'
    elif route.startswith('/showcase/') and project:
        extras+='<script type="application/ld+json">'+json.dumps({'@context':'https://schema.org','@type':'WebPage','name':title,'description':description,'url':SITE+route,'image':SITE+image,'inLanguage':'en','isPartOf':{'@type':'WebSite','name':'Backbenchers Studio','url':SITE+'/'},'mainEntity':{'@type':'CreativeWork','name':project['title'],'creditText':project['credit'] or '', 'url':SITE+'/projects/'+project['id']+'/'}},ensure_ascii=False)+'</script>'
    head=re.sub(r'[ \t]+(?=\n)','',head)
    markup=head+'<!-- studio-seo:start -->'+extras+'<!-- studio-seo:end --></head>'+body
    markup=markup.replace('https://github.com/uit-ayeaye"','https://github.com/Thiha-Lynn"')
    file.write_text(markup)
print(f'Normalized SEO and social cards across {len(paths)} public pages.')
