import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, randomBytes, timingSafeEqual } from 'node:crypto';
const root=dirname(fileURLToPath(import.meta.url));
const dbPath=process.env.DATABASE_PATH||resolve(root,'data/office.sqlite');
mkdirSync(dirname(dbPath),{recursive:true});
const db=new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records (kind TEXT NOT NULL,id TEXT PRIMARY KEY,body TEXT NOT NULL);');
const kinds=['customers','jobs','tasks','messages','company'];
const passwordPath=resolve(root,'data/office-password.txt');
mkdirSync(dirname(passwordPath),{recursive:true});
if(!existsSync(passwordPath))writeFileSync(passwordPath,randomBytes(18).toString('base64url'),{mode:0o600});
const password=process.env.OFFICE_PASSWORD||readFileSync(passwordPath,'utf8').trim();
const sessions=new Set();
db.exec('CREATE TABLE IF NOT EXISTS links (token TEXT PRIMARY KEY, jobId TEXT NOT NULL UNIQUE);');
const checks=['Signed transport agreement','Ownership / move authorization','Unit identifiers and dimensions','Route approval and permits','Insurance evidence','Driver and vehicle inspection','Escort arrangements','Delivery acceptance'];
if(!db.prepare("SELECT id FROM records WHERE kind='company'").get()) db.prepare('INSERT INTO records VALUES (?,?,?)').run('company','company',JSON.stringify({id:'company',name:'Outlaw Movers LLC',manager:'Kristin L. Canada',phone:'270-312-2274',email:'John.henry@outlawmoversllc.com',address:'10295 Gracey Herndon Rd, Herndon, KY 42236',owner:'John H. Newberry',standing:'Needs verification',authority:'Needs verification',insurance:'Needs verification',notes:'Imported from supplied packet. Company standing, carrier authority and insurance coverage require current evidence. Transport only; no installation or site work.'}));
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
function validate(kind,b){
 if(!b||typeof b!=='object'||Array.isArray(b))throw Error('Invalid record');
 if(kind==='customers'&&!String(b.name||'').trim())throw Error('Customer name is required');
 if(kind==='tasks'&&!String(b.title||'').trim())throw Error('Task title is required');
 if(kind==='messages'&&(!b.customerId||!String(b.text||'').trim()))throw Error('Customer and message are required');
 if(kind==='jobs'){
  if(!b.customerId||!b.origin||!b.destination)throw Error('Customer, pickup and delivery are required');
  if(!db.prepare("SELECT id FROM records WHERE kind='customers' AND id=?").get(b.customerId))throw Error('Customer does not exist');
  if(!['Inquiry','Quoted','Scheduled','Dispatched','Delivered','Cancelled'].includes(b.status))throw Error('Invalid job status');
  for(const k of ['quote','deposit','length','width','height'])if(b[k]!==undefined&&b[k]!==''&&(!Number.isFinite(Number(b[k]))||Number(b[k])<0))throw Error('Amounts and dimensions must be nonnegative numbers');
  if(b.status==='Dispatched'){
   const c=JSON.parse(db.prepare("SELECT body FROM records WHERE id='company'").get().body);
   if(['standing','authority','insurance'].some(k=>c[k]!=='Verified')||checks.slice(0,7).some(k=>!b.checks?.[k]))throw Error('Dispatch requires verified company standing, authority and insurance plus the seven pre-dispatch checks.');
  }
 }
 if(kind==='company'&&['standing','authority','insurance'].some(k=>!['Needs verification','Verified'].includes(b[k])))throw Error('Invalid verification status');
}
const server=http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/')){
  const origin=req.headers.origin;if(origin&&new URL(origin).host!==req.headers.host)return send(res,403,{error:'Cross-origin requests are not permitted'});
  const readBody=async()=>{let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100000)throw Error('Request too large');}return JSON.parse(raw);};
  if(url.pathname==='/api/login'&&req.method==='POST'){
   const b=await readBody(),a=Buffer.from(String(b.password||'')),expected=Buffer.from(password);
   if(a.length!==expected.length||!timingSafeEqual(a,expected))return send(res,401,{error:'Incorrect office password'});
   const token=randomBytes(32).toString('hex');sessions.add(token);res.setHeader('Set-Cookie',`office=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);return send(res,200,{ok:true});
  }
  if(url.pathname==='/api/request-quote'&&req.method==='POST'){
   const b=await readBody();if(!b.name||(!b.phone&&!b.email)||!b.origin||!b.destination)throw Error('Name, contact, pickup and delivery are required');
   const cid=randomUUID(),jid=randomUUID(),now=new Date().toISOString();
   const c={id:cid,name:String(b.name).slice(0,200),phone:String(b.phone||'').slice(0,100),email:String(b.email||'').slice(0,200),notes:'Customer portal inquiry',updatedAt:now};
   const j={id:jid,customerId:cid,status:'Inquiry',origin:String(b.origin).slice(0,500),destination:String(b.destination).slice(0,500),date:String(b.date||'').slice(0,10),unit:String(b.unit||'').slice(0,200),publicUpdate:'Your request has been received. The office will contact you to confirm details.',notes:String(b.notes||'').slice(0,3000),checks:{},updatedAt:now};
   const token=randomBytes(24).toString('hex');db.exec('BEGIN');try{db.prepare('INSERT INTO records VALUES (?,?,?)').run('customers',cid,JSON.stringify(c));db.prepare('INSERT INTO records VALUES (?,?,?)').run('jobs',jid,JSON.stringify(j));db.prepare('INSERT INTO links VALUES (?,?)').run(token,jid);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return send(res,201,{token});
  }
  if(url.pathname==='/api/customer-message'&&req.method==='POST'){
   const b=await readBody();const link=db.prepare('SELECT jobId FROM links WHERE token=?').get(String(b.token||''));if(!link)return send(res,404,{error:'Tracking link not found'});
   const r=db.prepare("SELECT body FROM records WHERE kind='jobs' AND id=?").get(link.jobId);if(!r)return send(res,404,{error:'Job not found'});const j=JSON.parse(r.body);
   const text=String(b.text||'').trim();if(!text||text.length>3000)throw Error('Message must contain 1–3000 characters');
   const m={id:randomUUID(),customerId:j.customerId,jobId:j.id,channel:'Portal',draft:false,text,updatedAt:new Date().toISOString()};db.prepare('INSERT INTO records VALUES (?,?,?)').run('messages',m.id,JSON.stringify(m));return send(res,201,{ok:true});
  }
  if(url.pathname==='/api/track'&&req.method==='GET'){
   const link=db.prepare('SELECT jobId FROM links WHERE token=?').get(url.searchParams.get('token')||'');if(!link)return send(res,404,{error:'Tracking link not found'});
   const r=db.prepare("SELECT body FROM records WHERE kind='jobs' AND id=?").get(link.jobId);if(!r)return send(res,404,{error:'Job not found'});const j=JSON.parse(r.body);return send(res,200,Object.fromEntries(['status','origin','destination','date','unit','quote','deposit','publicUpdate'].map(k=>[k,j[k]||''])));
  }
  const session=/office=([^;]+)/.exec(req.headers.cookie||'')?.[1];
  if(!sessions.has(session))return send(res,401,{error:'Office login required'});
  if(url.pathname==='/api/logout'){sessions.delete(session);res.setHeader('Set-Cookie','office=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return send(res,200,{ok:true});}
  if(url.pathname==='/api/customer-link'&&req.method==='POST'){
   const b=await readBody();if(!db.prepare("SELECT id FROM records WHERE kind='jobs' AND id=?").get(b.jobId))throw Error('Job not found');
   let link=db.prepare('SELECT token FROM links WHERE jobId=?').get(b.jobId);if(!link){link={token:randomBytes(24).toString('hex')};db.prepare('INSERT INTO links VALUES (?,?)').run(link.token,b.jobId);}return send(res,200,link);
  }
  if(url.pathname==='/api/state'&&req.method==='GET'){
   const state=Object.fromEntries(kinds.map(k=>[k,db.prepare('SELECT body FROM records WHERE kind=?').all(k).map(r=>JSON.parse(r.body))]));return send(res,200,{...state,checks});
  }
  const [, ,kind,id]=url.pathname.split('/');if(!kinds.includes(kind))return send(res,404,{error:'Not found'});
  if(req.method==='DELETE'){
   if(kind==='company')return send(res,400,{error:'Company cannot be deleted'});
   if(kind==='customers'&&db.prepare("SELECT body FROM records WHERE kind IN ('jobs','messages')").all().some(r=>JSON.parse(r.body).customerId===id))return send(res,409,{error:'Customer has linked jobs or messages'});
   db.prepare('DELETE FROM records WHERE kind=? AND id=?').run(kind,id||'');return send(res,200,{ok:true});
  }
  if(req.method==='POST'||req.method==='PUT'){
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>100000)return send(res,413,{error:'Record too large'});}
   const b=JSON.parse(raw);validate(kind,b);
   const key=kind==='company'?'company':id||randomUUID();
   if(req.method==='PUT'&&!db.prepare('SELECT id FROM records WHERE kind=? AND id=?').get(kind,key))return send(res,404,{error:'Record not found'});
   const record={...b,id:key,updatedAt:new Date().toISOString()};
   db.prepare('INSERT INTO records VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body WHERE kind=excluded.kind').run(kind,key,JSON.stringify(record));return send(res,200,record);
  }
  return send(res,405,{error:'Method not allowed'});
 }
 if(url.pathname==='/'&&!sessions.has(/office=([^;]+)/.exec(req.headers.cookie||'')?.[1])){res.writeHead(302,{Location:'/login'});return res.end();}
 if(url.pathname==='/transport-packet.pdf'&&!sessions.has(/office=([^;]+)/.exec(req.headers.cookie||'')?.[1])){res.writeHead(403);return res.end('Office login required');}
 const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/customer':'customer.html','/customer.js':'customer.js','/login':'login.html','/login.js':'login.js','/transport-packet.pdf':'transport-packet.pdf'};const file=files[url.pathname];if(!file){res.writeHead(404);return res.end('Not found');}
 res.writeHead(200,{'Content-Type':file.endsWith('.pdf')?'application/pdf':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; frame-ancestors 'none'"});res.end(readFileSync(file==='transport-packet.pdf'?(process.env.TRANSPORT_PACKET_PATH||resolve(root,'data',file)):resolve(root,'public',file)));
 }catch(e){send(res,400,{error:e.message});}
});
server.listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log(`Outlaw office listening on port ${server.address().port}`));
