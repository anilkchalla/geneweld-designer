import {buildProduct} from './product.js';
import {renderProduct} from './product-view.js';
import {parseSequence,findTargets,design} from './design.js';
const $=id=>document.getElementById(id);
let latest=null;
const sampleGuide='ACGTACGTACGTACGTACGT';
const sampleDna='GCC'.repeat(24)+sampleGuide+'AGG'+'GCC'.repeat(32);
$('sequence').value=sampleDna.slice(0,28)+'['+sampleDna.slice(28,-24)+']'+sampleDna.slice(-24);
$('guide').value=sampleGuide;
$('gene').value='Demo sequence (synthetic)';
function status(message,kind='neutral'){$('status').textContent=message;$('status').className='status '+kind;}
function reset(){latest=null;$('junctions').innerHTML='<p class="placeholder">Generate a design to see both junction schematics and genomic flanks.</p>';for(const id of ['csv','fasta','json','donor-fasta','allele-fasta'])$(id).disabled=true;for(const id of ['five','three'])$(id).textContent='—';$('oligos').innerHTML='<p class="placeholder">Generate a design to see four oligonucleotides.</p>';$('warnings').textContent='';$('details').textContent='Spacer and frame-padding details will appear after analysis.';$('map').textContent='Target nucleotide-level annotation will appear here.';for(const id of ['exonVal','cutVal','pamVal','padVal'])$(id).textContent='—';}
$('file').addEventListener('change',async e=>{const f=e.target.files[0];if(f){$('sequence').value=await f.text();reset();status('Loaded '+f.name+'. Add exon brackets if not present.');}});
for(const id of ['sequence','guide','strand','position','length'])$(id).addEventListener('input',()=>{reset();status('Inputs changed. Analyze again to regenerate and verify outputs.');});
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderMap(r){const {dna,exonStart,exonEnd,site,cut,position}=r;let html='';const lo=Math.max(0,cut-64),hi=Math.min(dna.length,cut+64);for(let i=lo;i<hi;i++){if(i===cut)html+='<b class="cut" title="SpCas9 cut">│</b>';let kind=i>=site.pamStart&&i<site.pamEnd?'pam':i>=site.start&&i<site.end?'guide':i>=exonStart&&i<exonEnd?'exon':'flank';let c=i>=exonStart&&i<exonEnd?'p'+(((i-exonStart+position)%3+3)%3):'';html+=`<span class="base ${kind} ${c}" title="Base ${i+1}; ${kind}; ${c||'noncoding'}">${dna[i]}</span>`;if((i-lo+1)%40===0)html+='\n';}if(cut===hi)html+='<b class="cut">│</b>';$('map').innerHTML=`<div class="map-indices">Genomic bases ${lo+1}–${hi}, 1-based · cut between bases ${cut} / ${cut+1}</div><div class="bases">${html}</div>`;}
function render(r){renderProduct($('junctions'),r,r.product);$('exonVal').textContent=`${r.exonStart+1}–${r.exonEnd}`;$('cutVal').textContent=`${r.cut} | ${r.cut+1}`;$('pamVal').textContent=r.site.pam;$('padVal').textContent=`${r.padLength} nt`;renderMap(r);$('five').textContent=r.five;$('three').textContent=r.three;$('details').innerHTML=`<div><b>5′ spacer:</b> <code>${r.leftSpacer}</code> · <b>3′ spacer:</b> <code>${r.rightSpacer}</code></div><div><b>Frame padding:</b> <code>${r.padding||'(none)'}</code> · <b>First exon base:</b> codon position ${r.position}</div><div><b>Cleavage:</b> ${r.site.strand} guide, target bases ${r.site.start+1}–${r.site.end}; PAM bases ${r.site.pamStart+1}–${r.site.pamEnd}</div>`;
$('oligos').innerHTML=Object.entries(r.oligos).map(([name,seq])=>`<div class="oligo"><div class="oligo-top"><b>${name}</b><span>${seq.length} nt</span><button data-copy="${name}" class="copy">Copy</button></div><code>${colorOligo(name,seq,r)}</code></div>`).join('');for(const btn of document.querySelectorAll('[data-copy]'))btn.addEventListener('click',async()=>{const s=r.oligos[btn.dataset.copy];try{await navigator.clipboard.writeText(s);btn.textContent='Copied!';}catch{btn.textContent='Select sequence';}});
$('warnings').innerHTML=r.warnings.length?'<b>Review warnings</b><ul>'+r.warnings.map(x=>'<li>'+escape(x)+'</li>').join('')+'</ul>':'<span class="success">✓ Automated sequence construction checks passed. Verify against vector and reference sequence.</span>';for(const id of ['csv','fasta','json','donor-fasta','allele-fasta'])$(id).disabled=false;}
function analyze(siteIndexOverride=null){reset();try{const p=parseSequence($('sequence').value);const s=findTargets(p.dna,$('guide').value,$('strand').value);if(!s.length)throw Error('No guide with an adjacent, correctly oriented NGG PAM exists in the supplied DNA.');const current=siteIndexOverride===null?0:Number(siteIndexOverride);$('match').innerHTML=s.map((x,i)=>`<option value="${i}">Match ${i+1}: ${x.start+1}–${x.end} (${x.strand}), cut ${x.cut}</option>`).join('');$('match').disabled=s.length<=1;$('match').value=String(current);const r=design({raw:$('sequence').value,guide:$('guide').value,strand:$('strand').value,position:$('position').value,armLength:$('length').value,siteIndex:current});r.product=buildProduct(r);if(!r.product.frameOK)throw Error('The assembled P2A coding frame does not match the supplied exon.');latest=r;render(r);status(`Design generated: ${s.length} matching target${s.length>1?'s':''}. ${r.warnings.length} review warning(s).`,'good');if(s.length>1)status(`Multiple matching sites (${s.length}). Select the correct target match; report corresponds to match ${current+1}.`,'warn');}catch(e){status(e.message,'bad');}}
$('analyze').addEventListener('click',()=>analyze());$('match').addEventListener('change',e=>analyze(e.target.value));
function save(ext,content,type){const blob=new Blob([content],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=($('gene').value||'geneweld').replace(/[^a-z0-9_-]+/gi,'_')+'_GeneWeld.'+ext;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
$('csv').addEventListener('click',()=>{if(!latest)return;save('csv','name,sequence_5_to_3,length_nt\n'+Object.entries(latest.oligos).map(([k,v])=>`${k},${v},${v.length}`).join('\n')+'\n','text/csv');});
$('fasta').addEventListener('click',()=>{if(!latest)return;save('fasta',Object.entries(latest.oligos).map(([k,v])=>`>${k}\n${v}`).join('\n')+'\n','text/plain');});
$('json').addEventListener('click',()=>{if(!latest)return;save('json',JSON.stringify({version:'1.2.0-beta.1',gene:$('gene').value,proteinInput:$('protein').value,proteinValidated:false,...latest},null,2),'application/json');});

$('donor-fasta').addEventListener('click',()=>{if(latest)save('donor.fasta',`>${($('gene').value||'design').replace(/[\r\n>]/g,'_')}|pPRISM_assembled_donor|predicted\n${latest.product.donor}\n`,'text/plain');});
$('allele-fasta').addEventListener('click',()=>{if(latest)save('genomic-product.fasta',`>${($('gene').value||'design').replace(/[\r\n>]/g,'_')}|predicted_genomic_product|supplied_context_only\n${latest.product.integrated}\n`,'text/plain');});

function colorOligo(name,seq,r){
  const span=(s,c)=>`<span class="dna-${c}">${s}</span>`;
  const isFive=name.startsWith('5'),reverse=name.endsWith('B'),tail=isFive?4:3;
  const parts=reverse?(isFive?[[r.padLength,'padding'],[r.armLength,'arm'],[3,'spacer']]:[[3,'spacer'],[r.armLength,'arm']]):(isFive?[[3,'spacer'],[r.armLength,'arm'],[r.padLength,'padding']]:[[r.armLength,'arm'],[3,'spacer']]);
  let i=tail,html=span(seq.slice(0,tail),'tail');
  for(const [length,kind] of parts){html+=span(seq.slice(i,i+length),kind);i+=length;}
  return html;
}
