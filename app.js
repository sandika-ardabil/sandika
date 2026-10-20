// Sandika Elite v3
document.addEventListener('DOMContentLoaded',function(){
 // nav active
 var page=location.pathname.split('/').pop()||'index.html';
 document.querySelectorAll('.site-header nav a').forEach(a=>{if(a.getAttribute('href')===page)a.classList.add('active')});
 // mobile menu
 var h=document.querySelector('.site-header'),mt=document.querySelector('.menu-toggle');
 if(mt)mt.addEventListener('click',()=>h.classList.toggle('nav-open'));
 // carousel
 document.querySelectorAll('[data-carousel]').forEach(function(c){
  var slides=c.querySelectorAll('.company-slide'),dots=c.closest('.glass-card').querySelectorAll('.dot'),i=0,timer;
  function go(n){i=(n+slides.length)%slides.length;slides.forEach((s,k)=>s.classList.toggle('active',k===i));dots.forEach((d,k)=>d.classList.toggle('active',k===i));}
  function auto(){timer=setInterval(()=>go(i+1),3200);}
  c.querySelector('.next').addEventListener('click',()=>{clearInterval(timer);go(i+1);auto();});
  c.querySelector('.prev').addEventListener('click',()=>{clearInterval(timer);go(i-1);auto();});
  dots.forEach((d,k)=>d.addEventListener('click',()=>{clearInterval(timer);go(k);auto();}));
  go(0);auto();
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

 // logos scroll showcase (33 logos, arrows + smooth pointer drag, no dots/marquee)
 var win=document.querySelector('[data-showcase] .showcase-window');
 if(win){
  fetch('assets/logos.json').then(r=>r.json()).then(function(L){
   win.querySelector('[data-track]').innerHTML=L.map(function(l){
    return '<div class="logo-item" title="'+l.name+'"><img src="'+l.file+'" alt="'+l.name+'" loading="lazy" draggable="false"></div>';
   }).join('');
   document.querySelectorAll('.showcase-arrow').forEach(function(btn){
    btn.addEventListener('click',function(){
     if(win.dataset.dragged==='1')return;
     win.scrollBy({left:Number(btn.dataset.dir)*360,behavior:'smooth'});
    });
   });
   // pointer drag with threshold + rAF + click suppression, snap kept when idle
   var down=false,startX=0,startScroll=0,moved=false,raf=null,vel=0,lastX=0,lastT=0;
   win.addEventListener('pointerdown',function(e){
    down=true;moved=false;startX=e.clientX;startScroll=win.scrollLeft;
    lastX=e.clientX;lastT=performance.now();vel=0;
    win.setPointerCapture(e.pointerId);
    win.classList.remove('dragging');
   });
   win.addEventListener('pointermove',function(e){
    if(!down)return;
    var dx=e.clientX-startX;
    if(!moved&&Math.abs(dx)<6)return; // drag threshold
    if(!moved){moved=true;win.classList.add('dragging');}
    var now=performance.now();
    vel=(e.clientX-lastX)/Math.max(now-lastT,1);
    lastX=e.clientX;lastT=now;
    if(raf)cancelAnimationFrame(raf);
    raf=requestAnimationFrame(function(){win.scrollLeft=startScroll-dx;});
   });
   function endDrag(e){
    if(!down)return;down=false;
    if(raf){cancelAnimationFrame(raf);raf=null;}
    win.classList.remove('dragging');
    if(moved){
     win.dataset.dragged='1';
     // momentum then snap
     var target=win.scrollLeft - vel*260;
     win.scrollTo({left:Math.max(0,target),behavior:'smooth'});
     setTimeout(function(){win.dataset.dragged='0';},80);
    }
   }
   win.addEventListener('pointerup',endDrag);
   win.addEventListener('pointercancel',endDrag);
   win.addEventListener('click',function(e){if(win.dataset.dragged==='1'){e.preventDefault();e.stopPropagation();}},true);
   win.addEventListener('dragstart',function(e){e.preventDefault();});
  });
 }
});