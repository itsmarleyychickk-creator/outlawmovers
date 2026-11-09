import test from 'node:test';
import assert from 'node:assert/strict';
import {setupOfficeLogin} from '../online/auth-login.js';

const ROOT='https://outlawmoversllc.com/office/';
const DOC='11111111-2222-4333-8444-555555555555';
function fixture(options={}){
 const calls=[],moves=[],queue=[],saved=new Map();
 const state={session:options.session||null,allowed:options.allowed??true,rpcError:null,inAuthCallback:false};
 const email={value:'office@example.com',reportValidity:()=>true};
 const password={value:'',autocomplete:'current-password'};
 const form={elements:{email,password}};
 const nodes={'#login':form,'#error':{textContent:''},'#password-options':{open:false},'#email-link':{disabled:false},'#update-password':{hidden:true},'#password-sign-in':{hidden:false},'#reset-password':{},'#create-account':{}};
 let callback;
 const auth={
  getSession:async()=>{assert.equal(state.inAuthCallback,false);calls.push(['getSession']);return{data:{session:state.session},error:null};},
  getUser:async()=>{calls.push(['getUser']);return{data:{user:state.session?{email:'office@example.com'}:null},error:null};},
  signInWithOtp:async args=>{calls.push(['otp',args]);return{error:null};},
  signInWithPassword:async args=>{calls.push(['password',args]);state.session={};return{error:null};},
  updateUser:async args=>{calls.push(['update',args]);return{error:null};},
  signOut:async args=>{calls.push(['signOut',args]);state.session=null;return{error:null};},
  resetPasswordForEmail:async(...args)=>{calls.push(['reset',args]);return{error:null};},
  signUp:async args=>{calls.push(['signup',args]);return{error:null};},
  onAuthStateChange:fn=>{callback=fn;return{data:{subscription:{unsubscribe(){}}}};}
 };
 const db={auth,rpc:async name=>{calls.push(['rpc',name]);return{data:state.allowed,error:state.rpcError};}};
 const location={href:options.href||ROOT+'login.html',replace:url=>moves.push(url)};
 const storage={getItem:key=>saved.get(key)||null,setItem:(key,val)=>saved.set(key,val),removeItem:key=>saved.delete(key)};
 const setup=()=>setupOfficeLogin({db,document:{querySelector:key=>nodes[key]},location,storage:options.storage||storage,recoveryRequested:options.recovery||false,schedule:fn=>queue.push(fn),now:()=>1000});
 const fire=(event,session)=>{state.inAuthCallback=true;callback(event,session);state.inAuthCallback=false;};
 return{setup,state,calls,moves,nodes,saved,email,password,queue,fire};
}

test('a remembered verified session enters the requested private document',async()=>{
 const f=fixture({session:{},href:ROOT+'login.html?next='+encodeURIComponent('./document.html?id='+DOC)});await f.setup();
 assert.deepEqual(f.moves,[ROOT+'document.html?id='+DOC]);assert.ok(f.calls.some(c=>c[0]==='getUser'));assert.ok(f.calls.some(c=>c[0]==='rpc'&&c[1]==='office_access'));
 assert.equal(f.saved.get('om-office-login-email'),'office@example.com');assert.equal([...f.saved.values()].some(v=>v.includes('password')),false);
});
test('passwordless login requests a link without creating accounts or requiring a password',async()=>{
 const f=fixture();const app=await f.setup();await app.sendLink();
 assert.deepEqual(f.calls.find(c=>c[0]==='otp')[1],{email:'office@example.com',options:{shouldCreateUser:false,emailRedirectTo:ROOT+'login.html'}});
 assert.equal(f.moves.length,0);assert.match(f.nodes['#error'].textContent,/one-time sign-in link/);
});
test('an auth callback releases its lock before session verification',async()=>{
 const f=fixture();await f.setup();f.state.session={};f.fire('SIGNED_IN',{});assert.equal(f.moves.length,0);assert.equal(f.queue.length,1);
 f.queue.shift()();await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(f.moves,[ROOT]);
});
test('an authenticated account outside the allowlist stays out of the office',async()=>{
 const f=fixture({session:{},allowed:false});await f.setup();assert.equal(f.moves.length,0);
 assert.deepEqual(f.calls.find(c=>c[0]==='signOut')[1],{scope:'local'});assert.match(f.nodes['#error'].textContent,/does not have administrator access/);
});
test('a temporary authorization failure does not revoke a remembered session',async()=>{
 const f=fixture({session:{}});f.state.rpcError=Error('Connection unavailable');const app=await f.setup();
 assert.equal(f.moves.length,0);assert.equal(f.calls.some(c=>c[0]==='signOut'),false);
 f.state.rpcError=null;await app.resume();assert.deepEqual(f.moves,[ROOT]);
});
test('password recovery remains on the form and enters the office only after saving',async()=>{
 const f=fixture({session:{},recovery:true});const app=await f.setup();assert.equal(f.moves.length,0);assert.equal(f.nodes['#update-password'].hidden,false);assert.equal(f.nodes['#password-options'].open,true);
 f.password.value='test-only-new-password-123';await app.updatePassword();assert.deepEqual(f.moves,[ROOT]);assert.equal(f.calls.some(c=>c[0]==='signOut'),false);
 assert.equal([...f.saved.values()].includes(f.password.value),false);
});
test('a PASSWORD_RECOVERY event prevents a scheduled sign-in redirect',async()=>{
 const f=fixture();await f.setup();f.state.session={};f.fire('SIGNED_IN',{});f.fire('PASSWORD_RECOVERY',{});
 f.queue.shift()();await new Promise(resolve=>setImmediate(resolve));assert.equal(f.moves.length,0);assert.equal(f.nodes['#update-password'].hidden,false);
});
test('a normal password login retains the same authorization checks',async()=>{
 const f=fixture();const app=await f.setup();f.password.value='test-only-current-password-123';await app.signInWithPassword();assert.deepEqual(f.moves,[ROOT]);assert.ok(f.calls.some(c=>c[0]==='rpc'));
});
test('tampered remembered destinations cannot redirect outside the office',async()=>{
 const f=fixture({session:{}});f.saved.set('om-office-login-return',JSON.stringify({next:'https://outside.example/steal',expires:999999}));await f.setup();assert.deepEqual(f.moves,[ROOT]);
});
test('unavailable convenience storage does not block a valid session',async()=>{
 const f=fixture({session:{},storage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}}});await f.setup();assert.deepEqual(f.moves,[ROOT]);
});
