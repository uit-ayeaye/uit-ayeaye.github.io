#!/usr/bin/env python3
"""Public, source-informed interface illustrations. ALL names and numbers are synthetic.
Layouts reviewed: admin/kpi/index.vue, admin/program-analytics/index.vue,
lecturer/kpi-overview.vue and layouts/admin.vue in som_Node. No data services used.
"""
from pathlib import Path
from html import escape
OUT = Path(__file__).resolve().parents[1] / 'images/projects'

def build(mode):
    parts=['<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1000" viewBox="0 0 1440 1000"><defs><linearGradient id="nav" x2=".3" y2="1"><stop stop-color="#18345c"/><stop offset="1" stop-color="#137b97"/></linearGradient></defs><rect width="1440" height="1000" fill="#f3f6fa"/>']
    def rect(x,y,w,h,c='#fff',r=12):parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{c}"/>')
    def text(x,y,s,size=18,color='#243d57',weight=400):parts.append(f'<text x="{x}" y="{y}" fill="{color}" font-family="Arial,sans-serif" font-size="{size}" font-weight="{weight}">{escape(str(s))}</text>')
    def line(x,y,w):rect(x,y,w,1,'#e5eaf0',0)
    def bar(x,y,w,value,color='#2680b7'):rect(x,y,w,10,'#e6edf4',5);rect(x,y,w*value/100,10,color,5)
    rect(0,0,250,1000,'url(#nav)',0);text(30,67,'SoM.BI',36,'white',700);text(30,96,'School of Management',15,'#bcdce8');text(30,170,'WORKSPACE',12,'#8db6cf',700)
    names=['Performance Analytics','Program Analytics','Lecturer Directory'] if mode!='lecturer' else ['KPI Overview','Teaching Performance','Research Performance','Academic Service','Arts & Culture']
    for i,n in enumerate(names):
        y=207+i*57
        if i==(1 if mode=='programs' else 0):rect(16,y-29,218,44,'#ffffff24',7)
        text(30,y,'▧',19,'#9bddf1');text(57,y,n,16,'#ffffff')
    text(30,908,'PORTFOLIO PREVIEW',12,'#bde9ed',700);text(30,935,'Synthetic sample data',15,'#fff');text(30,961,'No university records',13,'#c2e6ef')
    rect(250,0,1190,78);text(288,47,'School of Management / Business Intelligence',17);text(1188,47,'Demo workspace',16,'#64748b')
    title={'overview':'Performance Analytics','programs':'Program Analytics','lecturer':'My KPI Overview'}[mode]
    text(289,133,title,31,weight=700);text(289,165,{'overview':'Track-aware academic performance and evaluation insights','programs':'KPI performance breakdown by academic program','lecturer':'A personal view of academic contributions and activity'}[mode],17,'#748194');rect(1190,108,205,44,'#e0edf7',7);text(1211,136,'Round 1 · Demo',17,'#004086',600)
    if mode=='overview':
        rect(286,195,1117,95,'#1e3a5f');text(310,235,'Performance Analytics Overview',24,'white',700);text(310,264,'24 sample lecturers · 4 tracks',16,'#c2d9ef')
        for i,(v,label,c) in enumerate([('78.4%','Avg Total','#e6f0ff'),('76.0%','Academic (60%)','#e3f5ef'),('82.0%','Behavior (40%)','#eee8fa')]):
            x=286+i*378;rect(x,308,360,119,c);text(x+24,362,v,36,weight=700);text(x+24,397,label,17)
        for x,title2 in [(286,'Track Distribution'),(854,'Performance Levels')]:
            rect(x,447,549,235);text(x+24,482,title2,21,weight=700)
            parts.append(f'<circle cx="{x+114}" cy="577" r="63" fill="none" stroke="#e7edf4" stroke-width="27"/><circle cx="{x+114}" cy="577" r="63" fill="none" stroke="#258bad" stroke-width="27" stroke-dasharray="270 400" transform="rotate(-90 {x+114} 577)"/>')
            text(x+91,586,'24',29,weight=700)
            for j,n in enumerate((['Teaching','Research','Academic service','Administration'] if x==286 else ['Excellent','Very good','Good','Developing'])):
                rect(x+220,516+j*34,10,10,['#258bad','#5db7cb','#92d5cf','#c2e7df'][j],3);text(x+243,528+j*34,n,16)
        rect(286,704,1117,225);text(309,744,'Lecturer performance',21,weight=700)
        for j,row in enumerate([['LECTURER','TRACK','TOTAL','ACADEMIC','BEHAVIOR'],['Sample lecturer A','Teaching','84.2%','82.0%','87.5%'],['Sample lecturer B','Research','78.4%','76.0%','82.0%'],['Sample lecturer C','Academic service','72.6%','70.0%','76.5%']]):
            y=783+j*39
            for x,s in zip([311,636,924,1065,1231],row):text(x,y,s,14 if j==0 else 16,'#708197' if j==0 else '#2a455f',600 if j==0 else 400)
            line(309,y+13,1068)
    elif mode=='programs':
        for i,(v,l) in enumerate([('4','Programs'),('24','Lecturers with KPI'),('78.4%','Overall Avg Score'),('Program A','Top Program')]):
            x=286+i*284;rect(x,205,266,116);text(x+23,259,v,31,'#004086',700);text(x+23,293,l,16,'#738197')
        for i,n in enumerate(['Program A','Program B','Program C','Program D']):
            x=286+(i%2)*568;y=346+(i//2)*284;rect(x,y,549,262);rect(x+22,y+22,49,49,'#e7f1fb');text(x+38,y+54,'▥',27,'#004086');text(x+87,y+47,n,23,weight=700);text(x+87,y+74,'6 sample lecturers',15,'#78899b')
            for j,(v,l) in enumerate([(84-i*4,'Total'),(82-i*4,'Academic'),(87-i*4,'Behavior')]):
                text(x+26+j*170,y+131,f'{v}.0%',28,'#176d97',700);text(x+26+j*170,y+158,l,15,'#728499')
            bar(x+25,y+181,498,84-i*4);rect(x+23,y+207,503,36,'#eef4fa',6);text(x+193,y+231,'View program →',15,'#004086',600)
    else:
        for i,(v,l) in enumerate([('81.8%','Overall Performance'),('80.0%','Academic'),('84.5%','Behavior')]):
            x=286+i*378;rect(x,205,360,132);text(x+25,265,v,38,'#176d97',700);text(x+25,307,l,18)
        rect(286,359,670,347);text(311,401,'Domain Score Distribution',23,weight=700)
        for j,(n,v) in enumerate([('Teaching',86),('Research',72),('Academic service',81),('Administration',77),('Arts & culture',90)]):
            y=444+j*49;text(311,y,n,17);bar(507,y-12,358,v);text(885,y,f'{v}%',15)
        rect(979,359,424,347);text(1003,401,'Activity Summary',23,weight=700)
        for j,(n,v) in enumerate([('Teaching',12),('Research',4),('Academic service',7)]):
            y=459+j*82;rect(1002,y-31,375,64,'#edf5fb');text(1020,y+6,n,18);text(1327,y+6,v,25,'#176d97',700)
        rect(286,729,1117,200);text(310,772,'Detailed Performance Breakdown',24,weight=700)
        for j,n in enumerate(['Domain 1: Teaching Performance','Domain 2: Research Performance']):
            y=793+j*58;rect(310,y,1068,44,'#e5f0f7',6);text(331,y+29,n,18);text(1335,y+29,'+',22)
    rect(250,952,1190,48,'#e2eaf2',0);text(286,982,'INTERFACE RECREATION · SAMPLE DATA · Based on the SOM BI application layouts',16,'#3a5771',600)
    parts.append('</svg>');(OUT/f'som-bi-{mode}.svg').write_text(''.join(parts))
for mode in ['overview','programs','lecturer']:build(mode)
print('Built 3 SOM BI interface previews with synthetic sample data.')
