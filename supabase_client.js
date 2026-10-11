/* Supabase PostgREST client: bounded requests; failures reject promptly for local-first fallback. */
(function(root){'use strict';
  const SUPABASE_URL = "https://halyqkmvxpgxagmrvzpo.supabase.co";
  const SUPABASE_KEY = "secret-e5ba8f24";
  const TABLES = new Set(['letters','invoices','transit_cheques','bounced_cheques','mafasa_letters','personnel','companies']);
  const DEFAULT_TIMEOUT = 5000;
  const baseHeaders = { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY };
  function assertTable(table){if(!TABLES.has(table)) throw new Error('Unsupported Supabase table: '+table);}
  async function request(table,method,query,body,prefer,options){
    assertTable(table); options=options||{};
    const controller=typeof AbortController==='function'?new AbortController():null;
    const timeout=Math.max(250,Number(options.timeout)||DEFAULT_TIMEOUT);
    const timer=controller?setTimeout(()=>controller.abort(),timeout):null;
    const headers=Object.assign({},baseHeaders,options.headers||{});
    if(body!==undefined) headers['Content-Type']='application/json';
    if(prefer) headers.Prefer=prefer;
    try{
      const response=await fetch(SUPABASE_URL+'/rest/v1/'+table+(query?'?'+query:''),{
        method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller?controller.signal:undefined,
        cache:'no-store'
      });
      const text=await response.text();let data=null;
      if(text){try{data=JSON.parse(text)}catch(_){data=text}}
      if(!response.ok){const err=new Error(data&&data.message||('Supabase request failed ('+response.status+')'));err.status=response.status;err.details=data;throw err;}
      return data;
    }catch(err){if(err&&err.name==='AbortError'){const e=new Error('Supabase request timed out after '+timeout+'ms');e.name='TimeoutError';throw e;}throw err;}
    finally{if(timer)clearTimeout(timer);}
  }
  root.SupabaseClient={url:SUPABASE_URL,timeout:DEFAULT_TIMEOUT,tables:Array.from(TABLES),
    select:(t,q,opts)=>request(t,'GET',q||'select=*',undefined,null,opts),
    insert:(t,rows,opts)=>request(t,'POST','select=*',rows,'return=representation',opts),
    upsert:(t,rows,key,opts)=>request(t,'POST','on_conflict='+encodeURIComponent(key||'id')+'&select=*',rows,'resolution=merge-duplicates,return=representation',opts),
    update:(t,id,patch,opts)=>request(t,'PATCH','id=eq.'+encodeURIComponent(id)+'&select=*',patch,'return=representation',opts),
    remove:(t,id,opts)=>request(t,'DELETE','id=eq.'+encodeURIComponent(id),undefined,'return=representation',opts),
    request
  };
})(typeof window!=='undefined'?window:globalThis);
