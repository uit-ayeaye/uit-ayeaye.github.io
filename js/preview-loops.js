/* Only visible previews play. Stills remain the default on constrained devices. */
(() => {
 'use strict';
 const root=document.documentElement, reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const connection=navigator.connection, visible=new Set(), videos=new Set();
 const constrained=()=>connection?.saveData || /(^|-)[23]g$/.test(connection?.effectiveType||'');
 const allowed=()=>!document.hidden&&!reduced.matches&&!root.classList.contains('motion-paused')&&!constrained();
 function reconcile(){
  let playing=0;
  const modal=document.querySelector('dialog[open]');
  videos.forEach(video=>{
   const eligible=allowed()&&video.dataset.paused!=='true'&&visible.has(video)&&!video.hidden&&!video.closest('[hidden]')&&(!modal||modal.contains(video))&&playing<(matchMedia('(max-width:700px)').matches?1:2);
   if(eligible&&video.dataset.src){
    playing++;
    if(!video.getAttribute('src')){video.src=video.dataset.src;video.load();}
    if(video.paused) video.play().catch(()=>video.classList.remove('is-playing'));
   }else video.pause();
  });
  const control=document.querySelector('.preview-motion');
  if(control){const v=document.querySelector('#preview-loop');control.hidden=!v?.dataset.src;control.disabled=!allowed();control.textContent=!allowed()?'Still preview · motion off':v.paused?'Play preview ▷':'Pause preview Ⅱ';control.setAttribute('aria-pressed',String(!v.paused));}
 }
 const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting&&entry.intersectionRatio>=.3)visible.add(entry.target);else visible.delete(entry.target);});reconcile();
 },{threshold:[0,.3]});
 function register(video){
  if(videos.has(video))return;videos.add(video);video.muted=true;
  video.addEventListener('playing',()=>{video.classList.add('is-playing');if(video.id==='preview-loop')reconcile();});
  video.addEventListener('pause',()=>video.classList.remove('is-playing'));
  video.addEventListener('error',()=>video.classList.remove('is-playing'));
  observer.observe(video);
 }
 document.querySelectorAll('.preview-loop').forEach(register);
 window.setVoyagePreview=(src,poster)=>{
  const video=document.querySelector('#preview-loop');if(!video)return;
  video.pause();video.classList.remove('is-playing');video.removeAttribute('src');video.load();
  video.dataset.src=src||'';delete video.dataset.paused;video.hidden=!src;video.poster=poster||'';register(video);reconcile();
 };
 document.querySelector('.preview-motion')?.addEventListener('click',()=>{const v=document.querySelector('#preview-loop');v.dataset.paused=String(v.dataset.paused!=='true');reconcile();});
 new MutationObserver(reconcile).observe(root,{attributes:true,attributeFilter:['class']});
 document.querySelectorAll('.world-panel').forEach(panel=>new MutationObserver(reconcile).observe(panel,{attributes:true,attributeFilter:['hidden']}));
 document.addEventListener('visibilitychange',reconcile);reduced.addEventListener('change',reconcile);
 connection?.addEventListener('change',reconcile);
 document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',reconcile));
})();
