/* Local-first accounting adapter. Browser storage updates are immediate; bounded cloud calls never block indefinitely. */
(function(root){'use strict';
 const client=()=>root.SupabaseClient, LETTERS_KEY='portal_letters_v1', MAFASA_KEY='mafasa_accounting_records_v1', PENDING='accounting_pending_v1';
 const TYPES={
  invoices:{table:'invoices',toRow:r=>({factor_number:r.invoiceNumber||r.factor_number||'',date:r.invoiceDate||r.date||'',amount:Number(r.amount)||0,receiver_name:r.receiptName||r.receiver_name||''}),fromRow:r=>({invoiceNumber:r.factor_number||'',invoiceDate:r.date||'',amount:Number(r.amount)||0,receiptName:r.receiver_name||'',_remoteId:r.id})},
  transitCheques:{table:'transit_cheques',toRow:r=>({cheque_number:r.chequeNumber||r.cheque_number||'',date:r.date||'',amount:Number(r.amount)||0,owner_name:r.ownerName||r.owner_name||''}),fromRow:r=>({chequeNumber:r.cheque_number||'',date:r.date||'',amount:Number(r.amount)||0,ownerName:r.owner_name||'',_remoteId:r.id})},
  bouncedCheques:{table:'bounced_cheques',toRow:r=>({cheque_number:r.chequeNumber||r.cheque_number||'',date:r.date||'',amount:Number(r.amount)||0,owner_name:r.ownerName||r.owner_name||''}),fromRow:r=>({chequeNumber:r.cheque_number||'',date:r.date||'',amount:Number(r.amount)||0,ownerName:r.owner_name||'',_remoteId:r.id})},
  letters:{table:'mafasa_letters',toRow:r=>({audience:r.recipientName||r.audience||'',letter_number:r.letterNumber||r.letter_number||'',date:r.date||'',attachment_desc:r.attachment||r.attachment_desc||''}),fromRow:r=>({recipientName:r.audience||'',letterNumber:r.letter_number||'',date:r.date||'',attachment:r.attachment_desc||'',_remoteId:r.id})}
 };
 const read=(k,d)=>{try{const v=JSON.parse(root.localStorage.getItem(k));return v==null?d:v}catch(_){return d}};
 const write=(k,v)=>{try{root.localStorage.setItem(k,JSON.stringify(v));return true}catch(e){console.warn('Local accounting storage failed:',e.message);return false}};
 const pending=(op)=>{const q=read(PENDING,[]);q.push(op);write(PENDING,q)};
 function emit(type,records){const detail={type,records};try{root.dispatchEvent(new CustomEvent('accounting:data-change',{detail}))}catch(_){}if(typeof api.onChange==='function')try{api.onChange(detail)}catch(_){}}
 function uuid(){return root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)})}
 const api={onChange:null,uuid,
  async loadLetters(localRecords){const local=Array.isArray(localRecords)?localRecords:read(LETTERS_KEY,[]),c=client();if(!c)return local;
   try{const remote=await c.select('letters','select=*&order=created_at.asc');if(Array.isArray(remote)&&remote.length){const rows=remote.map(r=>({_id:r.id,tracking_no:r.tracking_no||'',direction:r.direction||'',date:r.date||'',subject:r.subject||'',sender:r.sender||'',receiver:r.receiver||'',company:r.company||'',status:r.status||'',_created:Date.parse(r.created_at)||Date.now()}));write(LETTERS_KEY,rows);emit('letters',rows);return rows;}
    if(local.length){for(const r of local)await api.saveLetter(r);return local;}return local;
   }catch(e){emit('sync-error',{type:'letters',message:e.message});return local;}},
  async saveLetter(record){const item=record||{},records=read(LETTERS_KEY,[]);if(!item._id)item._id=uuid();const i=records.findIndex(x=>x._id===item._id);if(i<0)records.push(item);else records[i]=item;write(LETTERS_KEY,records);emit('letters',records);const c=client();if(!c)return item;
   const row={id:item._id,tracking_no:item.tracking_no||'',direction:item.direction||'',date:item.date||'',subject:item.subject||'',sender:item.sender||'',receiver:item.receiver||'',company:item.company||'',status:item.status||''};
   try{await c.upsert('letters',[row],'id')}catch(e){pending({kind:'upsert',table:'letters',row});emit('sync-error',{type:'letters',message:e.message});}return item;},
  async deleteLetter(id){const records=read(LETTERS_KEY,[]).filter(r=>r._id!==id);write(LETTERS_KEY,records);emit('letters',records);const c=client();if(c&&id)try{await c.remove('letters',id)}catch(e){pending({kind:'delete',table:'letters',id});emit('sync-error',{type:'letters',message:e.message})}},
  async loadMafasa(type){const cfg=TYPES[type];if(!cfg)throw new Error('Unknown Mafasa category: '+type);const saved=read(MAFASA_KEY,{}),local=Array.isArray(saved[type])?saved[type]:[],c=client();if(!c)return local;
   try{const rows=await c.select(cfg.table,'select=*&order=created_at.asc');if(Array.isArray(rows)&&rows.length){const mapped=rows.map(cfg.fromRow);saved[type]=mapped;write(MAFASA_KEY,saved);emit(type,mapped);return mapped;}if(local.length){for(const r of local)await api.addMafasa(type,r); }return local;
   }catch(e){emit('sync-error',{type,message:e.message});return local;}},
  async addMafasa(type,record){const cfg=TYPES[type];if(!cfg)throw new Error('Unknown Mafasa category: '+type);const saved=read(MAFASA_KEY,{}),list=Array.isArray(saved[type])?saved[type]:[];list.push(record);saved[type]=list;write(MAFASA_KEY,saved);emit(type,list);const c=client();if(c)try{const rows=await c.insert(cfg.table,[cfg.toRow(record)]);if(rows&&rows[0])record._remoteId=rows[0].id;write(MAFASA_KEY,saved)}catch(e){pending({kind:'insert',table:cfg.table,row:cfg.toRow(record)});emit('sync-error',{type,message:e.message})}return record;},
  async deleteMafasa(type,index){const cfg=TYPES[type];if(!cfg)return;const saved=read(MAFASA_KEY,{}),list=Array.isArray(saved[type])?saved[type]:[],prior=list[index],id=prior&&prior._remoteId;list.splice(index,1);saved[type]=list;write(MAFASA_KEY,saved);emit(type,list);const c=client();if(c&&id)try{await c.remove(cfg.table,id)}catch(e){pending({kind:'delete',table:cfg.table,id});emit('sync-error',{type,message:e.message})}},
  pendingOps:()=>read(PENDING,[])
 };
 root.AccountingData=api;
})(typeof window!=='undefined'?window:globalThis);
