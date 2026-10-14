import {mkdirSync,readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {build} from 'esbuild';
const out='docs/office';mkdirSync(out+'/vendor',{recursive:true});
let html=readFileSync('public/index.html','utf8').replace('href="/style.css"','href="./style.css"').replace('src="/app.js"','src="./client.js"').replace('● Local office workspace','● Private online office').replace('Kristin Canada','Administrator').replace('src="/assets/outlaw-brand.png"','src="../assets/outlaw-brand.png"');
writeFileSync(out+'/index.html',html);copyFileSync('public/style.css',out+'/style.css');
for(const file of ['app.js','compliance-ui.js','form-editor.js','operations-ui.js']){
 let s=readFileSync('public/'+file,'utf8');
 s=s.replace("from '/vendor/pdf.mjs'","from './vendor/pdf.mjs'").replace("='/vendor/pdf.worker.mjs'","='./vendor/pdf.worker.mjs'").replace("location.href='/login'","location.href='./login.html'");
 if(file==='app.js'){
 s=s.replaceAll('/assets/outlaw-brand.png','../assets/outlaw-brand.png');
 s=s.replace('Customers can request a transport quote. Use “Customer link” on a job to share its private tracking page. Contact drafts stay here until staff send them separately.','Log customer calls, messages and drafts here. Contact customers by phone or email; the online customer portal is not connected.');
 s=s.replace('The server also retains these records in its local SQLite database.','Records are saved privately in Supabase. This JSON export includes records and recent history, but not document bytes.');
 s=s.replace(/<button id="portal"[^>]*>.*?<\/button>/g,'');
 s=s.replace(/<button data-link="\$\{j.id\}"[^>]*>.*?<\/button>/g,'');
 }
 writeFileSync(out+'/'+file,s);
}
copyFileSync('node_modules/pdfjs-dist/build/pdf.mjs',out+'/vendor/pdf.mjs');copyFileSync('node_modules/pdfjs-dist/build/pdf.worker.mjs',out+'/vendor/pdf.worker.mjs');
await build({entryPoints:['online/client.js'],bundle:true,format:'esm',target:'es2022',outfile:out+'/client.js',minify:true,external:['./app.js']});
writeFileSync(out+'/login.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Outlaw Movers • Administrator login</title><link rel="stylesheet" href="./style.css"></head><body><main class="customer-main"><header><div class="brand"><span class="logo-badge"><img src="../assets/outlaw-brand.png" alt="Outlaw Movers LLC truck and cowboy skull logo"></span><strong>OUTLAW MOVERS LLC</strong></div><span>Private online office</span></header><div id="content"><h1>Administrator login</h1><p>Sign in with your verified, authorized account. Records and documents are private.</p><section class="panel"><form id="login"><label class="field">Email<input name="email" type="email" autocomplete="username" required></label><label class="field">Password<input name="password" type="password" minlength="12" autocomplete="current-password" required></label><p id="error" role="status"></p><button class="primary">Sign in</button><button type="button" id="create-account">Create my account</button><button type="button" id="reset-password">Reset password</button><button type="button" id="update-password" hidden>Save new password</button></form></section><p>First visit: create your account, confirm the email, then sign in. Only approved, verified accounts can open office records.</p><a href="../">Public website</a></div></main><script type="module" src="./client.js"></script></body></html>`);
