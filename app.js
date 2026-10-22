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
 // Members directory + personnel modal (639 records)
 var grid=document.getElementById('member-grid');
 if(grid){
  Promise.all([fetch('assets/data.json').then(r=>r.json()),fetch('assets/logos.json').then(r=>r.json()),fetch('assets/personnel.json').then(r=>r.json())]).then(function(results){
   var D=results[0], logos=results[1], personnel=results[2].records||[];
   var fa=s=>String(s==null?'':s).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
   var esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
   var norm=s=>String(s||'').replace(/\s+/g,' ').trim();
   var logoKeys={'امیداریا دارو':'omidarya','قاسم ایران':'ghasem','دی دارو':'day darou','شفاآراد':'shafaarad','سایه سمن':'saye saman','سونار تک دارو':'sonar tak','مشکات فارمد':'meshkat','یارا طب ثامن':'samen','مکمل کارن':'karen','بهداشت سلامت آوند فر':'avand far','مهبان دارو':'mahban','هجرت':'hejrat','ارمغان طبیعت':'armaghan tabiat','مشاء طب':'masha','داروگستر باریج اسانس':'barij','فردوس':'ferdos','البرز':'alborz','دارو گستر نخبگان':'nokhbeghan','سینا پخش':'sina','سها سروش':'sorosh','التیام':'eltiyam','ادورا':'adora','دارو پخش':'daroupakhsh','سها هلال':'soha','سلامت پخش هستی':'hasti','الیت':'elit','پونل برسام':'ponel','اکسیر':'exir','پورا پخش':'pora','ممتاز':'momtaz','رازی':'razi','دایا دارو':'daya','میلان پارس فارمد':'milan'};
   var logoFiles={};logos.forEach(l=>logoFiles[l.name]=l.file);
   var modal=document.getElementById('personnel-modal'), cards=document.getElementById('personnel-results'), search=document.getElementById('personnel-search'), companyFilter=document.getElementById('personnel-company-filter'), roleFilter=document.getElementById('personnel-role-filter');
   var pageSize=48, currentPage=1, filtered=[];
   var companies=[...new Set(personnel.map(p=>norm(p.company||p['نام شرکت'])).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fa'));
   var roles=[...new Set(personnel.map(p=>norm(p.role||p['سمت شغلی'])).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fa'));
   companies.forEach(c=>companyFilter.add(new Option(c,c)));
   roles.forEach(r=>roleFilter.add(new Option(r,r)));
   function applyFilters(){
    var q=norm(search.value).toLocaleLowerCase(), co=companyFilter.value, role=roleFilter.value;
    filtered=personnel.filter(p=>{
     var name=norm(p.name||p['نام و نام خانوادگی']), company=norm(p.company||p['نام شرکت']), job=norm(p.role||p['سمت شغلی']);
     return (!co||company===co)&&(!role||job===role)&&(!q||[name,company,job,norm(p.education||p['مدرک تحصیلی'])].some(v=>v.toLocaleLowerCase().includes(q)));
    }); currentPage=1; renderPeople();
   }
   function renderPeople(){
    var begin=(currentPage-1)*pageSize, shown=filtered.slice(begin,begin+pageSize);
    cards.innerHTML=shown.map(function(p){var name=norm(p.name||p['نام و نام خانوادگی']);return '<article class="personnel-card"><span class="personnel-avatar">'+esc(name.slice(0,1)||'؟')+'</span><div class="personnel-details"><h3>'+esc(name)+'</h3><p>'+esc(p.role||p['سمت شغلی']||'—')+'</p><div class="personnel-tags"><span>'+esc(p.company||p['نام شرکت']||'')+'</span>'+(p.education||p['مدرک تحصیلی']?'<span>'+esc(p.education||p['مدرک تحصیلی'])+'</span>':'')+'</div></div><span class="experience">'+(p.distributionExperience||p['سابقه حضور در پخش']?fa(p.distributionExperience||p['سابقه حضور در پخش'])+' سال سابقه':'')+'</span></article>';}).join('');
    document.getElementById('personnel-result-count').textContent=fa(filtered.length)+' نفر';
    var pages=Math.max(1,Math.ceil(filtered.length/pageSize)), pager=document.getElementById('personnel-pagination');
    pager.innerHTML='<button type="button" data-page="prev" '+(currentPage===1?'disabled':'')+'>قبلی</button><span>'+fa(currentPage)+' از '+fa(pages)+'</span><button type="button" data-page="next" '+(currentPage===pages?'disabled':'')+'>بعدی</button>';
    pager.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{currentPage+=b.dataset.page==='next'?1:-1;renderPeople();cards.scrollTop=0;}));
    document.getElementById('personnel-empty').hidden=filtered.length>0;
   }
   function openModal(company){modal.hidden=false;document.body.classList.add('modal-open');companyFilter.value=company||'';search.value='';roleFilter.value='';applyFilters();document.getElementById('personnel-close').focus();}
   function closeModal(){modal.hidden=true;document.body.classList.remove('modal-open');}
   document.querySelectorAll('[data-open-personnel]').forEach(b=>b.addEventListener('click',()=>openModal('')));
   document.getElementById('personnel-close').addEventListener('click',closeModal);
   modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
   document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeModal();});
   [search,companyFilter,roleFilter].forEach(el=>el.addEventListener(el===search?'input':'change',applyFilters));
   function render(list){
    grid.innerHTML=list.map(c=>{var key=logoKeys[norm(c.name)],src=logoFiles[key],image=src?'<img class="company-logo" src="'+esc(src)+'" alt="لوگوی '+esc(c.name)+'" loading="lazy">':'<span class="company-logo company-logo-fallback" aria-hidden="true">★</span>';
     return '<article class="company-tile">'+image+'<b>'+esc(c.name)+'</b><span class="badge">'+fa(c.personnel)+' نفر</span><button class="company-personnel-link" type="button" data-company="'+esc(norm(c.name))+'">مشاهده پرسنل</button></article>';}).join('');
    document.getElementById('empty-state').hidden=list.length>0;
    grid.querySelectorAll('.company-personnel-link').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.company)));
   }
   render(D.companies);
   var inp=document.getElementById('member-search');
   inp.addEventListener('input',function(){var q=norm(inp.value);render(D.companies.filter(c=>!q||norm(c.name).includes(q)));});
  }).catch(function(){var err=document.getElementById('personnel-load-error');if(err)err.hidden=false;});
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