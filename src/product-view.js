import {translate} from './product.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mark=(seq,kind,label)=>`<span class="dna-${kind}" title="${escape(label)}">${seq}</span>`;
function colored(p,lo,hi){return p.spans.map(x=>mark(p.integrated.slice(Math.max(lo,x.start),Math.min(hi,x.end)),x.kind,x.label)).join('');}
function codons(p,lo,hi){
 const start=Math.max(p.firstComplete,lo+((p.firstComplete-lo)%3+3)%3);
 let html='';for(let i=start;i+3<=Math.min(hi,p.rfpEndInAllele);i+=3){
  const codon=p.integrated.slice(i,i+3),aa=translate(codon);
  html+=`<span class="codon ${aa==='*'?'stop-codon':''}" title="Assembled base ${i+1}; ${aa==='*'?'stop codon':aa}"><span>${colored(p,i,i+3)}</span><b>${aa}</b><small>${i+1}</small></span>`;
 }
 return `<div class="codon-track">${html}</div>`;
}
export function renderProduct(container,r,p){
 const beforeP2A=translate(p.integrated.slice(p.firstComplete,p.p2aInAllele));
 const earlyStop=beforeP2A.includes('*');
 const i=r.cut,j=r.cut+p.insert.length;
 const f=p.architecture.five,t=p.architecture.three;
 const donorSequence=mark(p.donor.slice(0,p.donorFiveStart),'backbone','Vector backbone and upstream spacer')+mark(r.five,'arm','5′ homology arm')+mark(r.padding,'padding','Frame padding')+colored(p,r.cut+r.padding.length,r.cut+p.insert.length)+mark(r.three,'arm','3′ homology arm')+mark(p.donor.slice(p.donorThreeStart+r.three.length),'backbone','Downstream spacer and backbone');
 container.innerHTML=`<div class="product-notice ${p.frameOK&&!earlyStop?'good':'warn'}"><b>${p.frameOK?'P2A–mRFP1 codon phase matches the supplied exon frame.':'Frame mismatch: do not use this design.'}</b> ${earlyStop?'A stop codon occurs in the supplied upstream coding segment: phase matching does not establish an expressed fusion.':'No upstream stop detected in the supplied complete coding triplets.'} The cassette terminates at the mRFP1 stop; the 3′ genomic junction is not a coding fusion.</div>
 <p class="hint">Oligo colors: blue = vector-compatible overhang; amber = external spacer or frame padding; green = genomic homology. The original codon-position legend remains in the Target map.</p><div class="product-legend">${[['genomic','Genomic'],['arm','Homology arm'],['padding','Frame padding'],['linker','Vector linker'],['p2a','P2A'],['rfp','mRFP1'],['noncoding','Downstream vector / EGFP / poly(A)']].map(([k,v])=>`<span>${mark('■',k,v)} ${v}</span>`).join('')}</div>
 <h3>Predicted assembled donor</h3><div class="product-schematic"><span class="dna-backbone">Backbone</span> → <span class="dna-arm">5′ HA (${r.armLength} bp)</span> → <span class="dna-padding">Padding (${r.padLength} nt)</span> → <span class="dna-p2a">P2A</span> → <span class="dna-rfp">mRFP1 / stop</span> → <span class="dna-noncoding">Vector / EGFP / poly(A)</span> → <span class="dna-arm">3′ HA (${r.armLength} bp)</span> → <span class="dna-backbone">Backbone</span></div>
 <p class="hint">${p.donor.length} bp circular donor, retaining the supplied reference origin. Restriction-site stuffer regions are replaced by the annealed arm inserts.</p>
 <details><summary>Full donor sequence, 5′ → 3′ (${p.donor.length} bp)</summary><div class="product-dna">${donorSequence}</div></details>
 <h3>Expected genomic product</h3><div class="product-schematic"><span class="dna-genomic">Upstream genome</span> → <span class="dna-padding">Padding</span> → <span class="dna-linker">CGG linker</span> → <span class="dna-p2a">P2A</span> → <span class="dna-rfp">mRFP1 / stop</span> → <span class="dna-noncoding">Vector / EGFP / poly(A)</span> → <span class="dna-genomic">Downstream genome</span></div>
 <h3>5′ junction — DNA and in-frame translation</h3><div class="product-dna">5′ ${colored(p,Math.max(0,i-60),i)}<b class="junction-boundary"> | </b>${colored(p,i,i+60)} 3′</div>
 <p class="hint">${Math.min(60,i)} bp genomic | 60 bp retained insert. Codons below are continuous across the boundary; source colors may change inside one codon. Amino acid beneath each triplet; number = assembled base. Leading incomplete exon codon is omitted.</p>
 ${codons(p,Math.max(r.exonStart,i-60),Math.min(p.rfpEndInAllele,i+120))}
 <h3>3′ junction — noncoding DNA</h3><div class="product-dna">5′ ${colored(p,j-60,j)}<b class="junction-boundary"> | </b>${colored(p,j,Math.min(p.integrated.length,j+60))} 3′</div><p class="hint">60 bp retained vector | ${Math.min(60,r.dna.length-r.cut)} bp downstream genome. Not translated: the reporter stop and poly(A) region are upstream.</p>
 <details><summary>Full predicted genomic sequence and coding translation</summary><div class="product-dna">${colored(p,0,p.integrated.length)}</div><p class="hint">Translation from the first complete supplied exon codon through the annotated mRFP1 stop. This is not a full-transcript prediction; * marks stops.</p><div class="product-dna protein">${escape(p.translated)}</div></details>
 <h3>Vector-specific annealing overhangs</h3><p class="hint">Order each of the four displayed single-stranded oligos 5′ → 3′; the A/B pair for each arm forms a duplex. These are not single-stranded repair donors (ssODNs).</p>
 <table class="product-table"><thead><tr><th>Arm / enzyme</th><th>A oligo 5′ tail</th><th>B oligo 5′ tail</th></tr></thead><tbody><tr><td>5′ HA / BfuAI</td><td><code>${f.topTail}</code></td><td><code>${f.bottomTail}</code></td></tr><tr><td>3′ HA / BspQI</td><td><code>${t.topTail}</code></td><td><code>${t.bottomTail}</code></td></tr></tbody></table>
 <p class="hint">${escape(p.model)} P2A mediates ribosomal skipping, so a phase-matched coding sequence does not mean a single stable fused protein. Experimental confirmation is still required.</p>`;
}
