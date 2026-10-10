import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'outlaw-test-'));
writeFileSync(join(dir,'packet.pdf'),'%PDF-1.4\nTest fixture\n%%EOF');
let proc,base,cookie;
async function start(){proc=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'0',DATABASE_PATH:join(dir,'test.sqlite'),OFFICE_PASSWORD:'test-only-password',TRANSPORT_PACKET_PATH:join(dir,'packet.pdf')},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{proc.stdout.on('data',d=>{const m=String(d).match(/port (\d+)/);if(m){base='http://127.0.0.1:'+m[1];resolve();}});proc.on('error',reject);proc.on('exit',c=>reject(Error('Server exited '+c)));});}
async function stop(){await new Promise(r=>{proc.once('exit',r);proc.kill();});}
async function request(path,method='GET',body,auth=true){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(auth&&cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),headers:r.headers};}
async function login(){const r=await request('/api/login','POST',{password:'test-only-password'});assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];}
test('customer inquiry, protected office workflow, dispatch validation and persistent records',async()=>{
 try{
 await start();assert.equal((await request('/api/state','GET',undefined,false)).status,401);
 assert.equal((await request('/api/login','POST',{password:'wrong'})).status,401);
 const inquiry=await request('/api/request-quote','POST',{name:'Test customer',phone:'555-0100',origin:'Pickup address',destination:'Delivery address'},false);assert.equal(inquiry.status,201);const token=inquiry.data.token;
 const track=await request('/api/track?token='+token,'GET',undefined,false);assert.equal(track.data.status,'Inquiry');assert.ok(!('notes' in track.data));assert.ok(!('customerId' in track.data));
 assert.equal((await request('/api/customer-message','POST',{token,text:'Can you confirm my pickup window?'},false)).status,201);
 assert.equal((await request('/api/customer-message','POST',{token:'invalid',text:'No access'},false)).status,404);
 assert.equal((await request('/api/track?token=invalid','GET',undefined,false)).status,404);
 await login();let s=(await request('/api/state')).data;assert.equal(s.customers.length,1);assert.equal(s.jobs.length,1);let job=s.jobs[0];
 assert.equal((await request('/api/jobs/'+job.id,'PUT',{...job,status:'Dispatched'})).status,400);
 const quote=await request('/api/jobs/'+job.id,'PUT',{...job,status:'Quoted',quote:1800,deposit:200,notes:'PRIVATE OFFICE NOTE',publicUpdate:'Quote ready for review'});assert.equal(quote.status,200);job=quote.data;
 const customerView=(await request('/api/track?token='+token,'GET',undefined,false)).data;assert.equal(customerView.quote,1800);assert.equal(customerView.publicUpdate,'Quote ready for review');assert.ok(!JSON.stringify(customerView).includes('PRIVATE'));
 assert.equal((await request('/api/customers/'+job.customerId,'DELETE')).status,409);
 const company=s.company[0];assert.equal((await request('/api/company/company','PUT',{...company,standing:'Verified',authority:'Verified',insurance:'Verified'})).status,200);
 assert.equal((await request('/api/jobs/'+job.id,'PUT',{...job,status:'Dispatched',checks:Object.fromEntries(s.checks.slice(0,7).map(c=>[c,true]))})).status,200);
 const task=await request('/api/tasks','POST',{title:'Call customer',due:'2026-10-10',priority:'High'});assert.equal(task.status,200);assert.equal((await request('/api/tasks/'+task.data.id,'PUT',{...task.data,done:true})).data.done,true);
 assert.equal((await request('/api/messages','POST',{customerId:job.customerId,channel:'Phone',text:'Confirmed pickup',draft:false})).status,200);
 assert.equal((await fetch(base+'/transport-packet.pdf')).status,403);assert.equal((await fetch(base+'/customer')).status,200);assert.equal((await fetch(base+'/transport-packet.pdf',{headers:{Cookie:cookie}})).headers.get('content-type'),'application/pdf');
 const csrf=await fetch(base+'/api/tasks',{method:'POST',headers:{Cookie:cookie,Origin:'https://elsewhere.example','Content-Type':'application/json'},body:JSON.stringify({title:'Bad'})});assert.equal(csrf.status,403);
 await stop();cookie=null;await start();await login();s=(await request('/api/state')).data;assert.equal(s.jobs[0].status,'Dispatched');assert.equal(s.tasks[0].done,true);assert.equal((await request('/api/track?token='+token,'GET',undefined,false)).data.status,'Dispatched');
 }finally{if(proc&&proc.exitCode===null)await stop();rmSync(dir,{recursive:true,force:true});}
});
