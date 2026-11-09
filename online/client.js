import {createClient} from '@supabase/supabase-js';
import {officeLoginURL,documentURL} from './document-access.js';
import {setupOfficeLogin} from './auth-login.js';
if(location.protocol!=='https:'){
 const main=document.createElement('main');main.className='customer-main';const title=document.createElement('h1');title.textContent='Secure connection required';const message=document.createElement('p');message.textContent='Administrator sign-in is blocked over HTTP. Enable HTTPS for the GitHub Pages custom domain before entering your email or password.';const link=document.createElement('a');const secure=new URL(location.href);secure.protocol='https:';link.href=secure.href;link.textContent='Open HTTPS office';main.append(title,message,link);document.body.replaceChildren(main);throw Error('HTTPS required for the office');
}
const project='https://uuwaomequwaktlvgmaid.supabase.co';
// This publishable key is deliberately public. RLS and verified administrator access protect data.
const key='sb_publishable_M5JNDnIHWqObZd8iwVwc4A_ug3IxVYJ';
const recoveryRequested=new URLSearchParams(location.hash.slice(1)).get('type')==='recovery';
const db=createClient(project,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const nativeFetch=window.fetch.bind(window);
const loginURL=officeLoginURL(location.href);
window.fetch=async(input,options={})=>{
 const path=typeof input==='string'?input:'';
 if(!path.startsWith('/api/'))return nativeFetch(input,options);
 if(path==='/api/logout'){await db.auth.signOut();return new Response('{}',{headers:{'Content-Type':'application/json'}});}
 const {data:{session}}=await db.auth.getSession();if(!session){location.replace(loginURL);throw Error('Administrator login required');}
 const [route,query]=path.slice(5).split('?');const target=new URL(project+'/functions/v1/office-api');target.searchParams.set('path',route);for(const [k,v] of new URLSearchParams(query))target.searchParams.set(k,v);
 const res=await nativeFetch(target,{...options,headers:{...options.headers,apikey:key,Authorization:'Bearer '+session.access_token}});
 if(res.status===401){await db.auth.signOut();location.replace(loginURL);}return res;
};
async function download(path,name){const res=await fetch(path);if(!res.ok)throw Error((await res.json()).error);const url=URL.createObjectURL(await res.blob());const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
document.addEventListener('click',async e=>{const a=e.target.closest('a');if(!a)return;const path=a.getAttribute('href');if(path==='/transport-packet.pdf'||path?.startsWith('/api/evidence/')){e.preventDefault();try{if(path.startsWith('/api/evidence/')){location.href=documentURL(decodeURIComponent(path.slice('/api/evidence/'.length)),location.href);return;}await download('/api/source-packet','transport-packet.pdf');}catch(err){alert(err.message);}}});
if(document.querySelector('#document-viewer')){
 await (await import('./document-viewer.js')).showDocumentViewer({db,loginURL});
}else if(document.querySelector('#login')){
 let loginStorage;try{loginStorage=window.localStorage;}catch{/* Storage may be disabled by the browser. */}
 await setupOfficeLogin({db,document,location,storage:loginStorage,recoveryRequested});
}else{
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user){location.replace(loginURL);}else{const access=await db.rpc('office_access');if(access.error||!access.data){await db.auth.signOut();location.replace(loginURL);}else{document.querySelector('.avatar span').textContent=user.email;await import('./app.js');}}
}

