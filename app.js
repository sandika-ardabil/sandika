// Sandika Elite v3
document.addEventListener('DOMContentLoaded',function(){
 // nav active
 var page=location.pathname.split('/').pop()||'index.html';
 document.querySelectorAll('.site-header nav a').forEach(a=>{if(a.getAttribute('href')===page)a.classList.add('active')});
 // mobile menu
 var h=document.querySelector('.site-header'),mt=document.querySelector('.menu-toggle');
 if(mt)mt.addEventListener('click',()=>h.classList.toggle('nav-open'));
 // logo showcase: arrow buttons + smooth drag-to-scroll
 document.querySelectorAll('.logo-showcase').forEach(function(box){
  var win=box.querySelector('.logo-track-window'),track=box.querySelector('.logo-track');
  if(!win||!track)return;
  function step(){var card=track.querySelector('.logo-card');return card?card.getBoundingClientRect().width+16:220;}
  box.querySelector('.logo-nav-btn.prev').addEventListener('click',function(){
   if(win.scrollLeft<=2)win.scrollTo({left:win.scrollWidth,behavior:'smooth'});
   else win.scrollBy({left:-step(),behavior:'smooth'});
  });
  box.querySelector('.logo-nav-btn.next').addEventListener('click',function(){
   if(win.scrollLeft+win.clientWidth>=win.scrollWidth-2)win.scrollTo({left:0,behavior:'smooth'});
   else win.scrollBy({left:step(),behavior:'smooth'});
  });
  // drag to scroll (mouse + touch), glitch-free
  var down=false,startX=0,startScroll=0,moved=false;
  function pos(e){return (e.touches?e.touches[0]:e).clientX;}
  function startDrag(e){
   if(e.touches&&e.touches.length>1)return;
   down=true;moved=false;startX=pos(e);startScroll=win.scrollLeft;
   win.classList.add('dragging');
   if(!e.touches){e.preventDefault();}
  }
  function moveDrag(e){
   if(!down)return;
   var dx=pos(e)-startX;
   if(Math.abs(dx)>3){moved=true;win.scrollLeft=startScroll-dx;}
   if(moved&&e.cancelable)e.preventDefault();
  }
  function endDrag(){if(!down)return;down=false;win.classList.remove('dragging');}
  win.addEventListener('mousedown',startDrag);
  window.addEventListener('mousemove',moveDrag,{passive:false});
  window.addEventListener('mouseup',endDrag);
  win.addEventListener('touchstart',startDrag,{passive:true});
  win.addEventListener('touchmove',moveDrag,{passive:false});
  win.addEventListener('touchend',endDrag);
  win.addEventListener('click',function(e){if(moved){e.preventDefault();e.stopPropagation();moved=false;}},true);
 });
 // members render + search
 var grid=document.getElementById('member-grid');
 if(grid){
  fetch('assets/data.json').then(r=>r.json()).then(function(D){
   var fa=s=>String(s).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
   function render(list){
    grid.innerHTML=list.map(c=>'<div class="company-tile"><b>'+c.name+'</b><span class="badge">'+fa(c.personnel)+' نفر</span></div>').join('');
    document.getElementById('empty-state').hidden=list.length>0;
   }
   render(D.companies);
   var inp=document.getElementById('member-search');
   inp.addEventListener('input',function(){
    var q=inp.value.trim();render(D.companies.filter(c=>!q||c.name.includes(q)));
   });
  });
 }
 // emblem parallax tilt
 var em=document.querySelector('.tilt-emblem');
 if(em){var st=em.closest('.emblem-stage');
  document.querySelector('.hero').addEventListener('mousemove',function(e){
   var r=st.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/r.width,y=(e.clientY-r.top-r.height/2)/r.height;
   em.style.animationPlayState='paused';
   em.style.transform='translateY('+(-y*8)+'px) rotateY('+(x*22)+'deg) rotateX('+(-y*10)+'deg)';
  });
  document.querySelector('.hero').addEventListener('mouseleave',function(){em.style.transform='';em.style.animationPlayState='running';});
 }
});