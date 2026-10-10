import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PDFDocument} from 'pdf-lib';
import {renderForm,validateForm} from '../forms.js';
import {spawn} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('form export preserves page count and validates review/submission and answer constraints',async()=>{
 const packet=await PDFDocument.create();for(let i=0;i<71;i++)packet.addPage([612,792]);const bytes=await packet.save();const answers=[{page:1,x:50,y:400,text:'Test carrier answer',size:10}];
 const result=await renderForm(bytes,'carrier',answers);const exported=await PDFDocument.load(result);assert.equal(exported.getPageCount(),6);
 const b={formId:'carrier',title:'Carrier draft',status:'Draft',fields:answers};assert.doesNotThrow(()=>validateForm(b));assert.throws(()=>validateForm({...b,status:'Submitted'}));assert.throws(()=>validateForm({...b,fields:[{...answers[0],text:'Unsupported ☃'}]}));assert.doesNotThrow(()=>validateForm({...b,status:'Submitted',editionConfirmed:true,submittedOn:'2026-10-10',receipt:'Agency receipt'}));
});
test('private form drafts, downloads and admin login protections',async()=>{
 const temp=mkdtempSync(join(tmpdir(),'outlaw-forms-'));const packet=await PDFDocument.create();for(let i=0;i<71;i++)packet.addPage([612,792]);writeFileSync(join(temp,'packet.pdf'),await packet.save());
 const proc=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'0',APP_DATA_DIR:temp,OFFICE_PASSWORD:'test-only',TRANSPORT_PACKET_PATH:join(temp,'packet.pdf')}});let base;
 try{await new Promise((res,rej)=>{proc.stdout.on('data',v=>{const m=String(v).match(/port (\d+)/);if(m){base='http://127.0.0.1:'+m[1];res();}});proc.once('exit',()=>rej(Error('Server exited')));});
 const unauth=await fetch(base+'/api/form-pdf/carrier');assert.equal(unauth.status,401);const admin=await fetch(base+'/admin',{redirect:'manual'});assert.equal(admin.status,302);
 let r=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'test-only'})});const cookie=r.headers.get('set-cookie').split(';')[0];assert.match(cookie,/office=/);assert.ok(r.headers.get('set-cookie').includes('HttpOnly'));assert.ok(r.headers.get('set-cookie').includes('SameSite=Strict'));
 const body={formId:'carrier',title:'Saved application',status:'Draft',fields:[{page:1,x:50,y:450,text:'Test answer',size:10}]};r=await fetch(base+'/api/forms',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200);const draft=await r.json();
 r=await fetch(base+'/api/form-pdf/'+draft.id+'?download=1',{headers:{Cookie:cookie}});assert.equal(r.status,200);assert.ok(r.headers.get('content-disposition').startsWith('attachment'));assert.equal(r.headers.get('cache-control'),'no-store');assert.equal((await PDFDocument.load(await r.arrayBuffer())).getPageCount(),6);
 packet.getPage(32).setSize(500,792);const replacement=await packet.save();r=await fetch(base+'/api/source-packet',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({content:Buffer.from(replacement).toString('base64')})});assert.equal(r.status,201);
 r=await fetch(base+'/api/form-pdf/'+draft.id,{headers:{Cookie:cookie}});assert.equal((await PDFDocument.load(await r.arrayBuffer())).getPage(0).getWidth(),612);
 r=await fetch(base+'/api/form-pdf/carrier',{headers:{Cookie:cookie}});assert.equal((await PDFDocument.load(await r.arrayBuffer())).getPage(0).getWidth(),500);
 r=await fetch(base+'/api/forms/'+draft.id,{method:'PUT',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({...draft,version:0})});assert.equal(r.status,409);
 await fetch(base+'/api/logout',{method:'POST',headers:{Cookie:cookie}});assert.equal((await fetch(base+'/api/state',{headers:{Cookie:cookie}})).status,401);
 for(let i=0;i<8;i++)await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'wrong'})});assert.equal((await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'test-only'})})).status,429);
 }finally{if(proc.exitCode===null)await new Promise(r=>{proc.once('exit',r);proc.kill();});rmSync(temp,{recursive:true,force:true});}
});
