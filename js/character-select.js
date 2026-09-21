/* A lightweight character lobby. No renderer, autoplay carousel, or scroll hijacking. */
(() => {
 'use strict';
 const root=document.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const still=()=>reduced.matches||root.classList.contains('motion-paused');
 const toggle=document.querySelector('.immersive-toggle');
 const syncImmersion=()=>{
  const enabled=root.classList.contains('immersive-mode');
  if(toggle){toggle.hidden=false;toggle.setAttribute('aria-pressed',String(enabled));toggle.lastElementChild.textContent=enabled?'Immersive on':'Immersive off';}
  document.dispatchEvent(new Event('voyage-preferences'));
 };
 toggle?.addEventListener('click',()=>{
  const enabled=root.classList.toggle('immersive-mode');
  try{localStorage.setItem('bb-immersive',enabled?'on':'off');}catch(_){}
  syncImmersion();
 });
 syncImmersion();
 const lobby=document.querySelector('.character-select');
 if(!lobby)return;
 const stage=lobby.querySelector('.hero-art-window'),tabs=[...lobby.querySelectorAll('[data-art]')];
 const cast=[
  {key:'captain',name:'The captain',role:'THE BUILDER',description:'A curious mind. An independent spirit.'},
  {key:'ship',name:'The voyager',role:'THE EXPLORER',description:'Games, products, and worlds worth exploring.'},
  {key:'bounty',name:'The wanted one',role:'THE ORIGINAL',description:'Myanmar roots. A little pirate spirit.'}
 ];
 let selected=0,entrance=null,gesture=null,request=0;
 const ready=index=>Promise.all([...pose(index).querySelectorAll('img'),...(pose(index).matches('img')?[pose(index)]:[])].map(img=>{img.loading='eager';return img.decode?.().catch(()=>{});}));
 const pose=index=>lobby.querySelector('.hero-'+cast[index].key);
 async function select(index,direction=1,announce=true){
  index=(index+cast.length)%cast.length;
  const ticket=++request;
  resetGesture();
  if(announce){await ready(index);if(ticket!==request)return;}
  entrance?.cancel();
  selected=index;
  cast.forEach((item,i)=>{pose(i).hidden=i!==index;tabs[i].setAttribute('aria-pressed',String(i===index));});
  const item=cast[index]; lobby.dataset.character=item.key;
  lobby.querySelector('.character-counter').textContent=`0${index+1} / 03`;
  lobby.querySelector('.character-role').textContent=`${item.role} / 0${index+1}`;
  lobby.querySelector('.character-name').textContent=item.name;
  lobby.querySelector('.character-description').textContent=item.description;
  if(announce)lobby.querySelector('.character-status').textContent=`${item.name}. ${item.description} ${index+1} of 3.`;
  if(!still()&&announce)entrance=pose(index).animate([
   {opacity:.4,translate:`${direction*12}px 0`},
   {opacity:1,translate:'0 0'}
  ],{duration:200,easing:'cubic-bezier(.16,1,.3,1)'});
 }
 lobby.querySelector('.art-switch').hidden=false;
 lobby.querySelector('.character-arrows').hidden=false;
 tabs.forEach((tab,i)=>tab.addEventListener('click',()=>select(i,i>selected?1:-1)));
 lobby.querySelectorAll('[data-character-step]').forEach(button=>button.addEventListener('click',()=>select(selected+Number(button.dataset.characterStep),Number(button.dataset.characterStep))));
 stage.addEventListener('keydown',event=>{
  const destination={ArrowRight:selected+1,ArrowLeft:selected-1,Home:0,End:2}[event.key];
  if(destination===undefined)return;event.preventDefault();select(destination,event.key==='ArrowLeft'?-1:1);
 });
 stage.addEventListener('dragstart',event=>event.preventDefault());
 // Lock the first meaningful gesture to one axis. A vertical scroll never
 // becomes a character swipe, and a second finger belongs to browser zoom.
 function resetGesture(){
  const current=gesture;gesture=null;
  stage.classList.remove('is-character-dragging');
  if(current){cancelAnimationFrame(current.frame);pose(selected).style.translate='';}
  if(current&&stage.hasPointerCapture(current.id))stage.releasePointerCapture(current.id);
 }
 stage.addEventListener('pointerdown',event=>{
  if(!event.isPrimary){resetGesture();return;}
  if(event.button!==0)return;
  resetGesture();
  entrance?.cancel();
  gesture={x:event.clientX,y:event.clientY,dx:0,id:event.pointerId,axis:null,width:stage.clientWidth};
 });
 stage.addEventListener('pointermove',event=>{
  if(!gesture||gesture.id!==event.pointerId)return;
  const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
  if(!gesture.axis&&Math.max(Math.abs(dx),Math.abs(dy))>=10){
   if(Math.abs(dx)<=Math.abs(dy)*1.5){resetGesture();return;}
   gesture.axis='horizontal';
   stage.setPointerCapture(event.pointerId);
   stage.classList.add('is-character-dragging');
  }
  if(!gesture.axis)return;
  gesture.dx=dx;
  // Bounded feedback moves only the illustration, once per display frame.
  // The clipped stage and its neighbouring links never move with the gesture.
  if(!still()&&!gesture.frame)gesture.frame=requestAnimationFrame(()=>{
   if(!gesture)return;
   pose(selected).style.translate=`${Math.max(-24,Math.min(24,gesture.dx*.18))}px 0`;
   gesture.frame=0;
  });
  event.preventDefault();
 });
 const finish=event=>{
  // A touch starts with implicit capture on the image. Its bubbling loss
  // when capture moves to the stage must not cancel the active swipe.
  if(event.type==='lostpointercapture'&&event.target!==stage)return;
  if(!gesture||gesture.id!==event.pointerId)return;
  const current=gesture;
  resetGesture();
  const dx=event.clientX-current.x;
  if(event.type==='pointerup'&&current.axis==='horizontal'&&Math.abs(dx)>Math.min(60,current.width*.18))select(selected+(dx<0?1:-1),dx<0?1:-1);
 };
 stage.addEventListener('pointerup',finish);stage.addEventListener('pointercancel',finish);stage.addEventListener('lostpointercapture',finish);
 stage.addEventListener('pointerleave',event=>{if(gesture&&!gesture.axis)finish(event);});
 window.addEventListener('blur',resetGesture);
 const sync=()=>{if(still()||document.hidden){entrance?.cancel();resetGesture();}lobby.classList.toggle('character-still',still()||document.hidden||!root.classList.contains('immersive-mode'));};
 document.addEventListener('voyage-preferences',sync);document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 // Wait for the primary image before warming smaller alternate artwork.
 // Data-saving connections load alternatives only when requested.
 const warm=()=>{
  if(navigator.connection?.saveData||/(^|-)[23]g$/.test(navigator.connection?.effectiveType||''))return;
  const run=()=>{ready(1).then(()=>ready(2));};
  if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:2000});else setTimeout(run,500);
 };
 if(document.readyState==='complete')warm();else window.addEventListener('load',warm,{once:true});
 new IntersectionObserver(entries=>lobby.classList.toggle('character-in-view',entries[0].isIntersecting),{threshold:.1}).observe(lobby);
 select(0,1,false);sync();
})();
