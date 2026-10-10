import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,copyFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync,backup} from 'node:sqlite';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
if(Number(process.versions.node.split('.')[0])<24){console.error('Install Node.js 24 or newer from nodejs.org first.');process.exit(1);}
const data=resolve(root,'data');mkdirSync(data,{recursive:true});
const dbPath=resolve(data,'office.sqlite'),day=new Date().toLocaleDateString('en-CA',{timeZone:'America/Chicago'}),backups=resolve(root,'backups');
try{if(existsSync(dbPath)){mkdirSync(backups,{recursive:true});const dest=resolve(backups,day+'-office.sqlite');if(!existsSync(dest)){const db=new DatabaseSync(dbPath);await backup(db,dest);db.close();console.log('Saved a local daily database backup.');}const pdf=resolve(data,'transport-packet.pdf');if(existsSync(pdf)&&!existsSync(resolve(backups,'transport-packet.pdf')))copyFileSync(pdf,resolve(backups,'transport-packet.pdf'));}}catch(e){console.error('Backup could not be saved: '+e.message+'. Please back up your office folder manually.');}
const child=spawn(process.execPath,[resolve(root,'server.js')],{cwd:root,stdio:['inherit','pipe','inherit'],env:{...process.env,HOST:'127.0.0.1'}});
let opened=false;child.stdout.on('data',chunk=>{process.stdout.write(chunk);if(!opened&&String(chunk).includes('listening on port')){opened=true;console.log('Office is ready. Keep this window open while using the app.');if(process.platform==='win32'){
 spawn('cmd.exe',['/c','start','',`http://127.0.0.1:${process.env.PORT||3000}/login`],{windowsHide:true,stdio:'ignore'});
 if(!process.env.OFFICE_PASSWORD)spawn('notepad.exe',[resolve(data,'office-password.txt')],{stdio:'ignore'});
}else console.log('Use the office login on port '+(process.env.PORT||3000)+'.');}});
child.on('error',e=>{console.error('Could not start the office: '+e.message);process.exitCode=1;});child.on('exit',code=>{if(code)console.error('Office stopped. If port 3000 is already in use, close the previous office window first.');process.exitCode=code||0;});
process.on('SIGINT',()=>child.kill('SIGINT'));process.on('SIGTERM',()=>child.kill('SIGTERM'));
