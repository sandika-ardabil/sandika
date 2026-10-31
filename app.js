// Sandika Elite v3
document.addEventListener('DOMContentLoaded',function(){
 // Accessible three-slide homepage carousel
 var hero=document.querySelector('[data-hero-slider]');
 if(hero){
  var slides=Array.from(hero.querySelectorAll('.hero-slide'));
  var dots=Array.from(document.querySelectorAll('.hero-dot'));
  var current=Math.max(0,slides.findIndex(function(s){return s.classList.contains('active')})),timer=null,delay=5500;
  function showHero(n){
   if(!slides.length)return;
   current=(n+slides.length)%slides.length;
   slides.forEach(function(s,k){var active=k===current;s.classList.toggle('active',active);s.setAttribute('aria-hidden',active?'false':'true');});
   dots.forEach(function(d,k){var active=k===current;d.classList.toggle('active',active);if(active)d.setAttribute('aria-current','true');else d.removeAttribute('aria-current');});
  }
  function stop(){if(timer){clearInterval(timer);timer=null;}}
  function start(){stop();if(slides.length>1&&!document.hidden)timer=setInterval(function(){showHero(current+1);},delay);}
  function move(n){showHero(n);start();}
  var prev=document.querySelector('.hero-prev'),next=document.querySelector('.hero-next');
  if(prev)prev.addEventListener('click',function(){move(current-1);});
  if(next)next.addEventListener('click',function(){move(current+1);});
  dots.forEach(function(d,k){d.addEventListener('click',function(){move(k);});});
  hero.addEventListener('mouseenter',stop);hero.addEventListener('mouseleave',start);
  hero.addEventListener('focusin',stop);hero.addEventListener('focusout',function(e){if(!hero.contains(e.relatedTarget))start();});
  document.addEventListener('visibilitychange',function(){document.hidden?stop():start();});
  showHero(current);start();
 }
 // nav active
 var page=location.pathname.split('/').pop()||'index.html';
 document.querySelectorAll('.site-header nav a').forEach(a=>{if(a.getAttribute('href')===page)a.classList.add('active')});

 // v35 Floating Island indicator: active item + hover preview with responsive geometry.
 document.querySelectorAll('.header-bottom-nav').forEach(function(nav){
  var indicator=nav.querySelector('.pill-indicator'); if(!indicator)return;
  var links=Array.from(nav.querySelectorAll('a'));
  function moveTo(link){if(!link)return;var nr=nav.getBoundingClientRect(),lr=link.getBoundingClientRect();nav.style.setProperty('--pill-left',(lr.left-nr.left+nav.scrollLeft)+'px');nav.style.setProperty('--pill-width',lr.width+'px');nav.classList.add('pill-ready');}
  var active=nav.querySelector('a.active')||links.find(function(a){return a.getAttribute('href')===(location.pathname.split('/').pop()||'index.html')})||links[0];
  links.forEach(function(a){a.addEventListener('mouseenter',function(){moveTo(a)});a.addEventListener('focus',function(){moveTo(a)});});
  nav.addEventListener('mouseleave',function(){moveTo(active)});nav.addEventListener('focusout',function(e){if(!nav.contains(e.relatedTarget))moveTo(active)});
  requestAnimationFrame(function(){moveTo(active)});window.addEventListener('resize',function(){moveTo(nav.matches(':hover')?(nav.querySelector(':hover')||active):active)});
 });
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
   // Toggle view: default shows only name + job title; second tab shows all fields.
   var toggleWrap=document.createElement('div');toggleWrap.className='personnel-view-toggle';
   var btnBasic=document.createElement('button');btnBasic.type='button';btnBasic.className='view-toggle-btn active';btnBasic.textContent='نام و سمت';
   var btnFull=document.createElement('button');btnFull.type='button';btnFull.className='view-toggle-btn';btnFull.textContent='اطلاعات کامل';
   toggleWrap.appendChild(btnBasic);toggleWrap.appendChild(btnFull);
   var currentView='basic';btnBasic.addEventListener('click',function(){currentView='basic';btnBasic.classList.add('active');btnFull.classList.remove('active');renderPersonnel(lastList);});
   btnFull.addEventListener('click',function(){currentView='full';btnFull.classList.add('active');btnBasic.classList.remove('active');renderPersonnel(lastList);});
   var lastList=[];var personDlg=null;
 function openPerson(r){
  if(!personDlg){
   personDlg=document.createElement('dialog');personDlg.className='person-detail-dialog';
   personDlg.innerHTML='<div class="person-detail-head"><h3 class="person-detail-name"></h3><button type="button" class="person-detail-close" aria-label="بستن">×</button></div><div class="person-detail-body"></div>';
   document.body.appendChild(personDlg);
   personDlg.querySelector('.person-detail-close').addEventListener('click',function(){personDlg.close()});
   personDlg.addEventListener('click',function(e){if(e.target===personDlg)personDlg.close()});
  }
  personDlg.querySelector('.person-detail-name').textContent=r['نام و نام خانوادگی']||'—';
  var body=personDlg.querySelector('.person-detail-body');body.innerHTML='';
  fields.forEach(function(f){
   if(f==='نام و نام خانوادگی')return;
   var v=r[f]==null?'':String(r[f]);
   if(!v.trim())return;
   var line=document.createElement('div');line.className='person-detail-row';
   var k=document.createElement('span');k.className='person-detail-key';k.textContent=f;
   var val=document.createElement('span');val.className='person-detail-val';val.textContent=v;
   line.appendChild(k);line.appendChild(val);body.appendChild(line);
  });
  personDlg.showModal();
 }
 function renderPersonnel(list){
  lastList=list;
  var q=norm(query.value).toLocaleLowerCase();
  var filtered=list.filter(function(r){return !q||fields.some(function(f){return norm(r[f]).toLocaleLowerCase().includes(q)});});
  total.textContent=fa('نمایش '+filtered.length+' نفر از '+list.length+' نفر');
  var basicFields=['نام و نام خانوادگی','سمت شغلی'];
  var viewFields=currentView==='basic'?fields.filter(function(f){return basicFields.indexOf(f)>=0;}):fields;
  var table=document.createElement('table');table.className='personnel-table compact';
  var thead=document.createElement('thead'),tr=document.createElement('tr');
  viewFields.forEach(function(f){var th=document.createElement('th');th.textContent=f;tr.appendChild(th)});
  var thA=document.createElement('th');thA.textContent='مشاهده اطلاعات';thA.className='col-action';tr.appendChild(thA);
  thead.appendChild(tr);table.appendChild(thead);
  var tbody=document.createElement('tbody');
  filtered.forEach(function(r){
   var row=document.createElement('tr');
   viewFields.forEach(function(f){var td=document.createElement('td');td.textContent=r[f]==null?'':String(r[f]);row.appendChild(td)});
   var tdA=document.createElement('td');tdA.className='col-action';
   var btn=document.createElement('button');btn.type='button';btn.className='person-view-btn';btn.textContent='مشاهده اطلاعات';
   btn.addEventListener('click',function(e){e.stopPropagation();openPerson(r)});
   tdA.appendChild(btn);row.appendChild(tdA);
   tbody.appendChild(row);
  });
  table.appendChild(tbody);wrap.replaceChildren(table);empty.hidden=filtered.length>0;
 }
// Insert the toggle above the search box, inside the dialog header area.
   var headHost=query.parentNode;
   headHost.insertBefore(toggleWrap,query);
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
   var authoritativeSites={"adora":"https://adorateb.com/","alborz":"https://alborzdc.com/","armaghan tabiat":"https://armaghandistribution.com/","avand far":"https://iranavandfar.com/","barij":"https://barijessence.com/","daroupakhsh":"https://www.ondpline.com/","day darou":"https://daydarou.ir/","daya":"https://www.dayadarou.ir/","elit":"https://www.eliteco.ir/","eltiyam":"https://eltiampharm.com/","exir":"https://exirpd.com/","ferdos":"https://ferdowsdco.com/","ghasem":"https://www.ghasemiran.org/","hasti":"https://salamatpakhsh.com/","hejrat":"https://www.hejratco.com/","karen":"https://karendistribution.com/","mahban":"https://mahbangroup.com/","masha":"https://www.mashateb.com/","meshkat":"https://meshcutpharmed.com/","milan":"https://milanpars.com/","momtaz":"https://momtaz.ir/","nokhbeghan":"https://nokhbegandc.com/","omidarya":"https://linka.ir/company/19955af/%D8%A7%D9%85%DB%8C%D8%AF-%D8%A2%D8%B1%DB%8C%D8%A7-%D8%AF%D8%A7%D8%B1%D9%88","ponel":"https://poonelbersam.com/","pora":"https://pourapakhsh.com/","razi":"https://www.razico.ir/","samen":"https://yts.ir/","saye saman":"https://www.sayesaman.com/fa","shafaarad":"https://www.shafaarad.ir/","sina":"https://cinnadco.com/","soha":"https://sohahelal.ir/","sonar tak":"https://rasmio.com/company/10240084272/%D9%BE%D8%AE%D8%B4%20%D8%B3%D9%88%D9%86%D8%A7%D8%B1%20%D8%AA%DA%A9%20%D8%AF%D8%A7%D8%B1%D9%88/","sorosh":"https://rasmio.com/company/14009220500/%D8%B3%D9%87%D8%A7%20%D8%B3%D8%B1%D9%88%D8%B4%20%D9%86%D9%88%DB%8C%D9%86%20%D8%A2%D8%B3%D9%85%D8%A7%D9%86/"};
   var item=function(l){var u=authoritativeSites[l.name]||l.site||'#';return '<a class="logo-item" href="'+u+'" target="_blank" rel="noopener" title="'+l.name+'"><img src="'+l.file+'" alt="'+l.name+'" loading="lazy" draggable="false"></a>';};
   var trackEl=win.querySelector('[data-track]');
   trackEl.innerHTML=L.map(item).join('')+L.map(item).join(''); // duplicate for seamless loop
   var half=0;
   function measure(){half=trackEl.scrollWidth/2;}
   window.addEventListener('resize',measure);setTimeout(measure,300);
   // automatic leftward scroll (pauses on hover/drag)
   var paused=false,autoRaf=null;
   win.addEventListener('mouseenter',function(){paused=true;});
   win.addEventListener('mouseleave',function(){paused=false;});
   win.addEventListener('pointerdown',function(){paused=true;});
   function auto(){
    if(!paused&&!down&&half>0){
     win.scrollLeft+=0.6; // move left
     if(win.scrollLeft>=half)win.scrollLeft-=half;
    }
    autoRaf=requestAnimationFrame(auto);
   }
   auto();
   document.querySelectorAll('.showcase-arrow').forEach(function(btn){
    btn.addEventListener('click',function(){
     if(win.dataset.dragged==='1')return;
     win.scrollBy({left:Number(btn.dataset.dir)*360,behavior:'smooth'});
    });
   });
   // pointer drag with threshold + rAF + click suppression, snap kept when idle
   var down=false,startX=0,startScroll=0,moved=false,raf=null,vel=0,lastX=0,lastT=0;
   var suppressNextDragClick=false,dragClickTimer=null;
   win.addEventListener('pointerdown',function(e){
    // Do not capture the pointer here: capture retargets a normal logo click
    // to the scrolling window instead of the anchor in several browsers.
    down=true;moved=false;startX=e.clientX;startScroll=win.scrollLeft;
    lastX=e.clientX;lastT=performance.now();vel=0;
    win.classList.remove('dragging');
   });
   document.addEventListener('pointermove',function(e){
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
     suppressNextDragClick=true;
     if(dragClickTimer)clearTimeout(dragClickTimer);
     dragClickTimer=setTimeout(function(){suppressNextDragClick=false;dragClickTimer=null;},500);
     // momentum then snap
     var target=win.scrollLeft - vel*260;
     win.scrollTo({left:Math.max(0,target),behavior:'smooth'});
     setTimeout(function(){win.dataset.dragged='0';},80);
    }
   }
   win.addEventListener('pointerup',endDrag);
   win.addEventListener('pointercancel',endDrag);
   win.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a.logo-item');
    if(suppressNextDragClick){
     suppressNextDragClick=false;
     if(dragClickTimer){clearTimeout(dragClickTimer);dragClickTimer=null;}
     if(a){e.preventDefault();e.stopPropagation();}
     return;
    }
    if(a){
     // Open explicitly because carousel drag handling can cancel native anchor navigation.
     e.preventDefault();
     window.open(a.href,'_blank','noopener');
    }
   },true);
   win.addEventListener('dragstart',function(e){e.preventDefault();});
  });
 }

 // ===== News module: loads assets/news.json + localStorage fallback, instant rendering =====
 var newsList=document.getElementById('news-list');
 if(newsList){
  var LS_KEY='sandika_news_items';
  function lsGet(){try{return JSON.parse(localStorage.getItem(LS_KEY))||[]}catch(e){return []}}
  function lsSet(a){try{localStorage.setItem(LS_KEY,JSON.stringify(a))}catch(e){}}
  function faDigits(s){return String(s).replace(/\d/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[d]})}
  var baseNews=[],localNews=[];
  function allNews(){return baseNews.concat(localNews)}
  function render(){
   var items=allNews();
   if(!items.length){newsList.innerHTML='<p class="news-empty">هیچ خبری ثبت نشده است.</p>';return}
   newsList.innerHTML='';
   items.forEach(function(n){
    var art=document.createElement('article');art.className='glass-card full-news';
    if(n.image){var img=document.createElement('img');img.src=n.image;img.alt=n.title||'';img.loading='lazy';art.appendChild(img)}
    var div=document.createElement('div');
    var t=document.createElement('time');t.textContent=n.date||'';
    var h=document.createElement('h2');h.textContent=n.title||'';
    var p=document.createElement('p');p.textContent=n.content||'';
    if(n._local){var del=document.createElement('button');del.type='button';del.className='news-delete-btn';del.textContent='حذف';
     del.addEventListener('click',function(){if(confirm('این خبر حذف شود؟')){localNews=lsGet().filter(function(x){return x.id!==n.id});lsSet(localNews);renderNewsUI();}});
     var tag=document.createElement('span');tag.className='news-local-tag';tag.textContent='افزوده‌شده محلی';
     div.appendChild(t);div.appendChild(tag);}
    else div.appendChild(t);
    div.appendChild(h);div.appendChild(p);if(n._local)div.appendChild(del);
    art.appendChild(div);newsList.appendChild(art);
   });
  }
  function renderNewsUI(){render();if(window.__renderNewsAdmin)window.__renderNewsAdmin();}

  fetch('assets/news.json').then(function(r){if(!r.ok)throw Error('news.json');return r.json()})
   .then(function(J){baseNews=(J.news||[]);renderNewsUI();})
   .catch(function(err){console.error('Unable to load news.json:',err);renderNewsUI();});
  localNews=lsGet();
  if(baseNews.length||localNews.length)renderNewsUI(); // instant paint from cache/LS

  // --- Admin modal ---
  var modal=document.getElementById('news-admin-modal');
  if(modal){
   var fTitle=document.getElementById('news-f-title'),fDate=document.getElementById('news-f-date'),
       fContent=document.getElementById('news-f-content'),fSel=document.getElementById('news-f-imgsel'),
       fUrl=document.getElementById('news-f-imgurl'),fFile=document.getElementById('news-f-imgfile'),
       preview=document.getElementById('news-img-preview'),mList=document.getElementById('news-managed-list'),
       saveBtn=document.getElementById('news-save-btn'),cancelEdit=document.getElementById('news-cancel-edit');
   var editingId=null,dataUrl=null,editingImage='';
   document.getElementById('news-admin-btn').addEventListener('click',function(){modal.showModal();renderAdminList();});
   document.getElementById('news-modal-close').addEventListener('click',function(){modal.close();});
   modal.addEventListener('click',function(e){if(e.target===modal)modal.close();});
   fSel.addEventListener('change',function(){
    var v=fSel.value;
    fUrl.hidden=v!=='__url__';
    fFile.hidden=v!=='__file__';
    if(v==='__file__'){dataUrl=null;fFile.click();}
    else if(v==='__url__'){dataUrl=null;updatePreview();}
    else {dataUrl=null;fUrl.value='';updatePreview();}
   });
   fUrl.addEventListener('input',updatePreview);
   fFile.addEventListener('change',function(){
    var file=fFile.files[0];if(!file)return;
    var rd=new FileReader();rd.onload=function(){dataUrl=rd.result;fSel.dataset.picked=file.name;updatePreview();};rd.readAsDataURL(file);
   });
   function currentImage(){
    var v=fSel.value;
    if(v==='__url__')return fUrl.value.trim();
    if(dataUrl)return dataUrl;
    if(v&&v!=='__file__'&&v!=='__url__')return v;
    if(editingId!=null&&editingImage)return editingImage;
    return '';
   }
   function updatePreview(){var src=currentImage();if(src){preview.src=src;preview.hidden=false;}else preview.hidden=true;}
   function resetForm(){editingId=null;dataUrl=null;editingImage='';editingImage='';delete fSel.dataset.picked;fTitle.value='';fDate.value='';fContent.value='';fSel.value='';fUrl.value='';fUrl.hidden=true;fFile.value='';fFile.hidden=true;preview.hidden=true;saveBtn.textContent='افزودن خبر';cancelEdit.hidden=true;renderAdminList();}
   cancelEdit.addEventListener('click',resetForm);
   window.__renderNewsAdmin=function(){if(modal.open)renderAdminList();};
   function renderAdminList(){
    mList.innerHTML='';
    var lbl=document.createElement('p');lbl.className='news-managed-title';lbl.textContent='خبرهای موجود ('+faDigits(allNews().length)+'):';
    mList.appendChild(lbl);
    allNews().slice().reverse().forEach(function(n){
     var row=document.createElement('div');row.className='news-managed-row';
     var b=document.createElement('span');b.textContent='• '+(n.title||'—');row.appendChild(b);
     var acts=document.createElement('span');
     if(n._local){
      var eb=document.createElement('button');eb.type='button';eb.textContent='ویرایش';
      eb.addEventListener('click',function(){
       editingId=n.id;editingImage=n.image||'';fTitle.value=n.title||'';fDate.value=n.date||'';fContent.value=n.content||'';
       dataUrl=null;fSel.value='';fUrl.value='';fUrl.hidden=true;fFile.hidden=true;if(editingImage){preview.src=editingImage;preview.hidden=false}else preview.hidden=true;
       saveBtn.textContent='ذخیره تغییرات';cancelEdit.hidden=false;fTitle.focus();
      });
      acts.appendChild(eb);
      var db=document.createElement('button');db.type='button';db.textContent='حذف';
      db.addEventListener('click',function(){localNews=lsGet().filter(function(x){return x.id!==n.id});lsSet(localNews);resetForm();renderNewsUI();});
      acts.appendChild(db);
     }
     row.appendChild(acts);mList.appendChild(row);
    });
   }
   document.getElementById('news-admin-form').addEventListener('submit',function(e){
    e.preventDefault();
    var item={title:fTitle.value.trim(),date:fDate.value.trim(),content:fContent.value.trim(),image:currentImage()};
    if(!item.title||!item.date||!item.content)return;
    var arr=lsGet();
    if(editingId!=null){
     arr=arr.map(function(x){return x.id===editingId?Object.assign({},x,item):x});
    }else{
     item.id=Date.now();item._local=true;arr.push(item);
    }
    lsSet(arr);localNews=arr;resetForm();renderNewsUI();
   });
  }
 }
});