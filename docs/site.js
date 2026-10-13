const recipient='j.h.outlawmovers@gmail.com';
document.querySelector('#quote-form').addEventListener('submit',e=>{
 e.preventDefault();const d=Object.fromEntries(new FormData(e.target));
 const text=`Hello Outlaw Movers,\n\nI would like to discuss a project or service.\nService: ${d.service}\n\nName: ${d.name}\nPhone: ${d.phone}\nPickup: ${d.origin||'To be discussed'}\nDelivery: ${d.destination||'Not applicable / to be discussed'}\nPreferred date: ${d.date||'Flexible'}\nHome / equipment / item: ${d.unit||'To be confirmed'}\nOther details: ${d.notes||'None'}\n\nPlease contact me to confirm the details.`;
 document.querySelector('#email-text').value=text;document.querySelector('#email-fallback').hidden=false;
 document.querySelector('#form-status').textContent='Inquiry prepared. Open the email draft below and send it to submit your request.';
 document.querySelector('#email-open').href=`mailto:${recipient}?subject=${encodeURIComponent(d.service+' inquiry — '+d.name)}&body=${encodeURIComponent(text)}`;
});
document.querySelector('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.querySelector('#email-text').value);document.querySelector('#form-status').textContent='Inquiry copied. Paste it into an email and send it to '+recipient;}catch{document.querySelector('#email-text').select();document.querySelector('#form-status').textContent='Select and copy the inquiry text, then send it by email.';}});
