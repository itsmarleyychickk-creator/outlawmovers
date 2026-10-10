import {execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {resolve,dirname} from 'node:path';
import {mkdirSync} from 'node:fs';
import {requirements} from '../compliance.js';
const pdf=resolve(process.argv[2]||'data/transport-packet.pdf');
const pages=execFileSync('pdftotext',['-f','1','-l','3','-layout',pdf,'-'],{encoding:'utf8',maxBuffer:2000000});
const get=re=>pages.match(re)?.[1]?.trim()||'';
const dbPath=process.env.DATABASE_PATH||resolve('data/office.sqlite');mkdirSync(dirname(dbPath),{recursive:true});const db=new DatabaseSync(dbPath);
db.exec('CREATE TABLE IF NOT EXISTS records (kind TEXT NOT NULL,id TEXT PRIMARY KEY,body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY,recordId TEXT NOT NULL,body TEXT NOT NULL);');
const prefill={standing:{organization:get(/Kentucky SOS organization #:\s*([^\n]+)/),formed:''},tax:{ein:get(/Federal EIN:\s*([0-9-]+)/)},insurance:{insurer:get(/Insurance company:\s*([^\n]+)/),policy:get(/Policy number:\s*([^\n]+)/),agent:get(/Agent:\s*([^\n]+)/),coverage:'Transport coverage and limits need confirmation'}};
const formation=get(/Organization date:\s*([^\n]+)/);if(formation&&!isNaN(Date.parse(formation)))prefill.standing.formed=new Date(formation).toISOString().slice(0,10);
const period=get(/Policy period:\s*([^\n]+)/).split(' - ');if(period.length===2){for(const [i,k]of ['effective','expires'].entries())if(!isNaN(Date.parse(period[i])))prefill.insurance[k]=new Date(period[i]).toISOString().slice(0,10);}
let count=0;db.exec('BEGIN');try{for(const d of requirements){const id='setup-'+d.id,row=db.prepare('SELECT body FROM records WHERE id=?').get(id),before=row?JSON.parse(row.body):null;
 const r=before||{id,requirementId:d.id,title:d.title,status:'Not started',applicability:'Needs review',values:{},nextDue:'',remindDays:30,recurrence:'None',notes:'',completedSteps:[],version:1};let changed=!before;
 for(const [k,v]of Object.entries(prefill[d.id]||{}))if(v&&!r.values[k]){r.values[k]=v;count++;changed=true;}
 if(changed){r.notes=[r.notes,'Imported from the supplied packet; unverified. Earlier pages conflict with later prefilled details. Confirm original evidence and current agency/policy records before marking complete.'].filter(Boolean).join('\n');r.updatedAt=new Date().toISOString();if(before)r.version++;db.prepare('INSERT INTO records VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run('compliance',id,JSON.stringify(r));db.prepare('INSERT INTO audit VALUES (?,?,?)').run(crypto.randomUUID(),id,JSON.stringify({recordId:id,action:'Unverified PDF information imported',at:r.updatedAt,before,after:r}));}}
 db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}db.close();console.log(`Imported ${count} available fields into private office storage; existing filled fields preserved. No source values printed.`);
