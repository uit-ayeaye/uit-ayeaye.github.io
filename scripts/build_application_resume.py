from pathlib import Path
from html import escape
import json
from email.message import EmailMessage
from email import policy
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, PageBreak, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4

out=Path(__file__).resolve().parents[1]/'resume'
ink=HexColor('#182e3c'); teal=HexColor('#116a70')
styles={
 'body':ParagraphStyle('body',fontName='Helvetica',fontSize=10,leading=13.7,textColor=ink,spaceAfter=5),
 'small':ParagraphStyle('small',fontName='Helvetica',fontSize=9,leading=12,textColor=ink,spaceAfter=4),
 'title':ParagraphStyle('title',fontName='Helvetica-Bold',fontSize=25,leading=29,textColor=ink,spaceAfter=4),
 'subtitle':ParagraphStyle('subtitle',fontName='Helvetica',fontSize=11.5,leading=16,textColor=teal,spaceAfter=6),
 'heading':ParagraphStyle('heading',fontName='Helvetica-Bold',fontSize=10.5,leading=14,textColor=teal,spaceBefore=10,spaceAfter=6),
 'project':ParagraphStyle('project',fontName='Helvetica-Bold',fontSize=10.5,leading=14,textColor=ink,spaceAfter=3),
}
flow=[]
def p(text,style='body'):flow.append(Paragraph(text,styles[style]))
def h(text):p(text,'heading')
def link(label,url):return '<link href="'+escape(url,quote=True)+'" color="#116a70"><u>'+escape(label)+'</u></link>'
def project(title,body,links):
 flow.append(KeepTogether([Paragraph(title,styles['project']),Paragraph(body+' '+links,styles['body'])]))
def footer(c,d):
 c.setStrokeColor(HexColor('#c7d9dd'));c.line(42,32,A4[0]-42,32)
 c.setFont('Helvetica',8);c.setFillColor(ink)
 c.drawString(42,20,'THIHA LIN  |  SOFTWARE ENGINEERING')
 c.drawRightString(A4[0]-42,20,str(d.page))
p('THIHA LIN','title')
p('Software Engineer · Full-stack Platforms · Mobile &amp; Applied AI','subtitle')
p('Chiang Rai, Thailand · +66 62 003 3365 · 6631503092@lamduan.mfu.ac.th','small')
p(link('thomasdlynn.dev','https://thomasdlynn.dev')+'  ·  '+link('github.com/Thiha-Lynn','https://github.com/Thiha-Lynn')+'  ·  '+link('LinkedIn','https://www.linkedin.com/in/thiha-lin-0152b6345/'),'small')
flow.append(HRFlowable(width='100%',thickness=.8,color=teal,spaceBefore=4,spaceAfter=8))
p('Software engineering student and founder of Backbenchers Studio, delivering client platforms across Thailand, Myanmar and Singapore. Connect business requirements, web and mobile interfaces, APIs and operations. Experience spans logistics, commerce, multiplayer games, AI-assisted editorial workflows and open-source tools.')
h('TECHNICAL SKILLS')
p('<b>Web &amp; backend</b>  TypeScript, JavaScript, PHP, Python; React/Next.js, Vue/Nuxt, Node.js/Express, Laravel/Filament; REST APIs and role-based access.','small')
p('<b>Mobile &amp; games</b>  Flutter/Dart, Java/Android, Swift/UIKit integration with AI-assisted porting; Unity, C#, Photon; C++ fundamentals and memory management.','small')
p('<b>Data &amp; reliability</b>  MySQL, PostgreSQL, SQLite/Cloudflare D1, Redis; relational models, transactions, idempotency, caching, retries and regression checks.','small')
p('<b>Cloud &amp; delivery</b>  AWS Lightsail, Linux, Nginx, Git/GitHub, Cloudflare Workers; service deployment, TLS, release documentation and app-store review coordination.','small')
p('<b>AI, vision &amp; tools</b>  Gemini/DeepSeek APIs, keyword-based RAG, prompt design, output checks; OpenCV, camera pipelines, RTX inference; FFmpeg/HLS, Python font tooling, PWA/Electron/Capacitor.','small')
p('<b>Interactive &amp; embedded</b>  Three.js, React Three Fiber, GSAP, WebGL; Raspberry Pi, Arduino/ESP32 and IoT module familiarity; introductory ROS exposure.','small')
h('EXPERIENCE')
p('Backbenchers Studio | Founder &amp; Software Engineer','project')
p('Lead independent client delivery from requirements and solution design through implementation and maintenance. Coordinate with clients, developers and designers on scope, handovers, developer-account administration and release preparation.')
project('Golden Gate GGT | Logistics platform · Thailand',
'Implemented the public website, shipment API, Laravel workspaces and Flutter staff, customer and courier apps. QR parcel labels, manifests, branch handovers and delivery evidence provide traceable parcel histories. Added role-specific workflows, partial receipts and exception handling.',
link('Platform','https://goldengateggt.com'))
project('BurmaMart | Marketplace for MSCT PTE. LTD. · Singapore',
'Built the storefront, Laravel/MySQL backend, Filament administration and Flutter buyer/merchant apps. Shared APIs connect catalogs, carts, orders and conversations, with multi-currency checkout and country-aware fulfillment.',
link('Marketplace','https://burmamart.com'))
project('Welmal | Commerce platform · Myanmar',
'Implemented shared Laravel APIs, storefront and administration, with native Java Android and AI-assisted Swift/UIKit integration. Connected catalog and order workflows through Sanctum authentication and multilingual interfaces.',
link('Project site','https://welmal.com'))
project('Shoot and Support / End Game Union | Founder, Unity &amp; Backend Developer',
'Led project planning and contributed with fellow developers to the mobile game and mini-games, including backend work and AdMob policy handling. Unity/C#/Photon experience spans the game and its supporting ecosystem. DVB reported No. 1 on the local Google Play chart in July 2022.',
link('Game & status','https://endgameunion.com')+' · '+link('DVB report','https://burmese.dvb.no/post/545683'))

flow.append(PageBreak())
p('PROJECTS, EDUCATION & CREDENTIALS','subtitle')
project('JSeekers | Recruitment and job-discovery platform',
'Built a React/TypeScript application integrating Greenhouse, Lever and SmartRecruiters feeds. Implemented pagination, bounded concurrency, timeouts and retries, with SQL persistence in Cloudflare D1. Deduplicate roles, show source freshness and retain earlier records after failed collection. Automated checks cover search, classification, persistence and Telegram workflows.',
link('Live application','https://jseekers-sea.borutomaster.chatgpt.site'))
project('Actually We ARe MAd | Creator and media platform',
'Implemented the Next.js/Prisma/PostgreSQL platform, media administration and FFmpeg adaptive HLS processing. Connected creator discovery, mobile surfaces and Telegram approval workflows around community-produced content.',
link('Creator platform','https://actuallywearemad.com'))
project('Myo Taw News | AI-assisted publishing',
'Built Laravel/Filament editorial workflows with Gemini and DeepSeek translation, parallel language requests, glossary prompts, output checks and token accounting. Implemented reply drafting using keyword-retrieved knowledge and article context with editor review.',
link('Publishing platform','https://myotaw.com'))
project('SOM BI &amp; Campus One | Institutional applications',
'Contributed implementation, integration and deployment to the Vanguard team’s SOM BI project using Nuxt/Vue, Express, MySQL and Firebase Auth. Separately built Campus One with registration rules, waitlists and role-specific services using React, TypeScript, Node.js and PostgreSQL/PGlite. Its public demo uses synthetic records.',
link('Campus demo','https://campus.ztvmm.live/')+' · '+link('Portfolio','https://thomasdlynn.dev'))
project('Computer vision &amp; distributed inference | Technical projects',
'Built OpenCV marker tracking on Raspberry Pi and tested target loss and reacquisition. Developed video object tracking, camera dashboards and queued inference with separate AWS API/worker hosts and an RTX 3090 worker. Tested authenticated TLS camera streams and service restart recovery.',
link('Demo · reviewer login','https://cv.mlbbshop.app'))
project('Myanmar Glyph Studio | Open-source font tooling',
'Built mobile-friendly tracing, path and anchor editing, browser TTF export and a Python/UFO/fontmake pipeline. Explored OpenType Myanmar shaping and mark placement.',
link('Live tool','https://thiha-lynn.github.io/myanmar-glyph-studio/')+' · '+link('Source','https://github.com/Thiha-Lynn/myanmar-glyph-studio'))
p('<b>Additional work</b>  UniLab local PDF/OCR/media utilities with Electron/Capacitor packaging; Chinese Studio offline learning and progress backups; BackBenchers Academy textbook indexing and 3D/2D PWA; STRIKERS cached sports-data integration; interactive Three.js/WebGL environments. '+link('Full project portfolio','https://thomasdlynn.dev'),'small')
h('EDUCATION')
p('<b>Mae Fah Luang University, Thailand</b> · 2023–present<br/>B.Eng. Software Engineering, School of Applied Digital Technology. Year 4.<br/>GPAX 3.53 through academic year 2025 · Expected graduation June 2027.','small')
p('<b>University of Information Technology (UiT), Yangon</b> · 2019–2021<br/>Earlier programming studies, including C++ and memory management.','small')
h('CERTIFICATIONS & LANGUAGES')
p('Red Team Leaders · October 2026<br/>'+link('Certified Mobile Android PenTest Junior','https://courses.redteamleaders.com/exam-completion/db0f595b0b1ecc2f')+' · '+link('Certified LLM Security Professional','https://courses.redteamleaders.com/exam-completion/fa4da20a5a531f0a')+' · '+link('Certified LLM Security Expert','https://courses.redteamleaders.com/exam-completion/72e6466337b5cf0f'),'small')
p('Security learning includes prompt injection, OWASP LLM risks, threat modeling and tool permissions. Languages: Burmese (native), English (self-reported C1), Thai (conversational).','small')
p('<b>MFU co-op period</b>  4 January–30 May 2027 · Duration and final availability to be agreed.','small')
pdf=out/'thomas-d-lynn-resume.pdf'
SimpleDocTemplate(str(pdf),pagesize=A4,leftMargin=42,rightMargin=42,topMargin=34,bottomMargin=43,title='Thiha Lin — Software Engineer',author='Thiha Lin').build(flow,onFirstPage=footer,onLaterPages=footer)

