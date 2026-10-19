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
});