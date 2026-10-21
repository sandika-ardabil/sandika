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
  Promise.all([fetch('assets/data.json').then(r=>r.json()),fetch('assets/logos.json').then(r=>r.json())]).then(function(results){
   var D=results[0], logos=results[1];
   var fa=s=>String(s).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
   // Company-name to existing logo-manifest key correspondence.
   var logoKeys={
    'امیداریا دارو':'omidarya','قاسم ایران':'ghasem','دی دارو':'day darou','شفاآراد':'shafaarad','سایه سمن':'saye saman',
    'سونار تک دارو':'sonar tak','مشکات فارمد':'meshkat','یارا طب ثامن':'samen','مکمل کارن':'karen','بهداشت سلامت آوند فر':'avand far',
    'مهبان دارو':'mahban','هجرت':'hejrat','ارمغان طبیعت':'armaghan tabiat','مشاء طب':'masha','داروگستر باریج اسانس':'barij',
    'فردوس':'ferdos','البرز':'alborz','دارو گستر نخبگان':'nokhbeghan','سینا پخش':'sina','سها سروش':'sorosh','التیام':'eltiyam',
    'ادورا':'adora','دارو پخش':'daroupakhsh','سها هلال':'soha','سلامت پخش هستی':'hasti','الیت':'elit','پونل برسام':'ponel',
    'اکسیر':'exir','پورا پخش':'pora','ممتاز':'momtaz','رازی':'razi','دایا دارو':'daya','میلان پارس فارمد':'milan'
   };
   var logoFiles={};logos.forEach(function(l){logoFiles[l.name]=l.file;});
   function norm(s){return String(s).replace(/\s+/g,' ').trim();}
   function render(list){
    grid.innerHTML=list.map(function(c){
     var key=logoKeys[norm(c.name)],src=logoFiles[key];
     var image=src?'<img class="company-logo" src="'+src+'" alt="لوگوی '+c.name+'" loading="lazy">':'<span class="company-logo company-logo-fallback" aria-hidden="true">★</span>';
     return '<article class="company-tile">'+image+'<b>'+c.name+'</b><span class="badge">'+fa(c.personnel)+' نفر</span></article>';
    }).join('');
    document.getElementById('empty-state').hidden=list.length>0;
   }
   render(D.companies);
   var inp=document.getElementById('member-search');
   inp.addEventListener('input',function(){
    var q=norm(inp.value);render(D.companies.filter(c=>!q||norm(c.name).includes(q)));
   });
  });
 }

 // logos scroll showcase (33 logos, arrows + continuous marquee to the left, pause on hover/touch)
 var showcase=document.querySelector('[data-showcase]');
 var win=showcase?showcase.querySelector('.showcase-window'):null;
 if(win){
  fetch('assets/logos.json').then(r=>r.json()).then(function(L){
   var track=win.querySelector('[data-track]');
   var items=L.map(function(l){
    return '<div class="logo-item" title="'+l.name+'"><img src="'+l.file+'" alt="'+l.name+'" loading="lazy" draggable="false"></div>';
   }).join('');
   // duplicate the set twice for a seamless -50% translate loop
   track.innerHTML=items+items;
   track.setAttribute('dir','ltr');

   // measure one full set width -> animation duration for constant speed
   function halfWidth(){return track.scrollWidth/2;}
   function tuneDuration(){
    var half=halfWidth();if(!half)return;
    var speed=44; // px per second, smooth and slow
    win.style.setProperty('--marquee-duration',(half/speed).toFixed(2)+'s');
   }
   tuneDuration();
   if(document.fonts&&document.fonts.ready)document.fonts.ready.then(tuneDuration);
   window.addEventListener('resize',tuneDuration);

   win.classList.add('marquee-active');

   // pause on hover / touch, resume on leave
   function pause(){win.classList.add('paused');}
   function resume(){win.classList.remove('paused');}
   win.addEventListener('mouseenter',pause);
   win.addEventListener('mouseleave',resume);
   win.addEventListener('touchstart',pause,{passive:true});
   win.addEventListener('touchend',function(){setTimeout(resume,1200);},{passive:true});
   win.addEventListener('touchcancel',resume,{passive:true});
   win.addEventListener('focusin',pause);
   win.addEventListener('focusout',resume);
   win.addEventListener('dragstart',function(e){e.preventDefault();});

   // arrow buttons: jump a viewport-width left/right and briefly re-sync the marquee
   var busy=false;
   showcase.querySelectorAll('.showcase-arrow').forEach(function(btn){
    btn.addEventListener('click',function(){
     if(busy)return;busy=true;
     pause();
     var dir=Number(btn.dataset.dir)||1; // 1 = next (scroll left), -1 = prev (scroll right)
     var step=Math.max(win.clientWidth*0.85,180);
     var half=halfWidth();
     // keep the effective offset inside one loop for seamless wrap
     var cur=parseFloat(track.dataset.offset||'0');
     var next=cur+dir*step;
     if(half>0){next=((next%half)+half)%half;}
     track.dataset.offset=String(next);
     win.classList.add('paused');
     track.style.transition='transform .45s ease';
     track.style.transform='translate3d('+(-next)+'px,0,0)';
     setTimeout(function(){
      track.style.transition='';
      track.style.transform='';
      resume();
      busy=false;
     },470);
    });
   });

   // manual wheel scroll also pauses briefly
   win.addEventListener('wheel',function(){pause();clearTimeout(win._wt);win._wt=setTimeout(resume,1200);},{passive:true});
  });
 }
});