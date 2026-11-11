/* Sandika CMS local-first data loader. Static JSON remains the fallback. */
(function(w){'use strict';var ov={},baseData={},baseNews=[],letters=[];
function parse(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
function merge(a,b){if(Array.isArray(b))return b.slice();if(!b||typeof b!=='object')return b===undefined?a:b;var o=Object.assign({},a||{});Object.keys(b).forEach(function(k){o[k]=merge(o[k],b[k])});return o}
function load(){ov=parse('sandika_cms_overrides',{});return Promise.all([fetch('assets/data.json').then(function(r){return r.json()}).catch(function(){return {}}),fetch('assets/news.json').then(function(r){return r.json()}).catch(function(){return {news:[]}}),fetch('assets/letters.json').then(function(r){return r.json()}).catch(function(){return []})]).then(function(x){baseData=x[0];baseNews=x[1].news||[];letters=x[2]||[];return api})}
var api={ready:load(),get:function(k){var d=merge(baseData,ov);if(k==='news')return ov.news||baseNews;if(k==='letters')return parse('sandika_letters',letters);return k?d[k]:d},getOverrides:function(){return JSON.parse(JSON.stringify(ov))},saveOverrides:function(v){ov=merge(ov,v||{});localStorage.setItem('sandika_cms_overrides',JSON.stringify(ov));apply();return ov},merge:merge,apply:function(){return apply()}};
function apply(){if(!document)return;var title=ov.siteTitle;if(title){document.querySelectorAll('.marquee-text').forEach(function(n){n.textContent=title});var h=document.querySelector('h1');if(h&&document.body.classList.contains('home-page'))h.textContent=title;}
if(ov.aboutText){var p=document.querySelector('[data-cms-about]');if(p)p.textContent=ov.aboutText;}
if(Array.isArray(ov.missionTexts)){var boxes=document.querySelectorAll('[data-cms-mission]');ov.missionTexts.forEach(function(t,i){if(boxes[i])boxes[i].textContent=t})}}
api.ready.then(apply);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);w.SandikaCMS=api;
})(window);
