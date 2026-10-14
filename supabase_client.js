/* Supabase PostgREST client. The anon key is public; use appropriate RLS for sensitive deployments. */
(function(root){'use strict';
 const SUPABASE_URL="https://halyqkmvxpgxagmrvzpo.supabase.co";
 const SUPABASE_KEY="secret-e5ba8f24";
 const TABLES=new Set(['letters','invoices','transit_cheques','bounced_cheques','mafasa_letters','personnel','companies']);
 const headers={apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY};
 async function request(table,method,query,body,prefer){if(!TABLES.has(table))throw new Error('Unsupported Supabase table: '+table);const h={...headers};if(body!==undefined)h['Content-Type']='application/json';if(prefer)h.Prefer=prefer;const res=await fetch(SUPABASE_URL+'/rest/v1/'+table+(query?'?'+query:''),{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});const text=await res.text();let data=null;if(text){try{data=JSON.parse(text)}catch(_){data=text}}if(!res.ok){const e=new Error(data&&data.message||'Supabase request failed ('+res.status+')');e.status=res.status;e.details=data;throw e}return data}
 root.SupabaseClient={url:SUPABASE_URL,select:(t,q)=>request(t,'GET',q||'select=*'),insert:(t,rows)=>request(t,'POST','select=*',rows,'return=representation'),upsert:(t,rows,key)=>request(t,'POST','on_conflict='+encodeURIComponent(key||'id')+'&select=*',rows,'resolution=merge-duplicates,return=representation'),update:(t,id,p)=>request(t,'PATCH','id=eq.'+encodeURIComponent(id)+'&select=*',p,'return=representation'),remove:(t,id)=>request(t,'DELETE','id=eq.'+encodeURIComponent(id),undefined,'return=representation')};
})(typeof window!=='undefined'?window:globalThis);
