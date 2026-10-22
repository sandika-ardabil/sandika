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
 // Members and full personnel details. Only this page's behavior is extended.
 var grid=document.getElementById('member-grid');
 if(grid){
  Promise.all([fetch('assets/data.json').then(r=>{if(!r.ok)throw Error('data.json');return r.json()}),fetch('assets/logos.json').then(r=>{if(!r.ok)throw Error('logos.json');return r.json()}),fetch('assets/personnel.json').then(r=>{if(!r.ok)throw Error('personnel.json');return r.json()})]).then(function(results){
   var D=results[0], logos=results[1], P=results[2];
   var fa=s=>String(s).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
   var logoKeys={'امیداریا دارو':'omidarya','قاسم ایران':'ghasem','دی دارو':'day darou','شفاآراد':'shafaarad','سایه سمن':'saye saman','سونار تک دارو':'sonar tak','مشکات فارمد':'meshkat','یارا طب ثامن':'samen','مکمل کارن':'karen','بهداشت سلامت آوند فر':'avand far','مهبان دارو':'mahban','هجرت':'hejrat','ارمغان طبیعت':'armaghan tabiat','مشاء طب':'masha','داروگستر باریج اسانس':'barij','فردوس':'ferdos','البرز':'alborz','دارو گستر نخبگان':'nokhbeghan','سینا پخش':'sina','سها سروش':'sorosh','التیام':'eltiyam','ادورا':'adora','دارو پخش':'daroupakhsh','سها هلال':'soha','سلامت پخش هستی':'hasti','الیت':'elit','پونل برسام':'ponel','اکسیر':'exir','پورا پخش':'pora','ممتاز':'momtaz','رازی':'razi','دایا دارو':'daya','میلان پارس فارمد':'milan'};
   var logoFiles={};logos.forEach(function(l){logoFiles[l.name]=l.file;});
   function norm(s){return String(s==null?'':s).replace(/\s+/g,' ').trim();}
   var dlg=document.getElementById('personnel-dialog'),title=document.getElementById('personnel-title'),total=document.getElementById('personnel-total'),query=document.getElementById('personnel-search'),wrap=document.getElementById('personnel-table-wrap'),empty=document.getElementById('personnel-empty');
   var fields=(P.fields||[]).filter(function(f){return f!=='_id'});
   function renderPersonnel(list){
    var q=norm(query.value).toLocaleLowerCase();
    var filtered=list.filter(function(r){return !q||fields.some(function(f){return norm(r[f]).toLocaleLowerCase().includes(q)});});
    total.textContent=fa('نمایش '+filtered.length+' نفر از '+list.length+' نفر');
    var table=document.createElement('table');table.className='personnel-table';
    var thead=document.createElement('thead'),tr=document.createElement('tr');
    fields.forEach(function(f){var th=document.createElement('th');th.textContent=f;tr.appendChild(th)});thead.appendChild(tr);table.appendChild(thead);
    var tbody=document.createElement('tbody');
    filtered.forEach(function(r){var row=document.createElement('tr');fields.forEach(function(f){var td=document.createElement('td');td.textContent=r[f]==null?'':String(r[f]);row.appendChild(td)});tbody.appendChild(row)});
    table.appendChild(tbody);wrap.replaceChildren(table);empty.hidden=filtered.length>0;
   }
   function openCompany(company){
    var list=P.records.filter(function(r){return norm(r.company||r['نام شرکت'])===norm(company.name)});
    title.textContent='پرسنل '+company.name;query.value='';renderPersonnel(list);dlg.showModal();query.focus();
   }
   function renderCompanies(list){
    grid.innerHTML='';list.forEach(function(c){
     var key=logoKeys[norm(c.name)],src=logoFiles[key],card=document.createElement('button');
     card.type='button';card.className='company-tile';card.setAttribute('aria-label','نمایش پرسنل '+c.name);
     if(src){var img=document.createElement('img');img.className='company-logo';img.src=src;img.alt='لوگوی '+c.name;img.loading='lazy';card.appendChild(img)}else{var fallback=document.createElement('span');fallback.className='company-logo company-logo-fallback';fallback.setAttribute('aria-hidden','true');fallback.textContent='★';card.appendChild(fallback)}
     var name=document.createElement('b');name.textContent=c.name;card.appendChild(name);
     var badge=document.createElement('span');badge.className='badge';badge.textContent=fa(c.personnel)+' نفر';card.appendChild(badge);
     card.addEventListener('click',function(){openCompany(c)});grid.appendChild(card);
    });document.getElementById('empty-state').hidden=list.length>0;
   }
   document.getElementById('personnel-count').textContent=fa(P.records.length);
   document.getElementById('company-count').textContent=fa(D.companies.length);
   renderCompanies(D.companies);
   document.getElementById('member-search').addEventListener('input',function(){var q=norm(this.value);renderCompanies(D.companies.filter(c=>!q||norm(c.name).includes(q)));});
   query.addEventListener('input',function(){var company=title.textContent.replace(/^پرسنل\s*/,'');var list=P.records.filter(r=>norm(r.company||r['نام شرکت'])===norm(company));renderPersonnel(list);});
   document.getElementById('personnel-close').addEventListener('click',function(){dlg.close()});
   dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close()});
   document.addEventListener('keydown',function(e){if(e.key==='Escape'&&dlg.open)dlg.close()});
  }).catch(function(err){console.error('Unable to load members/personnel:',err);document.getElementById('empty-state').hidden=false;document.getElementById('empty-state').textContent='بارگذاری اطلاعات پرسنل با خطا مواجه شد؛ مسیر فایل‌های assets را بررسی کنید.';});
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

/* --- Hero slider --- */
(function(){
  const slider = document.querySelector('[data-hero-slider]');
  if(!slider) return;
  const slides = slider.querySelectorAll('.hero-slide');
  const dots = slider.querySelectorAll('.hero-dot');
  let idx = 0, timer = null;
  function go(i){
    idx = (i + slides.length) % slides.length;
    slides.forEach((s,n)=>s.classList.toggle('active', n===idx));
    dots.forEach((d,n)=>d.classList.toggle('active', n===idx));
  }
  function next(){ go(idx+1); }
  function reset(){ clearInterval(timer); timer = setInterval(next, 5000); }
  slider.querySelector('.hero-arrow.next').addEventListener('click', ()=>{ next(); reset(); });
  slider.querySelector('.hero-arrow.prev').addEventListener('click', ()=>{ go(idx-1); reset(); });
  dots.forEach((d,n)=>d.addEventListener('click', ()=>{ go(n); reset(); }));
  reset();
})();
