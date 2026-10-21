/** Conditional insertion-at-cut preview, in gene-sense orientation.
 * Ends must include ALL retained linker/scar/padding bases. No vector bases are inferred.
 */
export function parseInsertEnd(raw) {
  const sequence=raw.split(/\r?\n/).filter(line=>!line.trim().startsWith('>')).join('').replace(/\s/g,'').toUpperCase();
  if(sequence && !/^[ACGT]+$/.test(sequence)) throw Error('Insert ends must contain only A, C, G and T bases (FASTA headers are allowed).');
  return sequence;
}
export function buildJunctions(result,startRaw='',endRaw='') {
  const {dna,cut}=result;
  if(!/^[ACGT]+$/.test(dna)||!Number.isInteger(cut)||cut<0||cut>dna.length) throw Error('A valid analyzed genomic cut is required.');
  const start=parseInsertEnd(startRaw),end=parseInsertEnd(endRaw);
  const upstream=dna.slice(Math.max(0,cut-60),cut),downstream=dna.slice(cut,cut+60);
  const insertStart=start.slice(0,60),insertEnd=end.slice(-60);
  return {
    model:'Conditional insertion at the analyzed cut, without genomic deletion; gene-sense 5′→3′. Supplied insert ends include all retained junction bases. Homology is represented once. No oligo tails or padding are automatically added.',
    five:{left:upstream,right:insertStart,leftKind:'genomic',rightKind:'insert',available:Boolean(start),sequence:start?upstream+insertStart:null},
    three:{left:insertEnd,right:downstream,leftKind:'insert',rightKind:'genomic',available:Boolean(end),sequence:end?insertEnd+downstream:null}
  };
}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderJunctions(container,junctions) {
  container.innerHTML=Object.entries({five:'5′ junction',three:'3′ junction'}).map(([key,title])=>{
    const j=junctions[key];
    const side=(sequence,kind)=>`<span class="junction-${kind}">${sequence||`[${kind==='insert'?'insert-end sequence not supplied':'no genomic bases available'}]`}</span>`;
    return `<article class="junction-card"><h3>${title}</h3><div class="junction-diagram" role="img" aria-label="${title}: ${j.leftKind} DNA joined to ${j.rightKind} DNA, left to right in gene-sense orientation"><span class="junction-block junction-${j.leftKind}">${j.leftKind==='genomic'?'Genomic DNA':'pGTag insert'}</span><b aria-hidden="true">│</b><span class="junction-block junction-${j.rightKind}">${j.rightKind==='genomic'?'Genomic DNA':'pGTag insert'}</span><b aria-hidden="true">→</b></div><div class="hint">Gene-sense 5′ → 3′ · ${j.left.length} bp ${j.leftKind} | ${j.right.length} bp ${j.rightKind}</div><div class="junction-sequence" aria-label="${title} partial sequence">5′ ${side(j.left,j.leftKind)}<b class="junction-boundary" title="Genomic–insert boundary"> | </b>${side(j.right,j.rightKind)} 3′</div><p class="hint">${!j.available?'Insert-side bases unavailable. Enter the corresponding retained insert end below. ':''}${j.left.length<60||j.right.length<60?'Shorter than 60 bp on at least one side; all available bases shown.':'60 bp on each side of the boundary.'}</p></article>`;
  }).join('')+`<p class="hint">${escape(junctions.model)}</p>`;
}
