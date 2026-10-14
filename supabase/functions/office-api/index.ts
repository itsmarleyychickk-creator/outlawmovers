import {createClient} from '@supabase/supabase-js';
import {requirements,reminders,dateValid} from './compliance.js';
import {formCatalog,validateForm,renderForm} from './forms.js';
const kinds=['customers','jobs','tasks','messages','company','compliance','employees','equipment','ledger','forms'];
const checks=['Signed transport agreement','Ownership / move authorization','Unit identifiers and dimensions','Route approval and permits','Insurance evidence','Driver and vehicle inspection','Escort arrangements','Delivery acceptance'];
const bucket='office-documents';
const origins=['https://outlawmoversllc.com','https://www.outlawmoversllc.com','https://itsmarleyychickk-creator.github.io'];
const check=r=>{if(r.error)throw Error(r.error.message);return r.data;};
function decode(content){if(typeof content!=='string'||!content||!/^[A-Za-z0-9+/]*={0,2}$/.test(content))throw Error('Invalid file');const raw=atob(content);if(raw.length>10000000)throw Error('File exceeds 10 MB limit');return Uint8Array.from(raw,c=>c.charCodeAt(0));}
async function digest(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');}
async function packet(db,hash){if(!hash){const s=check(await db.from('office_settings').select('body').eq('id','source-packet').maybeSingle());hash=s?.body?.hash;}if(!hash)throw Error('Upload your source packet privately in Filing documents first.');const p=check(await db.from('office_packets').select('path').eq('hash',hash).single());return new Uint8Array(await check(await db.storage.from(bucket).download(p.path)).arrayBuffer());}
async function validate(db,kind,b){
 if(kind==='forms')validateForm(b);
 if(!b||typeof b!=='object'||Array.isArray(b))throw Error('Invalid record');
 if(['employees','equipment'].includes(kind)&&!String(b.name||'').trim())throw Error('Name is required');
 if(kind==='ledger'){
  if(!['Income','Expense'].includes(b.type)||!Number.isFinite(Number(b.amount))||Number(b.amount)<=0)throw Error('Enter income/expense and an amount greater than zero');
  if(!dateValid(b.date)||!String(b.description||'').trim())throw Error('Date and description are required');
  if(b.jobId&&!(await db.from('office_records').select('id').eq('kind','jobs').eq('id',b.jobId).maybeSingle()).data)throw Error('Linked job not found');
 }
 if(kind==='compliance'){
  const d=requirements.find(d=>d.id===b.requirementId);if(!d)throw Error('Unknown requirement');
  if(!String(b.title||'').trim())throw Error('Record title is required');
  if(!['Not started','In progress','Waiting on agency','Complete'].includes(b.status))throw Error('Invalid progress status');
  if(!['Needs review','Required','Not applicable'].includes(b.applicability))throw Error('Choose applicability');
  if(!['None','Monthly','Quarterly','Annual','Every 2 years'].includes(b.recurrence))throw Error('Invalid reminder frequency');
  if(!Number.isInteger(Number(b.remindDays))||Number(b.remindDays)<0||Number(b.remindDays)>365)throw Error('Reminder lead time must be 0–365 days');
  if(!b.values||typeof b.values!=='object'||Array.isArray(b.values))throw Error('Invalid worksheet');
  for(const f of d.fields)if(b.values[f.key]&&f.type==='date'&&!dateValid(b.values[f.key]))throw Error('Invalid date: '+f.label);
  if(b.nextDue&&!dateValid(b.nextDue))throw Error('Invalid next due date');
  if(!Array.isArray(b.completedSteps)||b.completedSteps.some(i=>!Number.isInteger(i)||i<0||i>=d.steps.length))throw Error('Invalid checklist');
  if(b.status==='Complete'&&(b.applicability!=='Required'||b.completedSteps.length!==d.steps.length||!b.evidenceNote||!b.completedOn||!dateValid(b.completedOn)))throw Error('To complete, confirm applicability, finish each step, and record evidence and completion date. Drafts can be saved at any time.');
 }
 if(kind==='customers'&&!String(b.name||'').trim())throw Error('Customer name is required');
 if(kind==='tasks'&&!String(b.title||'').trim())throw Error('Task title is required');
 if(kind==='messages'&&(!b.customerId||!String(b.text||'').trim()))throw Error('Customer and message are required');
 if(kind==='jobs'){
  if(!b.customerId||!String(b.origin||'').trim())throw Error('Customer and job location are required');
  const transport=!b.service||['Mobile-home transport','House moving'].includes(b.service);
  if(transport&&!String(b.destination||'').trim())throw Error('Transport jobs require a delivery address');
  if(!(await db.from('office_records').select('id').eq('kind','customers').eq('id',b.customerId).maybeSingle()).data)throw Error('Customer does not exist');
  if(!['Inquiry','Quoted','Scheduled','Dispatched','Delivered','Cancelled'].includes(b.status))throw Error('Invalid job status');
  for(const k of ['quote','deposit','length','width','height'])if(b[k]!==undefined&&b[k]!==''&&(!Number.isFinite(Number(b[k]))||Number(b[k])<0))throw Error('Amounts and dimensions must be nonnegative numbers');
  if(b.status==='Dispatched'){
   if(!transport)throw Error('Use Scheduled for site work and Delivered when the job is complete. Dispatched is reserved for transport.');
   const c=(await db.from('office_records').select('body').eq('id','company').single()).data.body;
   if(['standing','authority','insurance'].some(k=>c[k]!=='Verified')||checks.slice(0,7).some(k=>!b.checks?.[k]))throw Error('Dispatch requires verified company standing, authority and insurance plus the seven pre-dispatch checks.');
  }
 }
 if(kind==='company'&&['standing','authority','insurance'].some(k=>!['Needs verification','Verified'].includes(b[k])))throw Error('Invalid verification status');
}
Deno.serve(async req=>{
 const origin=req.headers.get('Origin');const headers={'Access-Control-Allow-Origin':origins.includes(origin)?origin:origins[0],'Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'GET, POST, PUT, DELETE, OPTIONS','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json'}});
 if(origin&&!origins.includes(origin))return json({error:'Origin not permitted'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 try{
 const authorization=req.headers.get('Authorization')||'';
 if(!/^Bearer [^ ]+$/.test(authorization))return json({error:'Administrator login required'},401);
 const db=createClient(Deno.env.get('SUPABASE_URL'),Deno.env.get('SUPABASE_ANON_KEY'),{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:user,error}=await db.auth.getUser(authorization.slice(7));if(error||!user.user)return json({error:'Administrator login required'},401);
 if(!check(await db.rpc('office_access')))return json({error:'This verified account is not authorized for office access'},403);
 const url=new URL(req.url),path=url.searchParams.get('path')||'state';const [kind,id]=path.split('/');
 const body=async()=>{const raw=await req.text();if(raw.length>(['evidence','source-packet'].includes(kind)?15000000:100000))throw Error('Request too large');return JSON.parse(raw);};
 if(kind==='state'&&req.method==='GET'){
 let rows=[],start=0;while(true){const page=check(await db.from('office_records').select('kind,body').order('id').range(start,start+999));rows.push(...page);if(page.length<1000)break;start+=1000;}
 const state=Object.fromEntries(kinds.map(k=>[k,rows.filter(r=>r.kind===k).map(r=>r.body)]));
 // History is limited to the latest 1000 events to keep the free-tier response manageable.
 const audit=check(await db.from('office_audit').select('body').order('created_at',{ascending:false}).limit(1000)).map(r=>r.body);
 let documents=[],offset=0;while(true){const page=check(await db.from('office_documents').select('id,record_id,name,created_at').order('id').range(offset,offset+999));documents.push(...page.map(d=>({id:d.id,recordId:d.record_id,name:d.name,createdAt:d.created_at})));if(page.length<1000)break;offset+=1000;}
 return json({...state,checks,requirements,formCatalog,reminders:reminders(state.compliance),audit,documents});
 }
 if(kind==='source-packet'&&req.method==='GET'){const bytes=await packet(db);return new Response(bytes,{headers:{...headers,'Content-Type':'application/pdf'}});}
 if(kind==='source-packet'&&req.method==='POST'){
 const b=await body(),bytes=decode(b.content);if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('Choose a PDF');await renderForm(bytes,'irp-lease',[]);const hash=await digest(bytes),path='packets/'+hash+'.pdf';
 if(!check(await db.from('office_packets').select('hash').eq('hash',hash).maybeSingle())){const up=await db.storage.from(bucket).upload(path,bytes,{contentType:'application/pdf'});if(up.error&&up.error.statusCode!=='409')throw Error(up.error.message);check(await db.from('office_packets').upsert({hash,path}));}
 check(await db.from('office_settings').upsert({id:'source-packet',body:{hash}}));check(await db.from('office_audit').insert({record_id:'source-packet',body:{recordId:'source-packet',action:'Source packet uploaded',hash,at:new Date().toISOString()}}));return json({ok:true},201);
 }
 if(kind==='form-pdf'&&req.method==='GET'){
 const saved=check(await db.from('office_records').select('body').eq('kind','forms').eq('id',id).maybeSingle());const record=saved?.body,formId=record?.formId||id;const bytes=await renderForm(await packet(db,record?.packetHash),formId,url.searchParams.has('source')?[]:record?.fields||[]);
 return new Response(bytes,{headers:{...headers,'Content-Type':'application/pdf','Content-Disposition':url.searchParams.has('download')?'attachment; filename="outlaw-'+formId+'.pdf"':'inline'}});
 }
 if(kind==='evidence'&&req.method==='POST'){
 const b=await body();if(!check(await db.from('office_records').select('id').eq('id',b.recordId).maybeSingle()))throw Error('Record not found');const bytes=decode(b.content),docId=crypto.randomUUID(),name=String(b.name||'document').replace(/[\r\n/\\]/g,'_').slice(0,200),path='evidence/'+docId;
 check(await db.storage.from(bucket).upload(path,bytes,{contentType:'application/octet-stream'}));check(await db.from('office_documents').insert({id:docId,record_id:b.recordId,name,path}));check(await db.from('office_audit').insert({record_id:b.recordId,body:{recordId:b.recordId,action:'Document uploaded',name,at:new Date().toISOString()}}));return json({id:docId,name},201);
 }
 if(kind==='evidence'&&id&&req.method==='GET'){
 const d=check(await db.from('office_documents').select('path,name').eq('id',id).single());const blob=check(await db.storage.from(bucket).download(d.path));return new Response(blob,{headers:{...headers,'Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(d.name)}});
 }
 if(kind==='customer-link')return json({error:'Online customer tracking is not connected. Use the office phone or email.'},400);
 if(!kinds.includes(kind))return json({error:'Not found'},404);
 if(req.method==='DELETE')return json({error:'Permanent deletion is disabled online. Update or archive the record to preserve its history.'},400);
 if(['POST','PUT'].includes(req.method)){
 const b=await body();await validate(db,kind,b);const key=kind==='company'?'company':id||crypto.randomUUID();
 const previous=check(await db.from('office_records').select('body').eq('kind',kind).eq('id',key).maybeSingle());if(req.method==='PUT'&&!previous)return json({error:'Record not found'},404);
 if(kind==='forms'){const settings=check(await db.from('office_settings').select('body').eq('id','source-packet').maybeSingle());b.packetHash=previous?.body?.packetHash||settings?.body?.hash;if(!b.packetHash)throw Error('Upload your source packet first');await renderForm(await packet(db,b.packetHash),b.formId,b.fields);}
 const record=check(await db.rpc('office_save',{p_kind:kind,p_id:key,p_body:b,p_expected:b.version??null}));return json(record);
 }
 return json({error:'Method not allowed'},405);
 }catch(e){return json({error:e.message||'Unable to complete request'},400);}
});
