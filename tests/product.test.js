import test from 'node:test';import assert from 'node:assert/strict';
import {reference} from '../src/pprism-reference.js';
import {cuts,vectorArchitecture,buildProduct,translate} from '../src/product.js';
import {design,rc} from '../src/design.js';
const guide='ACGTACGTACGTACGTACGA';
function fixture(strand='+',position=0,armLength=48){const dna='A'.repeat(80)+(strand==='+'?guide+'AGG':'CCG'+rc(guide))+'T'.repeat(80);return design({raw:'['+dna+']',guide,strand,position,armLength});}
test('reference matches supplied contexts and independently calculated cuts',()=>{
 const s=reference.sequence;assert.equal(s.length,5841);
 assert.equal(s.slice(786,825),'GAGCGGGAGCAGGTGCGTTCGGGCCACCTGCACAGCGGG');
 assert.equal(s.slice(4428,4549),'AAGTGAAGAGCTATCCGGATATATATGTATGTTATCATAACTGTACTGGCTATGTCAGGTGGTAATGACTGTAACGTTACGTTACTCGTTGTAGGCACGACATTGAATATGCTCTTCTCCG');
 const a=vectorArchitecture();assert.deepEqual([a.five.left.top,a.five.left.bottom,a.five.right.top,a.five.right.bottom],[786,790,821,825]);
 assert.deepEqual([a.three.left.top,a.three.left.bottom,a.three.right.top,a.three.right.bottom],[4428,4431,4546,4549]);
 assert.deepEqual([a.five.topTail,a.five.bottomTail,a.three.topTail,a.three.bottomTail],['GAGC','CCCG','AAG','CGG']);
});
test('standard genetic code and annotated reporter translation',()=>{
 assert.equal(translate('ATGGCTTAATAGTGA'),'MA***');
 assert.equal(translate(reference.sequence.slice(824,881)),'ATNFSLLKQAGDVEENPGP');
 assert.equal(translate(reference.sequence.slice(1553,1556)),'*');
});
test('both guide strands, both arm sizes, all frames produce phase-matched reporter and exact donor',()=>{
 for(const strand of ['+','-'])for(const position of [0,1,2])for(const armLength of [24,48]){
  const r=fixture(strand,position,armLength),p=buildProduct(r),s=reference.sequence;
  assert.equal(p.frameOK,true);assert.equal((p.p2aInAllele+r.position)%3,0);
  const expected=s.slice(0,790)+r.leftSpacer+r.five+r.padding+s.slice(821,4431)+r.three+r.rightSpacer+s.slice(4546);
  assert.equal(p.donor,expected);assert.equal(p.donor.length,5841-31-115+6+2*armLength+r.padLength);
  assert.equal(p.integrated,r.dna.slice(0,r.cut)+r.padding+s.slice(821,4431)+r.dna.slice(r.cut));
  assert.equal(p.junctions.five.left.length,60);assert.equal(p.junctions.five.right.length,60);
  assert.equal(p.junctions.three.left.length,60);assert.equal(p.junctions.three.right.length,60);
  assert.equal(translate(p.integrated.slice(p.p2aInAllele,p.p2aInAllele+57)),'ATNFSLLKQAGDVEENPGP');
  assert.ok(p.translated.endsWith('*'));
  assert.equal(cuts(p.donor,'ACCTGC',4,8).length,0);assert.equal(cuts(p.donor,'GCTCTTC',1,4).length,0);
 }
});
test('oligos have complementary bodies with correct single-stranded tails',()=>{
 const r=fixture(),p=buildProduct(r);
 assert.equal(r.oligos['5HA-A'].slice(0,4),'GAGC');assert.equal(r.oligos['5HA-B'].slice(0,4),'CCCG');
 assert.equal(r.oligos['5HA-B'].slice(4),rc(r.oligos['5HA-A'].slice(4)));
 assert.equal(r.oligos['3HA-B'].slice(3),rc(r.oligos['3HA-A'].slice(3)));
 assert.throws(()=>buildProduct({...r,oligos:{...r.oligos,'5HA-A':'GCGG'+r.oligos['5HA-A'].slice(4)}}),/overhangs/);
});
test('partial supplied exon frame and shorter junction flanks are represented truthfully',()=>{
 const dna='A'.repeat(30)+guide+'AGG'+'T'.repeat(30);
 const r=design({raw:'AA['+dna+']TT',guide,position:2,armLength:24});
 const p=buildProduct(r);assert.equal(p.frameOK,true);assert.equal(p.firstComplete,3);assert.ok(p.junctions.five.left.length<60);assert.ok(p.junctions.three.right.length<60);
});
