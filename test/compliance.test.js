import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requirements,reminders,dateValid} from '../compliance.js';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
test('renewal dates use real calendar dates, separate expirations and applicability',()=>{
 assert.equal(dateValid('2026-02-30'),false);assert.equal(dateValid('2028-02-29'),true);
 const records=[{id:'a',title:'Insurance',applicability:'Required',nextDue:'2026-10-15',remindDays:30,values:{expires:'2026-10-09'}},{id:'b',applicability:'Not applicable',nextDue:'2026-01-01',values:{}},{id:'c',title:'Future',nextDue:'2027-01-01',values:{}}];
 const r=reminders(records,'2026-10-10');assert.equal(r.length,2);assert.equal(r[0].state,'Overdue');assert.equal(r[1].days,5);
});
test('drafts, completion rules, audit history, evidence, routing and financial records persist privately',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'outlaw-compliance-'));let proc,base,cookie;
 async function start(){proc=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'0',DATABASE_PATH:join(dir,'office.sqlite'),OFFICE_PASSWORD:'test-office'}});await new Promise((res,rej)=>{proc.stdout.on('data',v=>{const m=String(v).match(/port (\d+)/);if(m){base='http://127.0.0.1:'+m[1];res();}});proc.once('exit',()=>rej(Error('Server exited')));});const r=await req('login','POST',{password:'test-office'},false);cookie=r.headers.get('set-cookie').split(';')[0];}
 async function stop(){await new Promise(r=>{proc.once('exit',r);proc.kill();});}
 async function req(path,method='GET',b,auth=true){const r=await fetch(base+'/api/'+path,{method,headers:{'Content-Type':'application/json',...(auth?{Cookie:cookie}:{})},body:b?JSON.stringify(b):undefined});return {status:r.status,data:r.headers.get('content-type')?.includes('json')?await r.json():await r.text(),headers:r.headers};}
 try{await start();let s=(await req('state')).data;assert.equal(s.compliance.length,requirements.length);let c=s.compliance.find(r=>r.requirementId==='insurance');
 assert.equal((await req('compliance/'+c.id,'PUT',{...c,status:'Complete'})).status,400);
 const draft=await req('compliance/'+c.id,'PUT',{...c,status:'In progress',applicability:'Required',values:{policy:'PRIVATE-POLICY'},nextDue:'2026-10-09'});assert.equal(draft.status,200);c=draft.data;
 assert.equal((await req('compliance/'+c.id,'PUT',{...c,version:1,notes:'stale'})).status,409);
 const d=requirements.find(d=>d.id===c.requirementId);const done=await req('compliance/'+c.id,'PUT',{...c,status:'Complete',completedSteps:d.steps.map((_,i)=>i),evidenceNote:'Agent confirmation recorded',completedOn:'2026-10-10'});assert.equal(done.status,200);
 const evidence=await req('evidence','POST',{recordId:c.id,name:'receipt.txt',content:Buffer.from('PRIVATE EVIDENCE').toString('base64')});assert.equal(evidence.status,201);assert.equal((await req('evidence/'+evidence.data.id)).data,'PRIVATE EVIDENCE');assert.equal((await req('evidence/'+evidence.data.id,'GET',undefined,false)).status,401);
 assert.equal((await req('employees','POST',{name:'Driver One',role:'Driver',status:'Active'})).status,200);
 assert.equal((await req('equipment','POST',{name:'Truck',status:'Needs repair'})).status,200);
 assert.equal((await req('ledger','POST',{type:'Income',amount:2000,date:'2026-10-10',description:'Move payment'})).status,200);
 assert.equal((await req('ledger','POST',{type:'Expense',amount:300,date:'2026-10-10',description:'Fuel'})).status,200);
 assert.equal((await req('ledger','POST',{type:'Expense',amount:-1,date:'2026-10-10',description:'Bad'})).status,400);
 s=(await req('state')).data;assert.equal(s.ledger.reduce((n,r)=>n+(r.type==='Income'?1:-1)*r.amount,0),1700);assert.ok(s.audit.some(a=>a.after?.values?.policy==='PRIVATE-POLICY'));assert.ok(s.tasks.some(t=>t.department==='Compliance'));assert.ok(s.tasks.some(t=>t.department==='Fleet'));assert.ok(s.tasks.some(t=>t.department==='Finance'));assert.ok(s.reminders.some(r=>r.recordId===c.id));
 await stop();await start();s=(await req('state')).data;assert.equal(s.compliance.length,requirements.length);assert.equal(s.compliance.find(r=>r.id===c.id).status,'Complete');assert.equal(s.documents.length,1);assert.equal(s.ledger.length,2);assert.equal(s.employees.length,1);assert.equal(s.equipment.length,1);
 }finally{if(proc?.exitCode===null)await stop();rmSync(dir,{recursive:true,force:true});}
});
