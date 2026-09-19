#!/usr/bin/env python3
"""Build a selectable-text application résumé from the same HTML source.

Requires reportlab and beautifulsoup4. Run after build_portfolio.py when
editing templates/resume.html or the project count.
"""
from pathlib import Path
from html import escape
from hashlib import sha256
from bs4 import BeautifulSoup
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'resume/index.html'
DEST = ROOT / 'resume/thomas-d-lynn-resume.pdf'
paper = BeautifulSoup(SOURCE.read_text(), 'html.parser').select_one('.resume-paper')
styles = {
    'name': ParagraphStyle('Name', fontName='Helvetica-Bold', fontSize=24, leading=27, spaceAfter=5),
    'role': ParagraphStyle('Role', fontName='Helvetica-Bold', fontSize=10, leading=13, spaceAfter=3),
    'meta': ParagraphStyle('Meta', fontName='Helvetica', fontSize=8.5, leading=11, textColor=colors.HexColor('#333333'), spaceAfter=3),
    'body': ParagraphStyle('Body', fontName='Helvetica', fontSize=9.3, leading=12.2, spaceAfter=2),
    'section': ParagraphStyle('Section', fontName='Helvetica-Bold', fontSize=10, leading=13, spaceBefore=8, spaceAfter=4, keepWithNext=True),
    'entry': ParagraphStyle('Entry', fontName='Helvetica-Bold', fontSize=9.5, leading=12.5, spaceAfter=3, keepWithNext=True),
    'stack': ParagraphStyle('Stack', fontName='Helvetica', fontSize=8.2, leading=10.5, textColor=colors.HexColor('#333333'), spaceAfter=3),
}

def plain(element):
    return escape(element.get_text(' ', strip=True)).replace('↗', '').replace('—', '-').replace('–', '-')

def para(element, style='body'):
    return Paragraph(plain(element), styles[style])

story = [para(paper.select_one('h1'), 'name'), para(paper.select_one('.resume-role'), 'role'), para(paper.select_one('.resume-alias'), 'meta')]
contacts = ' | '.join(plain(a) for a in paper.select('.resume-contact a'))
story += [Paragraph(contacts, styles['meta'])]
for section in paper.select('.resume-section'):
    story.append(Paragraph(plain(section.h2).upper(), styles['section']))
    for child in section.find_all(recursive=False):
        if child.name == 'h2':
            continue
        if child.name == 'article':
            heading = child.select_one('.resume-entry-heading')
            title = plain(heading.h3)
            label = plain(heading.span)
            row = [Paragraph(title + ' <font name="Helvetica" size="8.5"> | ' + label + '</font>', styles['entry'])]
            for p in child.find_all('p', recursive=False):
                row.append(para(p, 'stack' if 'resume-stack' in p.get('class', []) else 'body'))
            story.append(KeepTogether(row))
        elif child.name == 'ul':
            for li in child.find_all('li', recursive=False):
                story.append(para(li))
        elif child.name == 'h3':
            story.append(para(child, 'entry'))
        elif child.name == 'p':
            style = 'stack' if 'resume-stack' in child.get('class', []) else 'meta' if 'resume-section-note' in child.get('class', []) else 'body'
            story.append(para(child, style))
story += [Spacer(1, 2), Paragraph('Project-based résumé · September 2026 · thomasdlynn.dev', styles['meta'])]
doc = SimpleDocTemplate(str(DEST), pagesize=A4, leftMargin=16*mm, rightMargin=16*mm, topMargin=13*mm, bottomMargin=13*mm, title='Thomas D. Lynn - Software Engineer Resume', author='Thomas D. Lynn', subject='Software engineering project experience', pageCompression=1)
doc.build(story)
(ROOT / 'resume/pdf-source.sha256').write_text(sha256((ROOT / 'templates/resume.html').read_bytes()).hexdigest() + '\n')
print(f'Built {DEST.relative_to(ROOT)} from the canonical résumé.')
