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
 let selected=0,entrance=null,gesture=null;
 const pose=index=>lobby.querySelector('.hero-'+cast[index].key);
 function select(index,direction=1,announce=true){
  index=(index+cast.length)%cast.length;
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
   {opacity:0,translate:`${direction*42}px 0`,scale:'.96'},
   {opacity:1,translate:'0 0',scale:'1'}
  ],{duration:430,easing:'cubic-bezier(.16,1,.3,1)'});
 }
 lobby.querySelector('.art-switch').hidden=false;
 lobby.querySelector('.character-arrows').hidden=false;
 tabs.forEach((tab,i)=>tab.addEventListener('click',()=>{if(i!==selected)select(i,i>selected?1:-1);}));
 lobby.querySelectorAll('[data-character-step]').forEach(button=>button.addEventListener('click',()=>select(selected+Number(button.dataset.characterStep),Number(button.dataset.characterStep))));
 stage.addEventListener('keydown',event=>{
  const destination={ArrowRight:selected+1,ArrowLeft:selected-1,Home:0,End:2}[event.key];
  if(destination===undefined)return;event.preventDefault();select(destination,event.key==='ArrowLeft'?-1:1);
 });
 stage.addEventListener('dragstart',event=>event.preventDefault());
 stage.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  gesture={x:event.clientX,y:event.clientY,dx:0,id:event.pointerId,horizontal:false,width:stage.clientWidth};
 });
 stage.addEventListener('pointermove',event=>{
  if(!gesture||gesture.id!==event.pointerId)return;
  const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
  if(!gesture.horizontal&&Math.abs(dy)>14&&Math.abs(dy)>Math.abs(dx)){gesture=null;return;}
  if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.25&&!gesture.horizontal){gesture.horizontal=true;stage.setPointerCapture(event.pointerId);stage.classList.add('is-character-dragging');}
  if(!gesture.horizontal)return;
  gesture.dx=dx;event.preventDefault();
  if(!still())stage.style.setProperty('--drag-x',`${Math.max(-70,Math.min(70,dx*.3))}px`);
 });
 const finish=event=>{
  if(!gesture)return;
  const current=gesture;gesture=null;
  stage.classList.remove('is-character-dragging');stage.style.removeProperty('--drag-x');
  if(stage.hasPointerCapture(current.id))stage.releasePointerCapture(current.id);
  if(event.type==='pointerup'&&current.horizontal&&Math.abs(current.dx)>Math.min(60,current.width*.18))select(selected+(current.dx<0?1:-1),current.dx<0?1:-1);
 };
 stage.addEventListener('pointerup',finish);stage.addEventListener('pointercancel',finish);stage.addEventListener('lostpointercapture',finish);
 stage.addEventListener('pointerleave',event=>{if(gesture&&!gesture.horizontal)finish(event);});
 const sync=()=>{if(still())entrance?.cancel();lobby.classList.toggle('character-still',still()||document.hidden||!root.classList.contains('immersive-mode'));};
 document.addEventListener('voyage-preferences',sync);document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 new IntersectionObserver(entries=>lobby.classList.toggle('character-in-view',entries[0].isIntersecting),{threshold:.1}).observe(lobby);
 select(0,1,false);sync();
})();
