/* Sandika v59 client-side role gate. Static-site RBAC is UI protection only; use a server for sensitive data. */
(function () {
  'use strict';
  var KEY='sandika_user', LOGIN='login.html';
  var PAGE_ROLES={
    'cartable.html':['admin','board'],
    'external-letter.html':['admin'],
    'clearance.html':['admin'],
    'settings.html':['admin']
  };
  var LABELS={admin:'مدیر سیستم',manager:'مدیر سیستم',board:'عضو هیئت‌مدیره',member:'عضو عادی'};
  function normalizeRole(r){ r=String(r||'').toLowerCase(); return r==='manager'?'admin':(['admin','board','member'].indexOf(r)>=0?r:'member'); }
  function read(){
    var raw=null; try{raw=sessionStorage.getItem(KEY)||localStorage.getItem(KEY);}catch(e){}
    if(!raw)return null;
    try{var u=JSON.parse(raw);if(!u||typeof u.username!=='string'||!u.username.trim())return null;u.role=normalizeRole(u.role);return u;}catch(e){return null;}
  }
  function save(u){u.role=normalizeRole(u.role);var s=JSON.stringify(u);try{sessionStorage.setItem(KEY,s);localStorage.setItem(KEY,s);}catch(e){}}
  function clear(){try{sessionStorage.removeItem(KEY);localStorage.removeItem(KEY);sessionStorage.removeItem('sandika_authenticated');}catch(e){}}
  function allows(role,page){return !PAGE_ROLES[page]||PAGE_ROLES[page].indexOf(normalizeRole(role))>=0;}
  var page=(location.pathname.split('/').pop()||'index.html').toLowerCase(), user=read();
  window.SandikaAuth={read:read,save:save,clear:clear,isLoggedIn:function(){return !!read();},roleOf:function(u){var r=normalizeRole((u||read()||{}).role);return r==='admin'?'manager':r;},getRole:function(){return this.roleOf();},isManager:function(){return this.getRole()==='manager';},requireRole:function(roles,redirect){var r=this.getRole(),ok=Array.isArray(roles)?roles.indexOf(r)>=0:r===roles;if(!ok)location.replace(redirect||LOGIN);return ok;},label:function(r){return LABELS[normalizeRole(r)];},canAccess:function(p){return allows((read()||{}).role,p);},accountsKey:'sandika_role_accounts_v1'};
  if(PAGE_ROLES[page]&&(!user||!allows(user.role,page))){var dest=location.pathname.split('/').pop()||page;if(location.search)dest+=location.search;location.replace(LOGIN+'?denied=1&return='+encodeURIComponent(dest));return;}
  if(page===LOGIN&&user&&new URLSearchParams(location.search).get('force')!=='1'){location.replace(user.role==='admin'?'settings.html':user.role==='board'?'cartable.html':'members.html');return;}
  document.addEventListener('DOMContentLoaded',function(){
    var u=read(), role=u&&u.role;
    document.querySelectorAll('a[href]').forEach(function(a){var f=(a.getAttribute('href')||'').split(/[?#]/)[0].split('/').pop().toLowerCase();if(PAGE_ROLES[f]&&(!u||!allows(role,f))){a.hidden=true;a.setAttribute('aria-hidden','true');}});
    var action=document.querySelector('.login-btn-white');
    if(action){if(u){action.textContent='خروج ('+LABELS[role]+')';action.href='#logout';action.onclick=function(e){e.preventDefault();clear();location.replace(LOGIN);};}else{action.textContent='ورود کاربران';action.href=LOGIN;action.onclick=null;}}
    if(u&&page==='index.html'){var main=document.querySelector('main')||document.body, panel=document.createElement('section');panel.className='rbac-dashboard';panel.dir='rtl';panel.style.cssText='max-width:1100px;margin:20px auto;padding:18px;background:#fff;border:1px solid #d7e0e8;border-radius:12px;color:#163044';
      var links=role==='admin'?[['members.html','تأیید اعضا و بررسی درخواست‌ها'],['cartable.html','کارتابل مکاتبات'],['external-letter.html','نامه‌های برون‌سازمانی'],['clearance.html','مفاصاحساب'],['settings.html','تنظیمات و مدیریت حساب‌ها']]:role==='board'?[['cartable.html','کارتابل و بررسی موارد'],['members.html','مشاهده اعضا']]:[['members.html','مشاهده اطلاعات شخصی و ارسال درخواست ویرایش']];
      panel.innerHTML='<h2>درگاه '+LABELS[role]+'</h2><p>دسترسی فعال برای '+String(u.username).replace(/[&<>"']/g,'')+'</p><div></div>';var box=panel.querySelector('div');links.forEach(function(x){if(allows(role,x[0])){var a=document.createElement('a');a.href=x[0];a.textContent=x[1];a.style.cssText='display:inline-block;margin:6px;padding:10px 14px;background:#087fae;color:white;border-radius:7px;text-decoration:none';box.appendChild(a);}});main.insertBefore(panel,main.firstChild);}
  });
})();
