/* Shared feedback, respecting both OS and site motion preferences. */
(() => {
 'use strict';
 const root=document.documentElement, reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const still=()=>reduced.matches||root.classList.contains('motion-paused');
 const animations=new WeakMap();
 window.voyagePop=element=>{
  if(!element||still()) return;
  animations.get(element)?.cancel();
  const animation=element.animate([
   {opacity:.25,scale:'.86',translate:'0 23px',rotate:'-2deg'},
   {opacity:1,scale:'1.035',translate:'0 -7px',rotate:'1deg',offset:.6},
   {opacity:1,scale:'.99',translate:'0 2px',rotate:'-.3deg',offset:.82},
   {opacity:1,scale:'1',translate:'0 0',rotate:'0deg'}
  ],{duration:580,easing:'cubic-bezier(.18,.75,.25,1)'});
  animations.set(element,animation);
 };
 const controls='button:not(:disabled),a.button,summary,[role="button"],a.text-link,a.floating-waypoint';
 document.addEventListener('click',event=>{
  const target=event.target.closest(controls);
  if(!target||still()) return;
  animations.get(target)?.cancel();
  animations.set(target,target.animate([
   {scale:'.94 .97'},{scale:'1.025 .99',offset:.55},{scale:'1'}
  ],{duration:330,easing:'cubic-bezier(.2,.8,.25,1)'}));
 });
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
