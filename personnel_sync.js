/* Hybrid personnel bootstrap: data.json is primary, localStorage cache is fallback; cloud writes are best-effort. */
(function(w){'use strict';
 const CACHE='personnel_data_cache_v1',client=()=>w.SupabaseClient;
 const safeRead=()=>{try{const v=JSON.parse(w.localStorage.getItem(CACHE)||'null');return v&&Array.isArray(v.personnel)?v:null}catch(_){return null}};
 const safeWrite=v=>{try{w.localStorage.setItem(CACHE,JSON.stringify(v))}catch(e){console.warn('Personnel cache unavailable:',e.message)}};
 const keyOf=p=>String(p&& (p['کد ملی']||p.national_id||p.nationalId)||'').trim()||('row:'+JSON.stringify(p));
 const companyKey=c=>String(c&&(c.name||c.company_name||c['نام شرکت'])||'').trim().toLocaleLowerCase('fa')||('row:'+JSON.stringify(c));
 async function loadData(url){
   try{const res=await fetch(url||'data.json',{cache:'no-store'});if(!res.ok)throw new Error('HTTP '+res.status);const d=await res.json();if(!d||!Array.isArray(d.personnel))throw new Error('data.json has no personnel array');safeWrite(d);return d;}
   catch(err){const cached=safeRead();if(cached){console.warn('data.json unavailable; loaded cached personnel:',err.message);return cached;}throw err;}
 }
 async function get(table){const c=client();if(!c)return null;try{return await c.select(table,'select=*&limit=5000')}catch(e){console.warn('Supabase '+table+' unavailable; retaining local records:',e.message);return null}}
 async function saveRows(table,rows){const c=client();if(!c||!rows.length)return;for(let i=0;i<rows.length;i+=100){try{await c.upsert(table,rows.slice(i,i+100),'record_key')}catch(e){console.warn('Supabase '+table+' seed deferred (configure record_key unique column):',e.message);return;}}}
 async function bootstrap(data){if(!data||!Array.isArray(data.personnel))return data;
   const originalP=data.personnel.slice(),originalC=Array.isArray(data.companies)?data.companies.slice():[];
   // Store payload in record_data so existing source fields need no destructive schema migration.
   const toRows=(arr,key)=>arr.map(record=>({record_key:key(record),record_data:record}));
   const [remoteP,remoteC]=await Promise.all([get('personnel'),get('companies')]);
   await Promise.all([saveRows('personnel',toRows(originalP,keyOf)),saveRows('companies',toRows(originalC,companyKey))]);
   const people=originalP.slice(),seenP=new Set(people.map(keyOf));
   if(Array.isArray(remoteP))for(const row of remoteP){const p=row.record_data;if(p&&typeof p==='object'&&!seenP.has(keyOf(p))){people.push(p);seenP.add(keyOf(p));}}
   const companies=originalC.slice(),seenC=new Set(companies.map(companyKey));
   if(Array.isArray(remoteC))for(const row of remoteC){const c=row.record_data;if(c&&typeof c==='object'&&!seenC.has(companyKey(c))){companies.push(c);seenC.add(companyKey(c));}}
   data.personnel=people;data.companies=companies;data.meta=data.meta||{};data.meta.total_personnel=people.length;data.meta.total_companies=companies.length;safeWrite(data);return data;
 }
 async function save(table,record,key){const c=client();if(!c)return;try{await c.upsert(table,[{record_key:key,record_data:record}],'record_key')}catch(e){console.warn(table+' cloud save deferred:',e.message)}}
 const api={loadData,bootstrap,savePerson:r=>save('personnel',r,keyOf(r)),saveCompany:r=>save('companies',r,companyKey(r)),
   deletePerson:r=>save('personnel',Object.assign({},r,{_deleted:true}),keyOf(r)),getCache:safeRead};
 w.PersonnelSync=api;
})(typeof window!=='undefined'?window:globalThis);
