/* Shared feedback, respecting both OS and site motion preferences. */
(() => {
 'use strict';
 const root=document.documentElement, reduced=matchMedia('(prefers-reduced-motion: reduce)');
 // Decorative motion defaults on for each page; OS reduced motion always takes precedence.
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
 const surfaceScope=document.body.classList.contains('portfolio-site')?document:document.querySelector('.expedition-dock');
 surfaceScope?.querySelectorAll(surfaces).forEach(el=>{
  if(getComputedStyle(el).position==='static') el.classList.add('interaction-static');
  el.classList.add('interactive-surface');
 });
 document.addEventListener('click',event=>{
  const target=event.target.closest('button:not(:disabled),a[href],[role="button"]');
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
  const sheet=document.createElement('div'); sheet.className='scroll-sheet';
  while(summary.nextSibling) sheet.append(summary.nextSibling);
  content.append(sheet);
  details.append(content);
  let effect=null,desired=details.open;
  const clear=()=>{content.style.height='';content.style.overflow='';content.inert=false;};
  const settle=()=>{
   if(!effect)return;
   effect.onfinish=null;effect.cancel();effect=null;details.open=desired;clear();
  };
  disclosures.push(settle);
  details.addEventListener('voyage-reset',()=>{desired=false;settle();details.open=false;clear();});
  summary.addEventListener('click',event=>{
   if(still()) return;
   event.preventDefault();
   desired=effect?!desired:!details.open;
   const start=details.open?content.getBoundingClientRect().height:0;
   if(effect){effect.onfinish=null;effect.cancel();effect=null;}
   // Measure only the body; never toggle the native disclosure closed to measure it.
   // This avoids scroll-anchor jumps and prevents summaries from shrinking under a tap.
   details.open=true; content.style.height='auto';
   const end=desired?content.getBoundingClientRect().height:0;
   content.inert=!desired;content.style.overflow='clip';
   effect=play(content,[{height:`${start}px`,opacity:desired?.6:1,clipPath:'inset(0)'},{height:`${end}px`,opacity:desired?1:.3,clipPath:desired?'inset(0)':'inset(0 0 8% 0)'}],{duration:320,easing:'cubic-bezier(.2,.8,.2,1)'});
   effect.onfinish=()=>{effect=null;details.open=desired;clear();};
  });
 });
 const stopMotion=()=>{
  if(!still()) return;
  disclosures.forEach(settle=>settle());
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
