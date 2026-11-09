import {officeReturnURL} from './document-access.js';

const EMAIL_KEY='om-office-login-email';
const RETURN_KEY='om-office-login-return';

// Authentication is still verified by Supabase and the private office allowlist.
// Only a convenience email and a validated return destination are stored here.
export async function setupOfficeLogin({db,document,location,storage,recoveryRequested=false,schedule=setTimeout,now=Date.now}){
 const form=document.querySelector('#login'),status=document.querySelector('#error');
 const passwordOptions=document.querySelector('#password-options');
 const emailLink=document.querySelector('#email-link'),savePassword=document.querySelector('#update-password');
 const passwordSignIn=document.querySelector('#password-sign-in');
 let recovery=recoveryRequested,resuming=null,navigating=false;
 const show=value=>{status.textContent=value?.message||String(value);};
 const read=key=>{try{return storage?.getItem(key);}catch{return null;}};
 const write=(key,value)=>{try{storage?.setItem(key,value);}catch{/* Login still works when convenience storage is unavailable. */}};
 const remove=key=>{try{storage?.removeItem(key);}catch{/* No credential is stored by these helpers. */}};
 const email=()=>{const field=form.elements.email;if(!field.value.trim()||!field.reportValidity())throw Error('Enter a valid email address.');return field.value.trim();};
 const password=()=>{const field=form.elements.password;if(field.value.length<12)throw Error('Use at least 12 characters.');return field.value;};
 const returnURL=()=>{
  const explicit=new URL(location.href);
  if(explicit.searchParams.has('next'))return officeReturnURL(location.href);
  try{
   const saved=JSON.parse(read(RETURN_KEY)||'null');
   if(saved&&saved.expires>now()){
    const check=new URL('login.html',location.href);check.searchParams.set('next',saved.next);
    return officeReturnURL(check.href);
   }
  }catch{/* Ignore malformed or expired convenience data. */}
  return officeReturnURL(location.href);
 };
 const rememberReturn=()=>{
  const target=new URL(officeReturnURL(location.href));
  if(target.pathname.endsWith('/document.html'))write(RETURN_KEY,JSON.stringify({next:target.pathname+target.search,expires:now()+30*60*1000}));
  else remove(RETURN_KEY);
 };
 const showRecovery=()=>{
  recovery=true;passwordOptions.open=true;savePassword.hidden=false;passwordSignIn.hidden=true;
  form.elements.password.autocomplete='new-password';
  show('Enter a new password, then choose Save new password.');
 };
 async function resume(){
  if(recovery||navigating)return false;
  if(resuming)return resuming;
  resuming=(async()=>{
   const current=await db.auth.getSession();if(current.error)throw current.error;
   if(!current.data.session)return false;
   const verified=await db.auth.getUser();if(verified.error)throw verified.error;
   if(!verified.data.user)return false;
   const access=await db.rpc('office_access');if(access.error)throw access.error;
   if(!access.data){await db.auth.signOut({scope:'local'});throw Error('This verified account does not have administrator access.');}
   if(recovery)return false;
   write(EMAIL_KEY,verified.data.user.email||'');
   const destination=returnURL();remove(RETURN_KEY);navigating=true;
   show('You are signed in. Opening your office…');location.replace(destination);return true;
  })();
  try{return await resuming;}finally{resuming=null;}
 }
 async function sendLink(){
  const address=email();rememberReturn();emailLink.disabled=true;
  try{
   show('Requesting your sign-in email…');
   const result=await db.auth.signInWithOtp({email:address,options:{shouldCreateUser:false,emailRedirectTo:new URL('login.html',location.href).href}});
   if(result.error)throw result.error;
   write(EMAIL_KEY,address);
   show('Check your email for a one-time sign-in link. Open it on this device to enter the office without a password.');
  }finally{emailLink.disabled=false;}
 }
 async function signInWithPassword(){
  show('Signing in…');
  const result=await db.auth.signInWithPassword({email:email(),password:password()});
  if(result.error)throw result.error;await resume();
 }
 async function updatePassword(){
  const result=await db.auth.updateUser({password:password()});if(result.error)throw result.error;
  recovery=false;savePassword.hidden=true;passwordSignIn.hidden=false;await resume();
 }
 const handle=action=>async event=>{event?.preventDefault();try{await action();}catch(error){show(error);}};
 form.onsubmit=handle(()=>recovery?updatePassword():passwordOptions.open?signInWithPassword():sendLink());
 emailLink.onclick=handle(sendLink);
 passwordSignIn.onclick=handle(signInWithPassword);
 savePassword.onclick=handle(updatePassword);
 document.querySelector('#reset-password').onclick=handle(async()=>{
  const result=await db.auth.resetPasswordForEmail(email(),{redirectTo:new URL('login.html',location.href).href});
  if(result.error)throw result.error;show('If the account exists, a password reset email will arrive.');
 });
 document.querySelector('#create-account').onclick=handle(async()=>{
  const result=await db.auth.signUp({email:email(),password:password(),options:{emailRedirectTo:new URL('login.html',location.href).href}});
  if(result.error)throw result.error;show('Check your email to confirm your account. Only approved accounts can access office records.');
 });
 if(!form.elements.email.value)form.elements.email.value=read(EMAIL_KEY)||'';
 if(recovery)showRecovery();
 // Defer Supabase calls until the auth event callback has released its lock.
 db.auth.onAuthStateChange((event,session)=>{
  if(event==='PASSWORD_RECOVERY'){showRecovery();return;}
  if(session&&!recovery&&(event==='SIGNED_IN'||event==='INITIAL_SESSION'))schedule(()=>{void resume().catch(show);},0);
 });
 try{await resume();}catch(error){show(error);}
 return {resume,sendLink,signInWithPassword,updatePassword};
}
