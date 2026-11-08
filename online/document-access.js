const documentIdPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validDocumentId(id){return typeof id==='string'&&documentIdPattern.test(id);}
export function documentURL(id,href){
 if(!validDocumentId(id))throw Error('Choose a saved document from the office.');
 const url=new URL('document.html',href);url.searchParams.set('id',id);return url.href;
}
export function officeLoginURL(href){
 const current=new URL(href),login=new URL('login.html',current);
 if(current.pathname.endsWith('/document.html')&&validDocumentId(current.searchParams.get('id')))login.searchParams.set('next','./document.html?id='+current.searchParams.get('id'));
 return login.href;
}
export function officeReturnURL(href){
 const login=new URL(href),home=new URL('./',login),next=login.searchParams.get('next');
 if(!next)return home.href;
 try{const target=new URL(next,login),id=target.searchParams.get('id');
  if(target.origin!==home.origin||target.pathname!==home.pathname+'document.html'||!validDocumentId(id))return home.href;
  return documentURL(id,home.href);
 }catch{return home.href;}
}
export function attachmentName(disposition){
 let name='Saved document';
 const encoded=disposition?.match(/filename\*=UTF-8''([^;]+)/i),plain=disposition?.match(/filename="([^"]+)"|filename=([^;]+)/i);
 try{if(encoded)name=decodeURIComponent(encoded[1]);else if(plain)name=plain[1]||plain[2];}catch{}
 return name.replace(/[\x00-\x1f\x7f/\\]/g,'_').trim().slice(0,240)||'Saved document';
}
export function documentMime(name){
 const extension=name.toLowerCase().split('.').pop();
 return ({pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',doc:'application/msword'})[extension]||'application/octet-stream';
}
export async function fetchPrivateDocument(id,fetcher=fetch){
 if(!validDocumentId(id))throw Error('This document link is incomplete. Select the document from its job record.');
 const response=await fetcher('/api/evidence/'+encodeURIComponent(id));
 if(!response.ok){let message;try{message=(await response.json()).error;}catch{}
  throw Error(message||(response.status===401?'Sign in to open this private document.':'The saved document could not be opened. Please try again.'));
 }
 const name=attachmentName(response.headers.get('Content-Disposition'));
 const bytes=await response.arrayBuffer();
 return {name,blob:new Blob([bytes],{type:documentMime(name)})};
}
