import {reference} from './pprism-reference.js';
const rc=s=>[...s].reverse().map(x=>({A:'T',T:'A',C:'G',G:'C'}[x])).join('');
export function cuts(sequence,motif,a,b){
 const result=[];
 for(const [recognition,strand] of [[motif,'+'],[rc(motif),'-']]){
  for(let i=0;i<=sequence.length-recognition.length;i++)if(sequence.slice(i,i+recognition.length)===recognition){
   result.push({start:i,strand,top:strand==='+'?i+motif.length+a:i-b,bottom:strand==='+'?i+motif.length+b:i-a});
  }
 }
 return result.sort((x,y)=>x.start-y.start);
}
export function vectorArchitecture(){
 const sequence=reference.sequence;
 const five=cuts(sequence,'ACCTGC',4,8),three=cuts(sequence,'GCTCTTC',1,4);
 if(five.length!==2||three.length!==2||five[0].strand!=='-'||five[1].strand!=='+'||three[0].strand!=='-'||three[1].strand!=='+')throw Error('Reference must contain the expected two outward-facing sites for each enzyme.');
 const arm=pair=>({left:pair[0],right:pair[1],topTail:sequence.slice(pair[0].top,pair[0].bottom),bottomTail:rc(sequence.slice(pair[1].top,pair[1].bottom))});
 return {five:arm(five),three:arm(three)};
}
const geneticCode={};
const bases='TCAG',amino='FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG';
let n=0;for(const a of bases)for(const b of bases)for(const c of bases)geneticCode[a+b+c]=amino[n++];
export function translate(sequence){let protein='';for(let i=0;i+2<sequence.length;i+=3)protein+=geneticCode[sequence.slice(i,i+3)]||'X';return protein;}
export function buildProduct(r){
 const a=vectorArchitecture(),s=reference.sequence;
 const fivePayload=r.leftSpacer+r.five+r.padding,threePayload=r.three+r.rightSpacer;
 const expected={'5HA-A':a.five.topTail+fivePayload,'5HA-B':a.five.bottomTail+rc(fivePayload),'3HA-A':a.three.topTail+threePayload,'3HA-B':a.three.bottomTail+rc(threePayload)};
 for(const key of Object.keys(expected))if(r.oligos[key]!==expected[key])throw Error('Oligo overhangs do not match the supplied pPRISM vector.');
 const central=s.slice(a.five.right.top,a.three.left.bottom);
 const donor=s.slice(0,a.five.left.bottom)+fivePayload+central+threePayload+s.slice(a.three.right.top);
 const donorFiveStart=a.five.left.bottom+r.leftSpacer.length;
 const donorFiveEnd=donorFiveStart+r.five.length;
 const donorThreeStart=a.five.left.bottom+fivePayload.length+central.length;
 const insert=r.padding+central;
 const integrated=r.dna.slice(0,r.cut)+insert+r.dna.slice(r.cut);
 const p2a=reference.features.find(f=>f.name==='P2A').segments[0].start;
 const rfp=reference.features.find(f=>f.name==='mRFP1');
 const p2aOffset=p2a-a.five.right.top;
 const p2aInAllele=r.cut+r.padding.length+p2aOffset;
 const rfpEndInAllele=r.cut+r.padding.length+Math.max(...rfp.segments.map(x=>x.end))-a.five.right.top;
 const firstComplete=r.exonStart+(3-r.position)%3;
 const frameOK=(p2aInAllele-r.exonStart+r.position)%3===0;
 const translated=translate(integrated.slice(firstComplete,rfpEndInAllele));
 const junctions={
  five:{left:r.dna.slice(Math.max(0,r.cut-60),r.cut),right:insert.slice(0,60),leftKind:'genomic',rightKind:'insert',available:true},
  three:{left:insert.slice(-60),right:r.dna.slice(r.cut,r.cut+60),leftKind:'insert',rightKind:'genomic',available:true}
 };
 for(const j of Object.values(junctions))j.sequence=j.left+j.right;
 const spans=[
  {start:0,end:r.cut,kind:'genomic',label:'Upstream genomic DNA'},
  {start:r.cut,end:r.cut+r.padding.length,kind:'padding',label:'Frame-completing genomic padding'},
  {start:r.cut+r.padding.length,end:p2aInAllele,kind:'linker',label:'Retained vector linker'},
  {start:p2aInAllele,end:p2aInAllele+57,kind:'p2a',label:'P2A'},
  {start:p2aInAllele+57,end:rfpEndInAllele,kind:'rfp',label:'mRFP1 including stop'},
  {start:rfpEndInAllele,end:r.cut+insert.length,kind:'noncoding',label:'Downstream vector including secondary EGFP cassette and poly(A); outside target fusion CDS'},
  {start:r.cut+insert.length,end:integrated.length,kind:'genomic',label:'Downstream genomic DNA'}
 ].filter(x=>x.end>x.start);
 return {reference:reference.name,referenceSha256:reference.sha256,architecture:a,oligos:expected,donor,donorFiveStart,donorFiveEnd,donorThreeStart,central,insert,integrated,spans,junctions,firstComplete,p2aInAllele,rfpEndInAllele,frameOK,translated,reporterProtein:translate(s.slice(p2a,Math.max(...rfp.segments.map(x=>x.end)))),firstStop:translated.indexOf('*'),model:'Predicted forward cassette integration at the genomic cut, with no genomic deletion. Arm homology is represented once; external arm spacers and cloning-only tails are excluded. The retained central vector sequence is taken directly from the supplied pPRISM reference. Downstream genomic DNA is noncoding in this cassette model.'};
}
