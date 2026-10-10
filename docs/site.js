const recipient='John.henry@outlawmoversllc.com';
document.querySelector('#quote-form').addEventListener('submit',e=>{
 e.preventDefault();const d=Object.fromEntries(new FormData(e.target));
 const text=`Hello Outlaw Movers,\n\nI would like to discuss a mobile-home transport quote.\n\nName: ${d.name}\nPhone: ${d.phone}\nPickup: ${d.origin}\nDelivery: ${d.destination}\nPreferred date: ${d.date||'Flexible'}\nHome / dimensions: ${d.unit||'To be confirmed'}\nOther details: ${d.notes||'None'}\n\nPlease contact me to confirm the details.`;
 document.querySelector('#email-text').value=text;document.querySelector('#email-fallback').hidden=false;
 document.querySelector('#form-status').textContent='Inquiry prepared. Open the email draft below and send it to submit your request.';
 document.querySelector('#email-open').href=`mailto:${recipient}?subject=${encodeURIComponent('Mobile-home transport inquiry — '+d.name)}&body=${encodeURIComponent(text)}`;
});
document.querySelector('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.querySelector('#email-text').value);document.querySelector('#form-status').textContent='Inquiry copied. Paste it into an email and send it to '+recipient;}catch{document.querySelector('#email-text').select();document.querySelector('#form-status').textContent='Select and copy the inquiry text, then send it by email.';}});
