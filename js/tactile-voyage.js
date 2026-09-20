/* Shared feedback, respecting both OS and site motion preferences. */
(() => {
 'use strict';
 const root=document.documentElement, reduced=matchMedia('(prefers-reduced-motion: reduce)');
 try { if(localStorage.getItem('bb-motion')==='paused') root.classList.add('motion-paused'); } catch (_) { /* Storage is optional. */ }
 const still=()=>reduced.matches||root.classList.contains('motion-paused');
 const animations=new WeakMap();
 window.voyagePop=element=>{
  if(!element||still()) return;
  animations.get(element)?.cancel();
  const animation=play(element,[
   {opacity:.25,scale:'.86',translate:'0 23px',rotate:'-2deg'},
   {opacity:1,scale:'1.035',translate:'0 -7px',rotate:'1deg',offset:.6},
   {opacity:1,scale:'.99',translate:'0 2px',rotate:'-.3deg',offset:.82},
   {opacity:1,scale:'1',translate:'0 0',rotate:'0deg'}
  ],{duration:580,easing:'cubic-bezier(.18,.75,.25,1)'});
  animations.set(element,animation);
 };
 // Central animation registry lets a preference change stop in-flight effects too.
 const active=new Set();
 const play=(element,frames,options)=>{
  if(!element||still()) return;
  const effect=element.animate(frames,options);
  active.add(effect);
  const clean=()=>active.delete(effect);
  effect.addEventListener('finish',clean,{once:true});
  effect.addEventListener('cancel',clean,{once:true});
  return effect;
 };
 window.voyageReveal=element=>{
  if(!element||still()) return;
  const items=element.querySelectorAll('.world-copy>.eyebrow,.world-copy>h3,.world-copy>p:not(.eyebrow),.world-actions');
  items.forEach((item,index)=>{
   animations.get(item)?.cancel();
   animations.set(item,play(item,[{opacity:0,translate:'0 14px'},{opacity:1,translate:'0 0'}],{duration:420,delay:index*45,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}));
  });
 };
 const surfaces='button:not(:disabled),a.button,.tech-chip,.floating-waypoint';
 // Independent WebGL experiences own their control positioning. Enhance their dock only.
 const surfaceScope=document.querySelector('link[href^="/css/midnight-studio.css"]')?document:document.querySelector('.expedition-dock');
 surfaceScope?.querySelectorAll(surfaces).forEach(el=>{
  if(getComputedStyle(el).position==='static') el.classList.add('interaction-static');
  el.classList.add('interactive-surface');
 });
 document.addEventListener('click',event=>{
  const target=event.target.closest('button:not(:disabled),a[href],summary,[role="button"]');
  if(!target||still()||event.defaultPrevented&&target.closest('.is-dragging')) return;
  animations.get(target)?.cancel();
  animations.set(target,play(target,[
   {scale:'.96'},{scale:'1.025',offset:.6},{scale:'1'}
  ],{duration:310,easing:'cubic-bezier(.2,.8,.25,1)'}));
  if(!target.classList.contains('interactive-surface')) return;
  const box=target.getBoundingClientRect(),bloom=document.createElement('span');
  bloom.className='tap-bloom'; bloom.setAttribute('aria-hidden','true');
  bloom.style.left=`${event.detail?event.clientX-box.left:box.width/2}px`;
  bloom.style.top=`${event.detail?event.clientY-box.top:box.height/2}px`;
  target.append(bloom);
  const effect=play(bloom,[{scale:'.1',opacity:1},{scale:'2',opacity:0}],{duration:540,easing:'ease-out'});
  const remove=()=>bloom.remove();
  effect?.addEventListener('finish',remove,{once:true});
  effect?.addEventListener('cancel',remove,{once:true});
 });
 // Native details semantics, enhanced with interruptible open AND close motion.
 const disclosures=[];
 document.querySelectorAll('.skill,.personal-disclosure,.world-caption,.captain-memory,.preview-context').forEach(details=>{
  const summary=details.querySelector(':scope>summary');
  if(!summary) return;
  const content=document.createElement('div'); content.className='motion-disclosure';
  while(summary.nextSibling) content.append(summary.nextSibling);
  details.append(content);
  let effect=null,desired=details.open;
  const settle=()=>{
   if(!effect) return;
   effect.cancel(); effect=null; details.open=desired;
   details.style.height=''; details.style.overflow=''; content.inert=false;
  };
  disclosures.push(settle);
  summary.addEventListener('click',event=>{
   if(still()) return; // Native disclosure remains the reduced-motion fallback.
   event.preventDefault();
   desired=effect?!desired:!details.open;
   const start=details.getBoundingClientRect().height;
   effect?.cancel(); details.style.height='';
   details.open=desired;
   const end=details.getBoundingClientRect().height;
   details.open=true; content.inert=!desired;
   details.style.overflow='hidden';
   effect=play(details,[{height:`${start}px`},{height:`${end}px`}],{duration:340,easing:'cubic-bezier(.22,1,.36,1)'});
   effect.onfinish=()=>{effect=null;details.open=desired;details.style.height='';details.style.overflow='';content.inert=false;};
   if(desired) {
    play(content,[{opacity:.25,translate:'0 8px'},{opacity:1,translate:'0 0'}],{duration:350,easing:'ease-out'});
    content.querySelectorAll('.tech-chip').forEach((chip,i)=>play(chip,[{opacity:0,translate:'0 10px'},{opacity:1,translate:'0 0'}],{duration:280,delay:45+i*30,fill:'backwards',easing:'ease-out'}));
   }
  });
 });
 const stopMotion=()=>{
  if(!still()) return;
  disclosures.forEach(settle);
  active.forEach(effect=>effect.cancel());
  document.querySelectorAll('.tap-bloom').forEach(el=>el.remove());
 };
 new MutationObserver(stopMotion).observe(root,{attributes:true,attributeFilter:['class']});
 reduced.addEventListener('change',stopMotion);
 // Native touch scrolling; mouse drag adds the same affordance on a laptop.
 document.querySelectorAll('.world-tabs,.personal-track').forEach(rail=>{
  let drag=null, suppress=false;
  rail.addEventListener('dragstart',event=>event.preventDefault());
  rail.addEventListener('pointerdown',event=>{
   if(event.pointerType!=='mouse'||event.button!==0) return;
   suppress=false; drag={x:event.clientX,left:rail.scrollLeft,id:event.pointerId,moved:false};
  });
  rail.addEventListener('pointermove',event=>{
   if(!drag) return;
   const dx=event.clientX-drag.x;
   if(Math.abs(dx)>6&&!drag.moved){drag.moved=true;rail.setPointerCapture(event.pointerId);rail.classList.add('is-dragging');}
   if(drag.moved){event.preventDefault();rail.scrollLeft=drag.left-dx;}
  });
  const finish=()=>{if(!drag)return;suppress=drag.moved;drag=null;rail.classList.remove('is-dragging');};
  rail.addEventListener('pointerup',finish);rail.addEventListener('pointercancel',finish);
  rail.addEventListener('lostpointercapture',finish);
  rail.addEventListener('pointerleave',()=>{if(drag&&!drag.moved)finish();});
  rail.addEventListener('click',event=>{if(suppress){event.preventDefault();event.stopImmediatePropagation();suppress=false;}},true);
 });
})();
