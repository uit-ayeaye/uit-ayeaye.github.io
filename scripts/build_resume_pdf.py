#!/usr/bin/env python3
"""Build illustrated and plain-text-friendly PDFs from the same complete résumé."""
from pathlib import Path
from html import escape
from hashlib import sha256
import random
from bs4 import BeautifulSoup
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether, CondPageBreak
ROOT=Path(__file__).resolve().parents[1]
paper=BeautifulSoup((ROOT/'resume/index.html').read_text(),'html.parser').select_one('.resume-paper')
for name,file in [('Kalam','Kalam-Regular.ttf'),('Kalam-Bold','Kalam-Bold.ttf'),('Pirata','PirataOne-Regular.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(ROOT/'images/fonts'/file)))
pdfmetrics.registerFontFamily('Kalam',normal='Kalam',bold='Kalam-Bold',italic='Kalam',boldItalic='Kalam-Bold')
def text(element):
    return escape(element.get_text(' ',strip=True)).replace('↗','').replace('—','-').replace('–','-').replace('’',"'")
def rich(element):
    value=text(element)
    # Preserve the emphasis and all content of ordinary skill-list items.
    if element.name=='li' and element.strong:
        strong=text(element.strong);value=value.replace(strong,'<b>'+strong+'</b>',1)
    return value
texture=ImageReader(str(ROOT/'images/resume/weathered-paper.webp'))
portrait=ImageReader(str(ROOT/'images/captain/thomas-captain-v2.webp'))
def background(canvas,doc):
    w,h=A4;canvas.saveState()
    canvas.setFillColor(colors.HexColor('#101d27'));canvas.rect(0,0,w,h,fill=1,stroke=0)
    rng=random.Random(97+doc.page)
    path=canvas.beginPath();path.moveTo(12,15)
    for x in range(12,int(w)-12,13):path.lineTo(x,15+rng.uniform(-3,3))
    for y in range(15,int(h)-15,15):path.lineTo(w-12+rng.uniform(-2.5,2.5),y)
    for x in range(int(w)-12,11,-13):path.lineTo(x,h-15+rng.uniform(-3,3))
    for y in range(int(h)-15,14,-15):path.lineTo(12+rng.uniform(-2.5,2.5),y)
    path.close();canvas.clipPath(path,stroke=0)
    canvas.drawImage(texture,9,10,width=w-18,height=h-20)
    canvas.setStrokeColor(colors.HexColor('#a4895d'));canvas.setLineWidth(.4)
    canvas.rect(24,27,w-48,h-54,fill=0,stroke=1)
    canvas.setFillColor(colors.HexColor('#735235'));canvas.setFont('Helvetica',7)
    canvas.drawString(53,h-49,'BACKBENCHERS STUDIO / THE COMPLETE LOGBOOK')
    canvas.drawRightString(w-53,42,f'THOMAS D. LYNN  /  {doc.page:02}')
    canvas.drawString(53,42,'thomasdlynn.dev')
    if doc.page==1:canvas.drawImage(portrait,w-144,h-205,width=83,height=112,mask='auto',preserveAspectRatio=True)
    canvas.restoreState()
def plain_footer(canvas,doc):
    canvas.saveState();canvas.setFont('Helvetica',8);canvas.setFillColor(colors.HexColor('#555555'))
    canvas.drawString(16*mm,10*mm,'Thomas D. Lynn | thomasdlynn.dev');canvas.drawRightString(A4[0]-16*mm,10*mm,str(doc.page));canvas.restoreState()
def build(artful=False):
    body='Kalam' if artful else 'Helvetica';bold='Kalam-Bold' if artful else 'Helvetica-Bold';ink=colors.HexColor('#3b2819') if artful else colors.black
    styles={
      'name':ParagraphStyle('Name',fontName='Pirata' if artful else bold,fontSize=35 if artful else 25,leading=40 if artful else 29,spaceAfter=10,textColor=ink),
      'role':ParagraphStyle('Role',fontName=bold,fontSize=12 if artful else 11,leading=17,spaceAfter=4,textColor=ink),
      'meta':ParagraphStyle('Meta',fontName=body,fontSize=10 if artful else 9,leading=13.5,spaceAfter=5,textColor=ink),
      'note':ParagraphStyle('Note',fontName=body,fontSize=10 if artful else 9,leading=13.5,spaceAfter=5,keepWithNext=True,textColor=ink),
      'body':ParagraphStyle('Body',fontName=body,fontSize=12 if artful else 10,leading=16.3 if artful else 14,spaceAfter=7,textColor=ink),
      'section':ParagraphStyle('Section',fontName='Pirata' if artful else bold,fontSize=23 if artful else 13,leading=27 if artful else 17,spaceBefore=17,spaceAfter=9,keepWithNext=True,textColor=colors.HexColor('#713b27') if artful else ink),
      'entry':ParagraphStyle('Entry',fontName=bold,fontSize=14 if artful else 11,leading=18 if artful else 15,spaceAfter=4,keepWithNext=True,textColor=ink),
      'stack':ParagraphStyle('Stack',fontName='Helvetica',fontSize=8,leading=11,spaceAfter=10,textColor=colors.HexColor('#624b30') if artful else colors.HexColor('#444444')),
    }
    def paragraph(el,style='body'):return Paragraph(rich(el),styles[style])
    story=[paragraph(paper.select_one('h1'),'name'),paragraph(paper.select_one('.resume-role'),'role'),paragraph(paper.select_one('.resume-alias'),'meta')]
    for a in paper.select('.resume-contact a'):story.append(paragraph(a,'meta'))
    if artful:story.append(Spacer(1,9))
    for section in paper.select('.resume-section'):
        if section.get('id')=='resume-ledger':story.append(CondPageBreak(185))
        story.append(Paragraph(text(section.h2),styles['section']))
        for child in section.find_all(recursive=False):
            if child.name=='h2':continue
            if child.name=='article':
                heading=child.select_one('.resume-entry-heading')
                row=[paragraph(heading.h3,'entry'),paragraph(heading.span,'meta')]
                for p in child.find_all('p',recursive=False):row.append(paragraph(p,'stack' if 'resume-stack' in p.get('class',[]) else 'body'))
                story.append(KeepTogether(row))
            elif child.name=='ul':
                for li in child.find_all('li',recursive=False):story.append(paragraph(li))
            elif child.name=='h3':story.append(paragraph(child,'entry'))
            elif child.name=='p':
                if 'resume-signature' in child.get('class',[]) and not artful:continue
                story.append(paragraph(child,'stack' if 'resume-stack' in child.get('class',[]) else 'note' if 'resume-section-note' in child.get('class',[]) else 'body'))
    dest=ROOT/'resume'/('thomas-d-lynn-logbook.pdf' if artful else 'thomas-d-lynn-resume.pdf')
    doc=SimpleDocTemplate(str(dest),pagesize=A4,leftMargin=20*mm if artful else 16*mm,rightMargin=20*mm if artful else 16*mm,topMargin=25*mm if artful else 17*mm,bottomMargin=23*mm if artful else 18*mm,title='Thomas D. Lynn - '+('Complete Illustrated Logbook' if artful else 'Software Engineer Resume'),author='Thomas D. Lynn',subject='Software engineering, creative development, and 33 documented projects',pageCompression=1)
    callback=background if artful else plain_footer
    doc.build(story,onFirstPage=callback,onLaterPages=callback)
    print('Built',dest.relative_to(ROOT))
build(False);build(True)
(ROOT/'resume/pdf-source.sha256').write_text(sha256((ROOT/'templates/resume.html').read_bytes()).hexdigest()+'\n')
