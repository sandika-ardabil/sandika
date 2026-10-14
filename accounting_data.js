/* Local-first application data adapter: REST when available, LocalStorage offline. */
(function (root) {
  'use strict';
  const client = root.SupabaseClient;
  const LETTERS_KEY = 'portal_letters_v1';
  const MAFASA_KEY = 'mafasa_accounting_records_v1';
  const TYPES = {
    invoices: {table:'invoices', toRow:r=>({factor_number:r.invoiceNumber||r.factor_number||'',date:r.invoiceDate||r.date||'',amount:Number(r.amount)||0,receiver_name:r.receiptName||r.receiver_name||''}), fromRow:r=>({invoiceNumber:r.factor_number||'',invoiceDate:r.date||'',amount:Number(r.amount)||0,receiptName:r.receiver_name||'',_remoteId:r.id})},
    transitCheques: {table:'transit_cheques',toRow:r=>({cheque_number:r.chequeNumber||r.cheque_number||'',date:r.date||'',amount:Number(r.amount)||0,owner_name:r.ownerName||r.owner_name||''}),fromRow:r=>({chequeNumber:r.cheque_number||'',date:r.date||'',amount:Number(r.amount)||0,ownerName:r.owner_name||'',_remoteId:r.id})},
    bouncedCheques: {table:'bounced_cheques',toRow:r=>({cheque_number:r.chequeNumber||r.cheque_number||'',date:r.date||'',amount:Number(r.amount)||0,owner_name:r.ownerName||r.owner_name||''}),fromRow:r=>({chequeNumber:r.cheque_number||'',date:r.date||'',amount:Number(r.amount)||0,ownerName:r.owner_name||'',_remoteId:r.id})},
    letters: {table:'mafasa_letters',toRow:r=>({audience:r.recipientName||r.audience||'',letter_number:r.letterNumber||r.letter_number||'',date:r.date||'',attachment_desc:r.attachment||r.attachment_desc||''}),fromRow:r=>({recipientName:r.audience||'',letterNumber:r.letter_number||'',date:r.date||'',attachment:r.attachment_desc||'',_remoteId:r.id})}
  };
  function read(key, fallback) { try { const v=JSON.parse(root.localStorage.getItem(key)); return v == null ? fallback : v; } catch (_) { return fallback; } }
  function write(key, value) { try { root.localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function emit(type, records) {
    const detail={type,records};
    try { root.dispatchEvent(new CustomEvent('accounting:data-change',{detail})); } catch (_) {}
    if (typeof api.onChange === 'function') { try { api.onChange(detail); } catch (_) {} }
  }
  function uuid() {
    if (root.crypto && typeof root.crypto.randomUUID === 'function') return root.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16);});
  }
  const api = {
    onChange: null,
    uuid,
    async loadLetters(localRecords) {
      const local=Array.isArray(localRecords)?localRecords:read(LETTERS_KEY,[]);
      if (!client) return local;
      try {
        const remote=await client.select('letters','select=*&order=created_at.asc');
        if (Array.isArray(remote) && remote.length) {
          const rows=remote.map(r=>({ _id:r.id, tracking_no:r.tracking_no||'',direction:r.direction||'',date:r.date||'',subject:r.subject||'',sender:r.sender||'',receiver:r.receiver||'',company:r.company||'',status:r.status||'',_created:Date.parse(r.created_at)||Date.now() }));
          write(LETTERS_KEY,rows); emit('letters',rows); return rows;
        }
        if (Array.isArray(local) && local.length) {
          for (const record of local) await api.saveLetter(record);
          return local;
        }
        return local;
      } catch (error) { emit('sync-error',{type:'letters',message:error.message}); return local; }
    },
    async saveLetter(record) {
      const records=read(LETTERS_KEY,[]); const item=record;
      if (!item._id || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(item._id)) item._id=uuid();
      const i=records.findIndex(x=>x._id===item._id); if(i<0) records.push(item); else records[i]=item;
      write(LETTERS_KEY,records); emit('letters',records);
      if (!client) return item;
      try {
        const row={id:item._id,tracking_no:item.tracking_no||'',direction:item.direction||'',date:item.date||'',subject:item.subject||'',sender:item.sender||'',receiver:item.receiver||'',company:item.company||'',status:item.status||''};
        await client.insert('letters',[row]);
      } catch (error) { emit('sync-error',{type:'letters',message:error.message}); }
      return item;
    },
    async deleteLetter(id) {
      const records=read(LETTERS_KEY,[]).filter(r=>r._id!==id); write(LETTERS_KEY,records); emit('letters',records);
      if(client && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(String(id))) try { await client.remove('letters',id); } catch(error) { emit('sync-error',{type:'letters',message:error.message}); }
    },
    async loadMafasa(type) {
      const cfg=TYPES[type]; if(!cfg) throw new Error('Unknown Mafasa category: '+type);
      const saved=read(MAFASA_KEY,{}); const local=Array.isArray(saved[type])?saved[type]:[];
      if(!client) return local;
      try { const rows=await client.select(cfg.table,'select=*&order=created_at.asc');
        if(Array.isArray(rows)&&rows.length){const mapped=rows.map(cfg.fromRow);saved[type]=mapped;write(MAFASA_KEY,saved);emit(type,mapped);return mapped;}
        if(local.length){for(const record of local) await api.addMafasa(type,record);}
        return local;
      } catch(error) { emit('sync-error',{type,message:error.message}); return local; }
    },
    async addMafasa(type, record) {
      const cfg=TYPES[type]; if(!cfg) throw new Error('Unknown Mafasa category: '+type);
      const saved=read(MAFASA_KEY,{}); const list=Array.isArray(saved[type])?saved[type]:[];
      list.push(record); saved[type]=list; write(MAFASA_KEY,saved); emit(type,list);
      if(client) try { const rows=await client.insert(cfg.table,[cfg.toRow(record)]); if(rows&&rows[0]) record._remoteId=rows[0].id; write(MAFASA_KEY,saved); }
      catch(error){emit('sync-error',{type,message:error.message});}
      return record;
    },
    async deleteMafasa(type, record) {
      const cfg=TYPES[type]; if(!cfg) return;
      const saved=read(MAFASA_KEY,{}); const prior=(saved[type]||[])[record]; const id=prior&&prior._remoteId; const list=(saved[type]||[]).filter((_,i)=>i!==record); saved[type]=list;write(MAFASA_KEY,saved);emit(type,list);
      if(client && id) try { await client.remove(cfg.table,id); } catch(error) { emit('sync-error',{type,message:error.message}); }
    }
  };
  root.AccountingData=api;
})(typeof window !== 'undefined' ? window : globalThis);
