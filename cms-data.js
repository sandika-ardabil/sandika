/* Sandika CMS local-first data loader. Static JSON remains the fallback. */
(function(w){'use strict';var ov={},baseData={},baseNews=[],letters=[];
function parse(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
function merge(a,b){if(Array.isArray(b))return b.slice();if(!b||typeof b!=='object')return b===undefined?a:b;var o=Object.assign({},a||{});Object.keys(b).forEach(function(k){o[k]=merge(o[k],b[k])});return o}
function load(){ov=parse('sandika_cms_overrides',{});return Promise.all([fetch('assets/data.json').then(function(r){return r.json()}).catch(function(){return {}}),fetch('assets/news.json').then(function(r){return r.json()}).catch(function(){return {news:[]}}),fetch('assets/letters.json').then(function(r){return r.json()}).catch(function(){return []})]).then(function(x){baseData=x[0];baseNews=x[1].news||[];letters=x[2]||[];return api})}
var api={ready:load(),get:function(k){var d=merge(baseData,ov);if(k==='news')return ov.news||baseNews;if(k==='letters')return parse('sandika_letters',letters);return k?d[k]:d},getOverrides:function(){return JSON.parse(JSON.stringify(ov))},saveOverrides:function(v){ov=merge(ov,v||{});var serialized=JSON.stringify(ov);try{localStorage.setItem('sandika_cms_overrides',serialized)}catch(e){try{sessionStorage.setItem('sandika_cms_overrides',serialized)}catch(ignore){/* Keep the update in memory when browser storage is unavailable. */}}apply();return ov},merge:merge,apply:function(){return apply()}};
function apply(){if(!document)return;var title=ov.siteTitle;if(title){document.querySelectorAll('.marquee-text').forEach(function(n){n.textContent=title});var h=document.querySelector('h1');if(h&&document.body.classList.contains('home-page'))h.textContent=title;}
if(ov.aboutText){var p=document.querySelector('[data-cms-about]');if(p)p.textContent=ov.aboutText;}
if(Array.isArray(ov.missionTexts)){var boxes=document.querySelectorAll('[data-cms-mission]');ov.missionTexts.forEach(function(t,i){if(boxes[i])boxes[i].textContent=t})}}

/* v62 visual editor bridge: accept live CMS updates only from the same-origin parent admin. */
w.addEventListener('message',function(event){
 if(event.source!==w.parent || (event.origin!==w.location.origin && !(w.location.origin==='null' && event.origin==='null')))return;
 var msg=event.data;if(!msg||msg.type!=='SANDIKA_CMS_UPDATE'||!msg.overrides||typeof msg.overrides!=='object')return;
 api.saveOverrides(msg.overrides);
});
api.ready.then(apply);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);w.SandikaCMS=api;
})(window);
