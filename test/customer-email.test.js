import test from 'node:test';
import assert from 'node:assert/strict';
import {validEmail,emailTemplate,mailtoDraft,gmailDraft,buildEmailFile} from '../public/customer-email-model.js';
test('rejects injected recipient headers and multiple recipients',()=>{assert.equal(validEmail('owner@example.com'),true);for(const to of ['owner@example.com\r\nBcc:other@example.com','owner@example.com,other@example.com','not-an-email'])assert.throws(()=>mailtoDraft({to,subject:'Test',body:''}),/valid recipient/);});
test('separate owner permission text does not assume marriage or identity',()=>{const x=emailTemplate('homeowner',{site:'Example site'});assert.match(x.body,/actual home owner/);assert.match(x.body,/separate consent/);assert.doesNotMatch(x.body,/wife|husband|Kaylin/);});
test('draft email file preserves selected attachments and encodes body',()=>{const out=buildEmailFile({to:'owner@example.com',subject:'Review\r\nBcc:fake',body:'Please sign only your form.',attachments:[{name:'Permission.pdf',base64:'JVBERg=='}]},'outlaw_test123');assert.match(out,/X-Unsent: 1/);assert.match(out,/filename="Permission.pdf"/);assert.match(out,/JVBERg==/);assert.doesNotMatch(out,/\r\nBcc:/);assert.match(out,/UGxlYXNl/);assert.throws(()=>buildEmailFile({to:'owner@example.com',subject:'Test',body:'',attachments:[{name:'a',base64:'bad\r\nheader'}]},'outlaw_test123'),/attachment/);});
test('Gmail composer is preaddressed and never contains a private file link',()=>{const u=new URL(gmailDraft({to:'owner@example.com',subject:'Forms & permission',body:'Please review.'}));assert.equal(u.searchParams.get('to'),'owner@example.com');assert.equal(u.searchParams.get('su'),'Forms & permission');assert.doesNotMatch(u.href,/office\/|api\/evidence/);});

test('office email actions save unsent drafts and require a separate sent confirmation',async()=>{
 const nodes=new Map();class Node{innerHTML='';textContent='';value='';checked=false;disabled=false;querySelector(s){return document.querySelector(s);}querySelectorAll(){return [];}}
 globalThis.document={querySelector:s=>{if(!nodes.has(s))nodes.set(s,new Node());return nodes.get(s);}};
 const {renderCustomerEmail}=await import('../public/customer-email-ui.js');const calls=[];
 const state={customers:[{id:'c',name:'Customer',email:'owner@example.com'}],company:[{name:'Business'}],messages:[]};
 renderCustomerEmail(state,{id:'j',customerId:'c',origin:'Example site'},[{id:'d',name:'Permission.pdf'}],{api:async(path,method,body)=>{calls.push({path,method,body});return {id:'draft-1',...body};}});
 document.querySelector('#form-email-to').value='owner@example.com';document.querySelector('#form-email-subject').value='Forms';document.querySelector('#form-email-body').value='Review and sign your own permission.';
 await nodes.get('#form-email-save').onclick();assert.equal(calls.length,1);assert.equal(calls[0].path,'messages');assert.equal(calls[0].body.draft,true);assert.equal(calls[0].body.deliveryVerified,false);assert.equal(calls[0].body.signaturesVerified,false);
 await nodes.get('#form-email-record-sent').onclick();assert.equal(calls.length,1);assert.match(nodes.get('#form-email-status').textContent,/Confirm actual sending/);
 assert.doesNotMatch(nodes.get('#county-email').innerHTML,/send_email|access_token|service_role/);
 delete globalThis.document;
});
