export async function readInlineEvidence(db,document){
 if(document.path!=='inline/'+document.id)throw Error('Invalid private attachment path');
 const result=await db.from('office_settings').select('body').eq('id','evidence-inline-'+document.id).single();
 if(result.error)throw Error('Private attachment not found');
 const source=result.data?.body;
 if(source?.recordId!==document.record_id||source?.name!==document.name||typeof source.content!=='string'||source.content.length>14000000||!/^[A-Za-z0-9+/]*={0,2}$/.test(source.content)||!/^[a-f0-9]{64}$/.test(source.sha256||''))throw Error('Invalid private attachment');
 const bytes=Uint8Array.from(atob(source.content),c=>c.charCodeAt(0));
 if(bytes.length>10000000||bytes.length!==source.size)throw Error('Invalid private attachment size');
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');
 if(hash!==source.sha256)throw Error('Private attachment integrity check failed');
 return bytes;
}