import {dateValid} from './compliance.js';
import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
export const formCatalog=[
{id:'carrier',title:'KYTC TC 95-1 carrier / credential application',pages:[33,34,35,36,37,38],url:'https://drive.ky.gov/Motor-Carriers/Pages/Commercial-Motor-Vehicle-Credentials.aspx'},
{id:'irp-b',title:'IRP Schedule B',pages:[39],url:'https://drive.ky.gov/Motor-Carriers/Pages/IRP.aspx'},
{id:'cdl',title:'CDL self-certification TC 94-169',pages:[40,41],url:'https://drive.ky.gov/Drivers/Pages/CDL.aspx'},
{id:'clearance',title:'Route / height clearance TC 95-625',pages:[42],url:'https://drive.ky.gov/Motor-Carriers/Overweight-Over-Dimensional/Pages/OWOD-Permits.aspx'},
{id:'hire',title:'Kentucky new-hire report',pages:[43],url:'https://onestop.ky.gov/manage/Pages/employees.aspx'},
{id:'w4',title:'Employee W-4 (packet edition)',pages:[44,45,46,47,48],url:'https://www.irs.gov/forms-pubs/about-form-w-4'},
{id:'k4',title:'Kentucky K-4 (packet edition)',pages:[49,50],url:'https://revenue.ky.gov/Business/Pages/Employer-Payroll-Withholding.aspx'},
{id:'i9',title:'Employment eligibility I-9',pages:[51,52,53,54],url:'https://www.uscis.gov/i-9'},
{id:'w9',title:'W-9 taxpayer information',pages:[55],url:'https://www.irs.gov/forms-pubs/about-form-w-9'},
{id:'2290',title:'Form 2290 and Schedule 1 (packet edition)',pages:[56,57,58,59,60,61],url:'https://www.irs.gov/forms-pubs/about-form-2290'},
{id:'property',title:'Business personal property 62A500 (packet edition)',pages:[62,63,64,65,66],url:'https://revenue.ky.gov/Property/Business-Personal-Property/pages/default.aspx'},
{id:'irp-c',title:'IRP Schedule C',pages:[69,70],url:'https://drive.ky.gov/Motor-Carriers/Pages/IRP.aspx'},
{id:'irp-lease',title:'IRP operational lease',pages:[71],url:'https://drive.ky.gov/Motor-Carriers/Pages/IRP.aspx'}
];
export function validateForm(b){const def=formCatalog.find(d=>d.id===b.formId);if(!def)throw Error('Choose a supported form');if(!String(b.title||'').trim())throw Error('Name this document');if(!['Draft','Ready for review','Submitted','Accepted'].includes(b.status))throw Error('Invalid filing status');if(!Array.isArray(b.fields)||b.fields.length>400)throw Error('Invalid form answers');for(const f of b.fields){if(!Number.isInteger(f.page)||f.page<1||f.page>def.pages.length||!Number.isFinite(f.x)||!Number.isFinite(f.y)||f.x<0||f.y<0||f.x>1000||f.y>1500||typeof f.text!=='string'||f.text.length>500||!Number.isFinite(f.size)||f.size<6||f.size>30)throw Error('Invalid positioned answer');if(!/^[\x20-\x7E\r\n]*$/.test(f.text))throw Error('PDF answers currently support standard English text; replace unsupported characters');}if(b.status!=='Draft'&&!b.editionConfirmed)throw Error('Confirm the current form edition before changing filing status');if(b.submittedOn&&!dateValid(b.submittedOn))throw Error('Enter a valid submission date');if(['Submitted','Accepted'].includes(b.status)&&(!b.submittedOn||!String(b.receipt||'').trim()))throw Error('Record submission date and receipt/reference; saving a PDF is not submitting it');}
export async function renderForm(packetBytes,formId,fields=[]){const d=formCatalog.find(d=>d.id===formId);if(!d)throw Error('Form not found');const src=await PDFDocument.load(packetBytes),out=await PDFDocument.create();if(Math.max(...d.pages)>src.getPageCount())throw Error('The source packet does not contain these form pages');const pages=await out.copyPages(src,d.pages.map(n=>n-1));pages.forEach(p=>out.addPage(p));const font=await out.embedFont(StandardFonts.Helvetica);for(const f of fields){const p=out.getPage(f.page-1);if(f.x>p.getWidth()||f.y>p.getHeight())throw Error('Answer lies outside the page');p.drawText(f.text,{x:f.x,y:f.y,size:f.size,font,color:rgb(0,0,.35),lineHeight:f.size+2});}return out.save();}
