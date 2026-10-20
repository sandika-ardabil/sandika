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

 // logos marquee (auto scroll, RTL, pause on hover)
 var track=document.querySelector('[data-track]');
 if(track){
  fetch('assets/logos.json').then(r=>r.json()).then(function(L){
   var html=L.map(l=>'<div class="logo-item" title="'+l.name+'"><img src="'+l.file+'" alt="'+l.name+'" loading="lazy"></div>').join('');
   track.innerHTML=html+html; // duplicate for seamless loop
  });
  var mq=track.closest('.marquee');
  mq.addEventListener('mouseenter',function(){track.style.animationPlayState='paused';});
  mq.addEventListener('mouseleave',function(){track.style.animationPlayState='running';});
  // drag to scroll left/right
  var down=false,sx=0,start=0;
  mq.addEventListener('mousedown',function(e){down=true;sx=e.clientX;start=parseFloat(getComputedStyle(track).transform.split(',')[4])||0;track.style.animationPlayState='paused';});
  window.addEventListener('mouseup',function(){down=false;track.style.animationPlayState='running';});
  window.addEventListener('mousemove',function(e){if(!down)return;var dx=e.clientX-sx;track.style.animation='none';track.style.transform='translateX('+(start+dx)+'px)';});
  mq.addEventListener('wheel',function(e){e.preventDefault();var cur=parseFloat(getComputedStyle(track).transform.split(',')[4])||0;track.style.animation='none';track.style.transform='translateX('+(cur - Math.sign(e.deltaY)*60)+'px)';},{passive:false});
 }
});