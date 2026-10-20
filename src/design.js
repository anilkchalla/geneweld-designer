/** GeneWeld pGTag short-homology design; genomic coordinates are zero-based half-open. */
export const rc = s => [...s.toUpperCase()].reverse().map(x => ({A:'T',T:'A',C:'G',G:'C'}[x] || 'N')).join('');
export function parseSequence(raw) {
  const lines=raw.trim().split(/\r?\n/).filter(x=>!x.trim().startsWith('>'));
  const input=lines.join('').replace(/\s/g,'').toUpperCase();
  if(!input) throw Error('Paste a DNA sequence first.');
  if((input.match(/\[/g)||[]).length!==1||(input.match(/\]/g)||[]).length!==1 || input.indexOf('[')>input.indexOf(']')) throw Error('Enclose exactly one coding exon using [ and ].');
  if(!/^[ACGT\[\]]+$/.test(input)) throw Error('Only A, C, G and T bases (plus one pair of exon brackets) are supported.');
  const start=input.indexOf('['), end=input.indexOf(']')-1;
  if(end<=start) throw Error('The annotated exon is empty.');
  return {dna:input.replace(/[\[\]]/g,''), exonStart:start, exonEnd:end};
}
export function findTargets(dna,guide,strand) {
  const g=guide.toUpperCase().replace(/\s/g,'').replace(/U/g,'T');
  if(!/^[ACGT]{20}$/.test(g)) throw Error('Guide must contain exactly 20 A/C/G/T (or U) nucleotides; exclude PAM.');
  const sites=[];
  if(strand==='+') {
    for(let i=0;i<=dna.length-23;i++) if(dna.slice(i,i+20)===g && /^[ACGT]GG$/.test(dna.slice(i+20,i+23))) sites.push({start:i,end:i+20,pamStart:i+20,pamEnd:i+23,pam:dna.slice(i+20,i+23),cut:i+17,strand});
  } else if(strand==='-') {
    const match=rc(g);
    for(let i=3;i<=dna.length-20;i++) if(dna.slice(i,i+20)===match && /^CC[ACGT]$/.test(dna.slice(i-3,i))) sites.push({start:i,end:i+20,pamStart:i-3,pamEnd:i,pam:rc(dna.slice(i-3,i)),cut:i+3,strand});
  } else throw Error('Select guide strand + or −.');
  return sites;
}
function spacerNotIn(near) { return ['A','C','G','T'].find(x=>!near.includes(x))?.repeat(3) || null; }
export function design({raw,guide,strand='+',position=0,armLength=48,siteIndex=0}) {
  const parsed=parseSequence(raw); const {dna,exonStart,exonEnd}=parsed;
  position=Number(position); armLength=Number(armLength);
  if(![0,1,2].includes(position)) throw Error('First exon nucleotide codon position must be 0, 1 or 2.');
  if(![24,48].includes(armLength)) throw Error('Choose a 24- or 48-bp homology arm.');
  const sites=findTargets(dna,guide,strand);
  if(!sites.length) throw Error('No exact protospacer with correctly oriented SpCas9 NGG PAM was found.');
  if(!Number.isInteger(siteIndex)||siteIndex<0||siteIndex>=sites.length) throw Error('Select a valid guide match.');
  const site=sites[siteIndex]; const cut=site.cut;
  if(cut-armLength-3<0 || cut+armLength+3>dna.length) throw Error(`Need ${armLength} bases for each arm plus 3 flanking bases outside each arm; add genomic sequence around the cut.`);
  const five=dna.slice(cut-armLength,cut), three=dna.slice(cut,cut+armLength);
  const leftNear=dna.slice(cut-armLength-3,cut-armLength),rightNear=dna.slice(cut+armLength,cut+armLength+3);
  const leftSpacer=spacerNotIn(leftNear),rightSpacer=spacerNotIn(rightNear);
  if(!leftSpacer||!rightSpacer) throw Error('Unable to choose a nonmatching homopolymer spacer from adjacent three bases.');
  // Exon first base is at codon index position; cut is a boundary between nucleotides.
  // Number of bases to complete the codon ending at or after the cleavage boundary.
  const offset=((cut-exonStart+position)%3+3)%3;
  const padLength=(3-offset)%3;
  if(cut<exonStart||cut>exonEnd) throw Error('Cleavage is outside the annotated exon; this release supports coding-exon cuts only.');
  if(cut+padLength>exonEnd) throw Error('Codon padding extends beyond the annotated exon; splice-aware design is not supported.');
  const padding=dna.slice(cut,cut+padLength);
  const oligos={
    '5HA-A':'GCGG'+leftSpacer+five+padding,
    '5HA-B':'ATCC'+rc(padding+five+leftSpacer),
    '3HA-A':'AAG'+three+rightSpacer,
    '3HA-B':'CGG'+rc(three+rightSpacer)
  };
  const warnings=[];
  if(cut-exonStart<armLength||exonEnd-cut<armLength) warnings.push('At least one homology arm overlaps flanking intronic sequence.');
  if(Math.min(cut-exonStart,exonEnd-cut)<=6) warnings.push('Cut is within 6 bases of an exon boundary; possible splice effects need evaluation.');
  const motifs=['ACCTGC','GAAGAGC'];
  for(const [name,seq] of Object.entries(oligos)) for(const m of motifs) if(seq.includes(m)||seq.includes(rc(m))) warnings.push(`${name} contains a cloning-efficiency warning motif (${m} or reverse complement).`);
  const checks={
    upstreamDuplex:oligos['5HA-B']==='ATCC'+rc(padding+five+leftSpacer),
    downstreamDuplex:oligos['3HA-B']==='CGG'+rc(three+rightSpacer),
    homology:five===dna.slice(cut-armLength,cut)&&three===dna.slice(cut,cut+armLength),
    codingBoundary:(cut+padding.length-exonStart+position)%3===0
  };
  if(Object.values(checks).some(x=>!x)) throw Error('Internal oligonucleotide validation failed.');
  return {...parsed,guide:guide.toUpperCase(),sites,site,cut,position,armLength,five,three,leftSpacer,rightSpacer,padding,padLength,oligos,warnings,checks};
}
