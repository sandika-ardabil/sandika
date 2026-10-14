/* Safe bootstrap for personnel/companies: local data remains authoritative fallback; cloud additions are merged, never replace source rows. */
(function(w){'use strict';const client=()=>w.SupabaseClient;const keyOf=p=>String(p&&p['کد ملی']||'').trim()||('row:'+JSON.stringify(p));const companyKey=c=>String(c&&c.name||'').trim().toLocaleLowerCase('fa');
 async function get(table){const c=client();if(!c)return [];try{return await c.select(table,'select=*&order=created_at.asc')}catch(e){console.warn('Supabase '+table+' unavailable; retaining local data:',e.message);return null}}
 async function saveRows(table,rows){const c=client();if(!c||!rows.length)return;for(let i=0;i<rows.length;i+=100){try{await c.upsert(table,rows.slice(i,i+100),'record_key')}catch(e){console.warn('Supabase '+table+' seed deferred:',e.message);return}}}
 async function bootstrap(data){if(!data||!Array.isArray(data.personnel))return data;const seedPeople=data.personnel.slice(), seedCompanies=Array.isArray(data.companies)?data.companies.slice():[];
  const [remoteP,remoteC]=await Promise.all([get('personnel'),get('companies')]);
  const toRow=(r,k)=>({record_key:k,record_data:r});
  // Always upsert source rows: an empty remote table gets seeded, and absent records in a nonempty table are restored.
  await saveRows('personnel',seedPeople.map(r=>toRow(r,keyOf(r))));
  await saveRows('companies',seedCompanies.map(r=>toRow(r,companyKey(r))));
  const mergedP=seedPeople.slice(),seenP=new Set(mergedP.map(keyOf));
  if(Array.isArray(remoteP))for(const row of remoteP){const r=row.record_data;if(r&&typeof r==='object'&&!seenP.has(keyOf(r))){mergedP.push(r);seenP.add(keyOf(r))}}
  const mergedC=seedCompanies.slice(),seenC=new Set(mergedC.map(companyKey));
  if(Array.isArray(remoteC))for(const row of remoteC){const r=row.record_data;if(r&&typeof r==='object'&&!seenC.has(companyKey(r))){mergedC.push(r);seenC.add(companyKey(r))}}
  data.personnel=mergedP;data.companies=mergedC;data.meta=data.meta||{};data.meta.total_personnel=mergedP.length;data.meta.total_companies=mergedC.length;return data;
 }
 async function savePerson(record){const c=client();if(!c)return;try{await c.upsert('personnel',[{record_key:keyOf(record),record_data:record}],'record_key')}catch(e){console.warn('Personnel cloud save deferred:',e.message)}}
 async function deletePerson(record){/* retain records in cloud; soft delete avoids accidental data loss */const c=client();if(!c)return;const row={...record,_deleted:true};try{await c.upsert('personnel',[{record_key:keyOf(record),record_data:row}],'record_key')}catch(e){console.warn('Personnel cloud delete deferred:',e.message)}}
 w.PersonnelSync={bootstrap,savePerson,deletePerson};
})(typeof window!=='undefined'?window:globalThis);
if (window.PersonnelSync && !window.PersonnelSync.loadData) {
  window.PersonnelSync.loadData = function() {
    if (typeof window.PersonnelSync.bootstrap === 'function') {
      return window.PersonnelSync.bootstrap();
    }
    return Promise.resolve([]);
  };
}
