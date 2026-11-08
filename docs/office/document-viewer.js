import {fetchPrivateDocument} from './document-access.js';
export async function showDocumentViewer({db,loginURL}){
 const status=document.querySelector('#document-status'),preview=document.querySelector('#document-preview'),actions=document.querySelector('#document-actions'),retry=document.querySelector('#document-retry');
 let objectURL='';
 async function load(){
  status.textContent='Opening your private document…';retry.hidden=true;actions.hidden=true;preview.replaceChildren();
  if(objectURL){URL.revokeObjectURL(objectURL);objectURL='';}
  try{
   const {data:{session},error}=await db.auth.getSession();if(error)throw error;
   if(!session){location.replace(loginURL);return;}
   const file=await fetchPrivateDocument(new URL(location.href).searchParams.get('id'));
   objectURL=URL.createObjectURL(file.blob);document.querySelector('#document-name').textContent=file.name;
   const save=document.querySelector('#document-save'),open=document.querySelector('#document-open');
   save.href=objectURL;save.download=file.name;open.href=objectURL;actions.hidden=false;
   if(file.blob.type==='application/pdf'){
    const frame=document.createElement('iframe');frame.title='Saved document preview';frame.src=objectURL;preview.append(frame);
    open.textContent='Open PDF / print';status.textContent='If the preview is blank on your phone, tap Save PDF or Open PDF / print.';save.textContent='Save PDF';
   }else if(file.blob.type.startsWith('image/')){
    const image=document.createElement('img');image.alt='Saved document';image.src=objectURL;preview.append(image);
    open.textContent='Open image';save.textContent='Save image';status.textContent='The original uploaded file is ready.';
   }else{
    open.textContent='Open file';save.textContent='Save file';status.textContent='Save this file and open it in Word or the application for this file type.';
   }
  }catch(error){status.textContent=error.message||'Unable to open this document.';retry.hidden=false;}
 }
 retry.onclick=load;window.addEventListener('pagehide',()=>{if(objectURL)URL.revokeObjectURL(objectURL);});await load();
}
