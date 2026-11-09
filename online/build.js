import {mkdirSync,readFileSync,writeFileSync,copyFileSync,existsSync} from 'node:fs';
import {build} from 'esbuild';
const out='docs/office';mkdirSync(out+'/vendor',{recursive:true});mkdirSync('docs/assets',{recursive:true});
for(const file of ['document-access.js','document-viewer.js','document.html','auth-login.js','login.html'])copyFileSync('online/'+file,out+'/'+file);
let html=readFileSync('public/index.html','utf8').replace('href="/style.css"','href="./style.css"').replace('src="/app.js"','src="./client.js"').replace('● Local office workspace','● Private online office').replace('Kristin Canada','Administrator').replace('src="/assets/outlaw-brand.png"','src="../assets/outlaw-brand.png"');
writeFileSync(out+'/index.html',html);copyFileSync('public/style.css',out+'/style.css');
for(const file of ['customer-profile-model.js','customer-profile-ui.js','customer-profile-pdf.js','filing-ui.js','reusable-form-model.js','reusable-form-pdf.js','reusable-form-ui.js','customer-email-ui.js','customer-email-model.js','county-workflow-ui.js','county-workflow-model.js','app.js','compliance-ui.js','form-editor.js','operations-ui.js','fleet-ui.js']){
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
if(existsSync('public/assets/office-logo.png'))copyFileSync('public/assets/office-logo.png','docs/assets/office-logo.png');
copyFileSync('node_modules/pdf-lib/dist/pdf-lib.esm.min.js',out+'/vendor/pdf-lib.esm.min.js');copyFileSync('node_modules/pdf-lib/LICENSE.md',out+'/vendor/pdf-lib-LICENSE.md');
copyFileSync('node_modules/pdfjs-dist/build/pdf.mjs',out+'/vendor/pdf.mjs');copyFileSync('node_modules/pdfjs-dist/build/pdf.worker.mjs',out+'/vendor/pdf.worker.mjs');
await build({entryPoints:['online/client.js'],bundle:true,format:'esm',target:'es2022',outfile:out+'/client.js',minify:true,external:['./app.js','./document-access.js','./document-viewer.js','./auth-login.js']});

