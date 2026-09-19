#!/usr/bin/env python3
"""Encode timestamped CUA browser screencasts; no browser automation here."""
from pathlib import Path
import json,subprocess
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'videos/previews';OUT.mkdir(parents=True,exist_ok=True)
for manifest in sorted((ROOT/'output/recordings').glob('*/frames.json')):
    slug=manifest.parent.name; target=OUT/(slug+'.mp4')
    if target.exists() and target.stat().st_mtime>manifest.stat().st_mtime: continue
    frames=json.loads(manifest.read_text())
    if len(frames)<2: print('SKIP insufficient frames:',slug);continue
    lines=[]
    for i,f in enumerate(frames):
        lines.append("file '"+str(manifest.parent/f['file'])+"'")
        duration=max(.016,min(2,frames[i+1]['time']-f['time'])) if i+1<len(frames) else .3
        lines.append(f'duration {duration:.5f}')
    concat=manifest.parent/'concat.txt';concat.write_text('\n'.join(lines))
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),'-vf','scale=960:600:force_original_aspect_ratio=decrease,pad=960:600:(ow-iw)/2:(oh-ih)/2:color=0x0b1522,fps=24,format=yuv420p','-c:v','libx264','-preset','slow','-crf','29','-an','-movflags','+faststart',str(target)],check=True)
    print(slug,len(frames),round(target.stat().st_size/1024),'KB')
