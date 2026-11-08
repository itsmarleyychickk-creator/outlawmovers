import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {documentURL,officeLoginURL,officeReturnURL,attachmentName,documentMime,fetchPrivateDocument} from '../online/document-access.js';
import {showDocumentViewer} from '../online/document-viewer.js';
const id='11111111-2222-4333-8444-555555555555',base='https://office.example/office/';
test('private document survives login without permitting external redirects',()=>{
 const target=documentURL(id,base),login=officeLoginURL(target);
 assert.equal(officeReturnURL(login),target);
 for(const next of ['https://other.example/office/document.html?id='+id,'//other.example/office/document.html?id='+id,'./document.html?id=invalid','../document.html?id='+id,'javascript:alert(1)','./login.html'])assert.equal(officeReturnURL(base+'login.html?next='+encodeURIComponent(next)),base);
 assert.equal(officeLoginURL(base),base+'login.html');
 assert.throws(()=>documentURL('../private',base));
});
test('file names are decoded without allowing path or control characters',()=>{
 assert.equal(attachmentName("attachment; filename*=UTF-8''Project%20letter.pdf"),'Project letter.pdf');
 assert.equal(attachmentName('attachment; filename="copy.docx"'),'copy.docx');
 assert.equal(attachmentName("attachment; filename*=UTF-8''%2Ffile%0A.pdf"),'_file_.pdf');
 assert.equal(documentMime('Document.PDF'),'application/pdf');
 assert.equal(documentMime('script.html'),'application/octet-stream');
});
test('private PDF uses authenticated API route and preserves every original byte',async()=>{
 const bytes=Uint8Array.from([37,80,68,70,45,49,46,55,10,0,255,13,10]);let path;
 const file=await fetchPrivateDocument(id,async url=>{path=url;return new Response(bytes,{headers:{'Content-Disposition':"attachment; filename*=UTF-8''Signed%20return.pdf"}});});
 assert.equal(path,'/api/evidence/'+id);assert.equal(file.name,'Signed return.pdf');assert.equal(file.blob.type,'application/pdf');assert.deepEqual(new Uint8Array(await file.blob.arrayBuffer()),bytes);
});
test('invalid links never make a request; unauthorized access exposes no file',async()=>{
 let requests=0;await assert.rejects(fetchPrivateDocument('invalid',()=>{requests++;}));assert.equal(requests,0);
 await assert.rejects(fetchPrivateDocument(id,async()=>new Response(JSON.stringify({error:'Administrator login required'}),{status:401})),/Administrator login required/);
});
function fixture(){
 const elements=Object.fromEntries(['document-status','document-preview','document-actions','document-retry','document-name','document-save','document-open'].map(key=>['#'+key,{hidden:true,textContent:'',children:[],replaceChildren(){this.children=[];},append(child){this.children.push(child);}}]));
 const original={document:globalThis.document,location:globalThis.location,window:globalThis.window,fetch:globalThis.fetch};let redirected='';
 globalThis.document={querySelector:s=>elements[s],createElement:tag=>({tag})};globalThis.location={href:documentURL(id,base),replace:value=>{redirected=value;}};globalThis.window={addEventListener(){}};
 return {elements,redirect:()=>redirected,restore(){for(const [key,value]of Object.entries(original))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}};
}
test('viewer exposes PDF save and print links with inline preview',async()=>{
 const f=fixture();try{
  globalThis.fetch=async()=>new Response('%PDF-1.7\noriginal',{headers:{'Content-Disposition':"attachment; filename*=UTF-8''Customer%20copy.pdf"}});
  await showDocumentViewer({db:{auth:{getSession:async()=>({data:{session:{access_token:'fixture'}}})}},loginURL:officeLoginURL(location.href)});
  assert.equal(f.elements['#document-actions'].hidden,false);assert.equal(f.elements['#document-save'].download,'Customer copy.pdf');assert.match(f.elements['#document-save'].href,/^blob:/);assert.equal(f.elements['#document-preview'].children[0].tag,'iframe');assert.match(f.elements['#document-status'].textContent,/If the preview is blank/);
 }finally{f.restore();}
});
test('signed-out viewer returns to document after login and does not request file',async()=>{
 const f=fixture();try{let requested=false;globalThis.fetch=()=>{requested=true;};
  await showDocumentViewer({db:{auth:{getSession:async()=>({data:{session:null}})}},loginURL:officeLoginURL(location.href)});
  assert.equal(requested,false);assert.equal(officeReturnURL(f.redirect()),documentURL(id,base));assert.equal(f.elements['#document-actions'].hidden,true);
 }finally{f.restore();}
});
test('viewer shows a recoverable error for denied access without a document link',async()=>{
 const f=fixture();try{
  globalThis.fetch=async()=>new Response(JSON.stringify({error:'This verified account is not authorized for office access'}),{status:403});
  await showDocumentViewer({db:{auth:{getSession:async()=>({data:{session:{}}})}},loginURL:officeLoginURL(location.href)});
  assert.equal(f.elements['#document-actions'].hidden,true);assert.equal(f.elements['#document-retry'].hidden,false);assert.match(f.elements['#document-status'].textContent,/not authorized/);
 }finally{f.restore();}
});
test('published modules and source use identical viewer assets and login integration',()=>{
 for(const file of ['document-access.js','document-viewer.js','document.html'])assert.equal(readFileSync(new URL('../online/'+file,import.meta.url),'utf8'),readFileSync(new URL('../docs/office/'+file,import.meta.url),'utf8'));
 for(const file of ['../online/client.js','../docs/office/client.js']){const content=readFileSync(new URL(file,import.meta.url),'utf8');assert.match(content,/officeLoginURL\(location.href\)/);assert.match(content,/officeReturnURL\(location.href\)/);assert.match(content,/showDocumentViewer/);assert.match(content,/documentURL\(decodeURIComponent/);}
});
