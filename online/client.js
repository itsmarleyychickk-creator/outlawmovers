import {createClient} from '@supabase/supabase-js';
const project='https://uuwaomequwaktlvgmaid.supabase.co';
// This publishable key is deliberately public. RLS and verified administrator access protect data.
const key='sb_publishable_M5JNDnIHWqObZd8iwVwc4A_ug3IxVYJ';
const db=createClient(project,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const nativeFetch=window.fetch.bind(window);
const loginURL=new URL('login.html',location.href).href;
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
document.addEventListener('click',async e=>{const a=e.target.closest('a');if(!a)return;const path=a.getAttribute('href');if(path==='/transport-packet.pdf'||path?.startsWith('/api/evidence/')){e.preventDefault();try{await download(path==='/transport-packet.pdf'?'/api/source-packet':path,path==='/transport-packet.pdf'?'transport-packet.pdf':a.textContent.replace(' ↓','').trim());}catch(err){alert(err.message);}}});
if(document.querySelector('#login')){
 const form=document.querySelector('#login'),status=document.querySelector('#error');
 const show=e=>{status.textContent=e?.message||String(e);};
 form.onsubmit=async e=>{e.preventDefault();try{status.textContent='Signing in…';const f=new FormData(form),r=await db.auth.signInWithPassword({email:String(f.get('email')).trim(),password:String(f.get('password'))});if(r.error)throw r.error;const access=await db.rpc('office_access');if(access.error||!access.data){await db.auth.signOut();throw Error('This verified account does not have administrator access.');}location.href='./';}catch(err){show(err);}};
 document.querySelector('#create-account').onclick=async()=>{try{if(!form.reportValidity())return;const f=new FormData(form),r=await db.auth.signUp({email:String(f.get('email')).trim(),password:String(f.get('password')),options:{emailRedirectTo:new URL('./',location.href).href}});if(r.error)throw r.error;show('Check your email to confirm your account, then return here and sign in. Creating an account does not grant office access.');}catch(e){show(e);}};
 document.querySelector('#reset-password').onclick=async()=>{try{const email=form.elements.email.value.trim();if(!email)throw Error('Enter your email first.');const r=await db.auth.resetPasswordForEmail(email,{redirectTo:new URL('login.html',location.href).href});if(r.error)throw r.error;show('If the account exists, a password reset email will arrive.');}catch(e){show(e);}};
 let recovery=location.hash.includes('type=recovery');db.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY'){recovery=true;document.querySelector('#update-password').hidden=false;}});
 if(recovery)document.querySelector('#update-password').hidden=false;
 document.querySelector('#update-password').onclick=async()=>{try{const password=form.elements.password.value;if(password.length<12)throw Error('Use at least 12 characters.');const r=await db.auth.updateUser({password});if(r.error)throw r.error;await db.auth.signOut();show('Password updated. Sign in with the new password.');document.querySelector('#update-password').hidden=true;}catch(e){show(e);}};
}else{
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user){location.replace(loginURL);}else{const access=await db.rpc('office_access');if(access.error||!access.data){await db.auth.signOut();location.replace(loginURL);}else{document.querySelector('.avatar span').textContent=user.email;await import('./app.js');}}
}
