/* letters-sync-unified.js — ماژول یکپارچه همگام‌سازی نامه‌ها از Supabase */
(function(){
  const SUPABASE_URL='https://halyqkmvxpgxagmrvzpo.supabase.co';
  const SUPABASE_ANON_KEY='secret-f94931a6';
  const REST=SUPABASE_URL+'/rest/v1/';
  const HEADERS={'apikey':SUPABASE_ANON_KEY,'Authorization':'Bearer '+SUPABASE_ANON_KEY,'Accept':'application/json'};

  const pick=(row,keys,def)=>{for(const k of keys){if(row[k]!==undefined&&row[k]!==null&&String(row[k]).trim()!=='')return row[k];}return def;};

  function mapLetter(row, src){
    const status=pick(row,['status'],'در دست بررسی');
    const direction=pick(row,['direction'], src==='mafasa_requests'?'صادره':'وارده');
    const created=row.created_at||row.updated_at||'';
    return {
      _id:String(pick(row,['id','uuid'],'sync:'+src+':'+(row.id||Math.random()))),
      _src:src,
      _created: Date.parse(created)||Date.now(),
      tracking_no:String(pick(row,['tracking_no','trackingNo','tracking_code','id'],'')||''),
      direction:direction,
      date:pick(row,['date','letter_date','created_at'],''),
      subject:pick(row,['subject','title','request_type','reason'],'بدون موضوع'),
      sender:pick(row,['sender','sender_name','applicant_name','pharmacy_name','owner_name'],''),
      receiver:pick(row,['receiver','recipient_name'],''),
      company:pick(row,['company','company_name'],''),
      status:status,
      type:pick(row,['letter_type','type'],''),
      description:pick(row,['description','attachment_desc','address'],''),
      attachments:pick(row,['attachment','attachments','attachment_desc'],'')
    };
  }

  async function fetchTable(name){
    try{
      const r=await fetch(REST+name+'?select=*&order=created_at.desc',{headers:HEADERS});
      if(!r.ok){console.warn('[letters-sync] '+name+' HTTP '+r.status);return [];}
      const j=await r.json();
      return Array.isArray(j)?j:[];
    }catch(e){console.warn('[letters-sync] '+name+' failed',e);return [];}
  }

  let syncing=false;
  async function syncLetters(opts){
    opts=opts||{};
    if(syncing)return 0;
    syncing=true;
    try{
      const tables=[['letters',true],['mafasa_letters',true],['mafasa_requests',true]];
      const mapped=[];
      for(const [name] of tables){
        const rows=await fetchTable(name);
        rows.forEach(r=>mapped.push(mapLetter(r,name)));
      }
      if(typeof window!=='undefined'&&typeof window.lettersSyncMerge==='function'){
        window.lettersSyncMerge(mapped,opts);
      }else{
        console.warn('[letters-sync] lettersSyncMerge تعریف نشده است.');
      }
      if(opts.silent!==false)console.log('[letters-sync] همگام شد:',mapped.length,'نامه');
      return mapped.length;
    }finally{syncing=false;}
  }

  window.LettersSync={sync:syncLetters,mapLetter,fetchTable,SUPABASE_URL,SUPABASE_ANON_KEY};
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>syncLetters({silent:true}),300));
})();