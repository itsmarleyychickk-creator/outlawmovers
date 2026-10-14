const recipient='j.h.outlawmovers@gmail.com';
document.querySelector('#quote-form').addEventListener('submit',e=>{
 e.preventDefault();const d=Object.fromEntries(new FormData(e.target));
 const text=`Hello Outlaw Movers,\n\nI would like to discuss a project or service.\nService: ${d.service}\n\nName: ${d.name}\nPhone: ${d.phone}\nPickup: ${d.origin||'To be discussed'}\nDelivery: ${d.destination||'Not applicable / to be discussed'}\nPreferred date: ${d.date||'Flexible'}\nHome / equipment / item: ${d.unit||'To be confirmed'}\nOther details: ${d.notes||'None'}\n\nPlease contact me to confirm the details.`;
 document.querySelector('#email-text').value=text;document.querySelector('#email-fallback').hidden=false;
 document.querySelector('#form-status').textContent='Inquiry prepared. Open the email draft below and send it to submit your request.';
 document.querySelector('#email-open').href=`mailto:${recipient}?subject=${encodeURIComponent(d.service+' inquiry — '+d.name)}&body=${encodeURIComponent(text)}`;
});
document.querySelector('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.querySelector('#email-text').value);document.querySelector('#form-status').textContent='Inquiry copied. Paste it into an email and send it to '+recipient;}catch{document.querySelector('#email-text').select();document.querySelector('#form-status').textContent='Select and copy the inquiry text, then send it by email.';}});

/* Only intentionally public sale listings belong in inventory.json. */
const inventoryList=document.querySelector('#inventory-list'), itemDialog=document.querySelector('#item-detail');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const price=i=>typeof i.price==='number'?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(i.price):'Call for price';
const safePhoto=s=>typeof s==='string'&&/^(assets\/|https:\/\/)/.test(s)?s:null;
let publicItems=[];
function openItem(id){
 const i=publicItems.find(i=>i.id===id);if(!i)return;
 document.querySelector('#item-content').innerHTML='<h2 id="item-title">'+esc(i.title)+'</h2><p class="sale-price">'+esc(price(i))+'</p><p>'+esc(i.status||'Available')+'</p>'+
 (i.photos||[]).filter(safePhoto).map(src=>'<img class="sale-photo" src="'+esc(src)+'" alt="'+esc(i.title)+'" loading="lazy">').join('')+
 '<p class="item-description">'+esc(i.description)+'</p><dl>'+
 Object.entries({'Condition':i.condition,'Make / model':i.makeModel,'Year':i.year,'Specifications':i.specifications,'Known issues':i.knownIssues,'Included':i.included,'Location':i.location,'Pickup / loading':i.pickup,'Payment terms':i.paymentTerms,'Listing ID':i.id}).filter(([,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=>'<dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd>').join('')+
 '</dl><p><a class="button" href="tel:9312573486">Call John about this item</a></p><p><a href="mailto:j.h.outlawmovers@gmail.com?subject='+encodeURIComponent('For sale inquiry: '+i.title+' ['+i.id+']')+'">Email about this item →</a></p><p class="fine">Contact us to confirm availability and arrange a time to view or pick up.</p>';
 if(!itemDialog.open)itemDialog.showModal();
}
document.querySelector('#item-close').addEventListener('click',()=>itemDialog.close());
inventoryList.addEventListener('click',e=>{const a=e.target.closest('[data-item]');if(a){e.preventDefault();history.replaceState(null,'',a.getAttribute('href'));openItem(a.dataset.item);}});
itemDialog.addEventListener('close',()=>{if(location.hash.startsWith('#item='))history.replaceState(null,'','#for-sale');});
window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#item='))openItem(decodeURIComponent(location.hash.slice(6)));});
fetch('inventory.json').then(r=>{if(!r.ok)throw new Error('Listings unavailable');return r.json();}).then(items=>{
 if(!Array.isArray(items))throw new Error('Invalid listings');
 publicItems=items.filter(i=>i&&typeof i.id==='string'&&typeof i.title==='string'&&i.status!=='Draft');
 inventoryList.innerHTML=publicItems.length?publicItems.map(i=>'<article class="sale-card">'+(safePhoto(i.photos?.[0])?'<img class="sale-photo" src="'+esc(i.photos[0])+'" alt="'+esc(i.title)+'" loading="lazy">':'')+'<span>'+esc(i.category||'For sale')+' · '+esc(i.status||'Available')+'</span><h3><a data-item="'+esc(i.id)+'" href="#item='+encodeURIComponent(i.id)+'">'+esc(i.title)+'</a></h3><p class="sale-price">'+esc(price(i))+'</p><p>'+esc(i.condition||'Contact us for condition details')+'</p><a class="button" data-item="'+esc(i.id)+'" href="#item='+encodeURIComponent(i.id)+'">View item details →</a></article>').join(''):'<div class="inventory-empty"><h3>Looking for your next find?</h3><p>Our online listings are being updated. Call John for current items, prices and availability.</p><a class="button" href="tel:9312573486">Call John · 931-257-3486</a></div>';
 if(location.hash.startsWith('#item='))openItem(decodeURIComponent(location.hash.slice(6)));
}).catch(()=>{inventoryList.innerHTML='<p>We couldn’t load the listings. Please call <a href="tel:9312573486">931-257-3486</a> for current items and prices.</p>';});
