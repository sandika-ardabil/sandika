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
   /* ---- helpers ---- */
   function pick(r,fa,en){var v=r[fa];if(v==null||v==='')v=r[en];return v==null||v===''?'—':String(v);}
   var COMPACT=[
    {fa:'ردیف',en:'rowIndex',label:'ردیف'},
    {fa:'نام شرکت',en:'company',label:'نام شرکت'},
    {fa:'نام و نام خانوادگی',en:'name',label:'نام و نام خانوادگی'},
    {fa:'کد ملی',en:'nationalId',label:'کد ملی'},
    {fa:'سمت شغلی',en:'role',label:'سمت شغلی'},
    {fa:'وضعیت تاهل',en:'maritalStatus',label:'وضعیت تأهل'}
   ];
   var DETAILS=[
    {fa:'نام شرکت',en:'company',label:'نام شرکت'},
    {fa:'سمت شغلی',en:'role',label:'سمت شغلی'},
    {fa:'تاریخ تولد',en:'birthdate',label:'تاریخ تولد'},
    {fa:'وضعیت تاهل',en:'maritalStatus',label:'وضعیت تأهل'},
    {fa:'تعداد فرزند',en:'childrenCount',label:'تعداد فرزند'},
    {fa:'مدرک تحصیلی',en:'education',label:'مدرک تحصیلی'},
    {fa:'سابقه بیمه',en:'insuranceHistory',label:'سابقه بیمه (سال)'},
    {fa:'سابقه حضور در پخش',en:'distributionExperience',label:'سابقه حضور در پخش (سال)'},
    {fa:'تلفن همراه',en:'phone',label:'تلفن همراه'}
   ];
   var mqMobile=window.matchMedia('(max-width:768px)');
   var state={main:{key:'',dir:1},dlg:{key:'',dir:1}};
   var idMap={};P.records.forEach(function(r){if(r._id!=null)idMap[String(r._id)]=r;});
   function sorted(list,st){
    if(!st.key)return list.slice();
    var col=COMPACT.filter(function(c){return c.fa===st.key||c.en===st.key})[0];
    if(!col)return list.slice();
    return list.slice().sort(function(a,b){
     var x=pick(a,col.fa,col.en),y=pick(b,col.fa,col.en);
     var nx=parseFloat(x.replace(/[^\d.-]/g,'')),ny=parseFloat(y.replace(/[^\d.-]/g,''));
     if(!isNaN(nx)&&!isNaN(ny)&&String(nx)===x.trim()&&String(ny)===y.trim())return (nx-ny)*st.dir;
     return x.localeCompare(y,'fa')*st.dir;});
   }
   function filteredMain(){
    var q=norm(document.getElementById('personnel-main-search').value).toLocaleLowerCase();
    var co=document.getElementById('personnel-company-select').value;
    return P.records.filter(function(r){
     if(co&&norm(pick(r,'نام شرکت','company'))!==co)return false;
     if(!q)return true;
     return ['نام و نام خانوادگی','name','نام شرکت','company','کد ملی','nationalId','سمت شغلی','role'].some(function(f){return norm(r[f]).toLocaleLowerCase().includes(q);});
    });
   }
   function viewBtn(r){
    var b=document.createElement('button');b.type='button';b.className='person-view-btn';
    b.textContent='مشاهده جزئیات';b.dataset.personId=String(r._id==null?'':r._id);
    b.setAttribute('aria-label','مشاهده جزئیات '+pick(r,'نام و نام خانوادگی','name'));
    return b;
   }
   function renderTable(wrap,list,st){
    var t=document.createElement('table');t.className='personnel-table personnel-table-compact';
    var thead=document.createElement('thead'),trh=document.createElement('tr');
    COMPACT.forEach(function(c){
     var th=document.createElement('th');th.setAttribute('scope','col');
     var btn=document.createElement('button');btn.type='button';btn.className='th-sort';btn.dataset.sort=c.fa;
     btn.textContent=c.label;
     if(st.key===c.fa||st.key===c.en){btn.classList.add(st.dir>0?'asc':'desc');btn.setAttribute('aria-sort',st.dir>0?'ascending':'descending');th.setAttribute('aria-sort',st.dir>0?'ascending':'descending');}
     btn.setAttribute('aria-label','مرتب‌سازی بر اساس '+c.label);
     th.appendChild(btn);trh.appendChild(th);
    });
    var thA=document.createElement('th');thA.textContent='عملیات';trh.appendChild(thA);
    thead.appendChild(trh);t.appendChild(thead);
    var tbody=document.createElement('tbody');
    list.forEach(function(r){
     var tr=document.createElement('tr');
     COMPACT.forEach(function(c){var td=document.createElement('td');td.textContent=pick(r,c.fa,c.en);tr.appendChild(td);});
     var td=document.createElement('td');td.appendChild(viewBtn(r));tr.appendChild(td);
     tbody.appendChild(tr);
    });
    t.appendChild(tbody);wrap.replaceChildren(t);
   }
   function renderCards(wrap,list){
    var box=document.createElement('div');box.className='person-cards';
    list.forEach(function(r){
     var card=document.createElement('article');card.className='person-card';
     var nm=document.createElement('b');nm.textContent=pick(r,'نام و نام خانوادگی','name');card.appendChild(nm);
     [['نام شرکت','company'],['سمت شغلی','role'],['کد ملی','nationalId'],['وضعیت تاهل','maritalStatus']].forEach(function(c){
      var p=document.createElement('p');p.innerHTML='<span>'+c[1]+'</span>';
      var span=p.firstChild;span.textContent=c[1]+'؛ ';p.appendChild(document.createTextNode(pick(r,c[0],c[1])));card.appendChild(p);
     });
     card.appendChild(viewBtn(r));box.appendChild(card);
    });
    wrap.replaceChildren(box);
   }
   function renderList(wrap,list,st){
    if(mqMobile.matches)renderCards(wrap,list);else renderTable(wrap,list,st);
   }
   function renderMain(){
    var list=sorted(filteredMain(),state.main);
    document.getElementById('personnel-main-count').textContent=fa('نمایش '+list.length+' نفر از '+P.records.length+' نفر');
    renderList(document.getElementById('personnel-main-wrap'),list,state.main);
    document.getElementById('personnel-main-empty').hidden=list.length>0;
   }
   function renderDlg(){
    var company=title.textContent.replace(/^پرسنل\s*/,'');
    var base=P.records.filter(function(r){return norm(pick(r,'نام شرکت','company'))===norm(company);});
    var q=norm(query.value).toLocaleLowerCase();
    var list=sorted(base.filter(function(r){return !q||fields.some(function(f){return norm(r[f]).toLocaleLowerCase().includes(q);});}),state.dlg);
    total.textContent=fa('نمایش '+list.length+' نفر از '+base.length+' نفر');
    renderTable(wrap,list,state.dlg);
    empty.hidden=list.length>0;
   }
   /* ---- person detail modal ---- */
   var pdlg=document.getElementById('person-detail-dialog'),ptitle=document.getElementById('person-detail-title'),psub=document.getElementById('person-detail-sub'),pbody=document.getElementById('person-detail-body');
   function openPerson(id){
    var r=idMap[String(id)];if(!r)return;
    ptitle.textContent=pick(r,'نام و نام خانوادگی','name');
    psub.textContent=pick(r,'نام شرکت','company')+' — '+pick(r,'سمت شغلی','role');
    pbody.replaceChildren();
    var dl=document.createElement('dl');dl.className='person-detail-list';
    DETAILS.forEach(function(d){
     var dt=document.createElement('dt');dt.textContent=d.label;dl.appendChild(dt);
     var dd=document.createElement('dd');dd.textContent=pick(r,d.fa,d.en);dl.appendChild(dd);
    });
    pbody.appendChild(dl);pdlg.showModal();lockScroll(true);
   }
   function lockScroll(on){document.body.style.overflow=on?'hidden':'';}
   [dlg,pdlg].forEach(function(d){
    d.addEventListener('close',function(){lockScroll(false);});
    d.addEventListener('click',function(e){if(e.target===d)d.close();});
   });
   document.getElementById('person-detail-close').addEventListener('click',function(){pdlg.close();});
   /* ---- event delegation for view buttons + sortable headers ---- */
   function delegated(el){
    el.addEventListener('click',function(e){
     var b=e.target.closest('.person-view-btn');
     if(b&&el.contains(b)){openPerson(b.dataset.personId);return;}
     var s=e.target.closest('.th-sort');
     if(s&&el.contains(s)){
      var k=s.dataset.sort,st=(el===document.getElementById('personnel-main-wrap'))?state.main:state.dlg;
      if(st.key===k)st.dir*=-1;else{st.key=k;st.dir=1;}
      if(el===document.getElementById('personnel-main-wrap'))renderMain();else renderDlg();
     }
    });
   }
   delegated(document.getElementById('personnel-main-wrap'));
   delegated(wrap);
   /* ---- wire main panel ---- */
   var sel=document.getElementById('personnel-company-select');
   Array.from(new Set(P.records.map(function(r){return norm(pick(r,'نام شرکت','company'));})).values()).sort(function(a,b){return a.localeCompare(b,'fa');}).forEach(function(c){
    var o=document.createElement('option');o.value=c;o.textContent=c;sel.appendChild(o);
   });
   document.getElementById('personnel-main-search').addEventListener('input',renderMain);
   sel.addEventListener('change',renderMain);
   renderMain();
   var rT=null;mqMobile.addEventListener('change',function(){clearTimeout(rT);rT=setTimeout(function(){renderMain();if(dlg.open)renderDlg();},120);});
   /* ---- company dialog ---- */
   var logoKeys={'امیداریا دارو':'omidarya','قاسم ایران':'ghasem','دی دارو':'day darou','شفاآراد':'shafaarad','سایه سمن':'saye saman','سونار تک دارو':'sonar tak','مشکات فارمد':'meshkat','یارا طب ثامن':'samen','مکمل کارن':'karen','بهداشت سلامت آوند فر':'avand far','مهبان دارو':'mahban','هجرت':'hejrat','ارمغان طبیعت':'armaghan tabiat','مشاء طب':'masha','داروگستر باریج اسانس':'barij','فردوس':'ferdos','البرز':'alborz','دارو گستر نخبگان':'nokhbeghan','سینا پخش':'sina','سها سروش':'sorosh','التیام':'eltiyam','ادورا':'adora','دارو پخش':'daroupakhsh','سها هلال':'soha','سلامت پخش هستی':'hasti','الیت':'elit','پونل برسام':'ponel','اکسیر':'exir','پورا پخش':'pora','ممتاز':'momtaz','رازی':'razi','دایا دارو':'daya','میلان پارس فارمد':'milan'};
   var logoFiles={};logos.forEach(function(l){logoFiles[l.name]=l.file;});
   function renderCompanies(list){
    grid.innerHTML='';list.forEach(function(c){
     var key=logoKeys[norm(c.name)],src=logoFiles[key],card=document.createElement('button');
     card.type='button';card.className='company-tile';card.setAttribute('aria-label','نمایش پرسنل '+c.name);
     if(src){var img=document.createElement('img');img.className='company-logo';img.src=src;img.alt='لوگوی '+c.name;img.loading='lazy';card.appendChild(img)}else{var fallback=document.createElement('span');fallback.className='company-logo company-logo-fallback';fallback.setAttribute('aria-hidden','true');fallback.textContent='★';card.appendChild(fallback)}
     var name=document.createElement('b');name.textContent=c.name;card.appendChild(name);
     var badge=document.createElement('span');badge.className='badge';badge.textContent=fa(c.personnel)+' نفر';card.appendChild(badge);
     card.addEventListener('click',function(){
      var list=P.records.filter(function(r){return norm(pick(r,'نام شرکت','company'))===norm(c.name)});
      title.textContent='پرسنل '+c.name;query.value='';state.dlg={key:'',dir:1};renderDlg();dlg.showModal();lockScroll(true);query.focus();
     });grid.appendChild(card);
    });document.getElementById('empty-state').hidden=list.length>0;
   }
   document.getElementById('personnel-count').textContent=fa(P.records.length);
   document.getElementById('company-count').textContent=fa(D.companies.length);
   renderCompanies(D.companies);
   document.getElementById('member-search').addEventListener('input',function(){var q=norm(this.value);renderCompanies(D.companies.filter(c=>!q||norm(c.name).includes(q)));});
   query.addEventListener('input',renderDlg);
   document.getElementById('personnel-close').addEventListener('click',function(){dlg.close()});
  }).catch(function(err){console.error('Unable to load members/personnel:',err);document.getElementById('empty-state').hidden=false;document.getElementById('empty-state').textContent='بارگذاری اطلاعات پرسنل با خطا مواجه شد؛ مسیر فایل‌های assets را بررسی کنید.';});
 }

 // logos scroll showcase (33 logos, arrows + smooth pointer drag, no dots/marquee)
 var win=document.querySelector('[data-showcase] .showcase-window');
 if(win){
  fetch('assets/logos.json').then(r=>r.json()).then(function(L){
   win.querySelector('[data-track]').innerHTML=L.map(function(l){
    return '<div class="logo-item" title="'+l.name+'"><img src="'+l.file+'" alt="'+l.name+'" loading="lazy" draggable="false"></div>';
   }).join('');
   // duplicate logos once for seamless CSS marquee loop
   var track=win.querySelector('[data-track]');
   track.innerHTML+=track.innerHTML;
   track.classList.add('marquee-on');
   // arrows: pause marquee briefly while clicking so manual scroll wins
   document.querySelectorAll('.showcase-arrow').forEach(function(btn){
    btn.addEventListener('mouseenter',function(){track.classList.remove('marquee-on');});
    btn.addEventListener('mouseleave',function(){track.classList.add('marquee-on');});
   });
   win.addEventListener('pointerdown',function(){track.classList.remove('marquee-on');});
   win.addEventListener('pointerup',function(){setTimeout(function(){track.classList.add('marquee-on');},600);});
   win.addEventListener('pointerleave',function(){setTimeout(function(){track.classList.add('marquee-on');},600);});
   document.querySelectorAll('.showcase-arrow').forEach(function(btn){
    btn.addEventListener('click',function(){
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