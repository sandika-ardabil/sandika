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


 // --- personnel details modal (members page) ---
 var personnelByCompany={};
 var personModal=document.getElementById('person-modal');
 if(personModal){
  var pBox=personModal.querySelector('.person-modal-box');
  var pBody=personModal.querySelector('#person-modal-body');
  var pTitle=personModal.querySelector('#person-modal-title');
  var pCount=personModal.querySelector('#person-modal-count');
  function faNum(s){return String(s).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);}
  function normKey(s){return String(s||'').replace(/\u200c/g,' ').replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/\s+/g,' ').trim();}
  fetch('assets/personnel.json').then(function(r){if(!r.ok)throw 0;return r.json();})
   .then(function(P){
    (P.records||[]).forEach(function(r){
     var k=normKey(r.company||r['نام شرکت']);
     (personnelByCompany[k]=personnelByCompany[k]||[]).push(r);
    });
   }).catch(function(){personnelByCompany={};}); // on failure: every company shows the graceful empty message
  function openPersonModal(companyName){
   var list=personnelByCompany[normKey(companyName)]||[];
   pTitle.textContent='پرسنل '+companyName;
   pCount.textContent=list.length?faNum(list.length)+' نفر':'';
   if(!list.length){
    pBody.innerHTML='<p class="person-empty">اطلاعات پرسنلی برای این شرکت ثبت نشده است.</p>';
   }else{
    pBody.innerHTML='<ul class="person-list">'+list.map(function(r){
     var name=r.name||r['نام و نام خانوادگی']||'—';
     var role=r.role||r['سمت شغلی']||'';
     var edu=r.education||r['مدرک تحصیلی']||'';
     var exp=r.distributionExperience!=null?r.distributionExperience:(r['سابقه حضور در پخش']||'');
     var expTxt=exp!==''&&exp!=null?'سابقه پخش: '+faNum(exp)+' سال':'';
     return '<li class="person-item"><div class="person-avatar" aria-hidden="true">'+String(name).trim().charAt(0)+'</div>'+
      '<div class="person-info"><b>'+name+'</b>'+
      (role?'<span class="person-role">'+role+'</span>':'')+
      ((edu||expTxt)?'<span class="person-meta">'+[edu,expTxt].filter(Boolean).join(' • ')+'</span>':'')+
      '</div></li>';
    }).join('')+'</ul>';
   }
   personModal.classList.add('open');
   personModal.hidden=false;
   document.body.style.overflow='hidden';
  }
  function closePersonModal(){
   personModal.classList.remove('open');
   personModal.hidden=true;
   document.body.style.overflow='';
  }
  personModal.querySelector('.person-modal-close').addEventListener('click',closePersonModal);
  personModal.addEventListener('click',function(e){if(e.target===personModal)closePersonModal();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closePersonModal();});
  // make company tiles clickable
  var grid2=document.getElementById('member-grid');
  if(grid2)grid2.addEventListener('click',function(e){
   var tile=e.target.closest('.company-tile');
   if(tile)openPersonModal(tile.dataset.company||tile.querySelector('b').textContent);
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