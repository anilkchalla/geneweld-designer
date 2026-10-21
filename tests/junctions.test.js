import test from 'node:test';
import assert from 'node:assert/strict';
import {buildJunctions,parseInsertEnd} from '../src/junctions.js';
import {design,rc} from '../src/design.js';
test('exact flanks and insert windows, without duplicated homology or added tails',()=>{
 const dna='A'.repeat(80)+'C'.repeat(80);
 const j=buildJunctions({dna,cut:80},'G'.repeat(60)+'TT','AA'+'T'.repeat(60));
 assert.equal(j.five.sequence,'A'.repeat(60)+'G'.repeat(60));
 assert.equal(j.three.sequence,'T'.repeat(60)+'C'.repeat(60));
});
test('missing ends are absent data, not invented DNA',()=>{
 const j=buildJunctions({dna:'ACGT',cut:2});assert.equal(j.five.left,'AC');assert.equal(j.three.right,'GT');assert.equal(j.five.sequence,null);assert.equal(j.three.sequence,null);
});
test('independent ends and short available windows',()=>{
 const j=buildJunctions({dna:'AACCGGTT',cut:3},'ATG','');assert.equal(j.five.sequence,'AACATG');assert.equal(j.three.sequence,null);assert.equal(j.three.right,'CGGTT');
});
test('FASTA normalization and invalid input',()=>{
 assert.equal(parseInsertEnd('>end\nat gc\nTA'),'ATGCTA');assert.throws(()=>parseInsertEnd('ACN'),/only/);assert.throws(()=>parseInsertEnd('<script>'),/only/);assert.throws(()=>buildJunctions({dna:'ACGT',cut:-1}),/valid/);
});
test('both strands, both arm lengths and every frame use the analyzed cut',()=>{
 const guide='ACGTACGTACGTACGTACGA';
 for(const strand of ['+','-'])for(const armLength of [24,48])for(const position of [0,1,2]){
  const dna='A'.repeat(80)+(strand==='+'?guide+'AGG':'CCG'+rc(guide))+'T'.repeat(80);
  const r=design({raw:'['+dna+']',guide,strand,armLength,position});
  const j=buildJunctions(r,'G'.repeat(60),'C'.repeat(60));
  assert.equal(j.five.left,dna.slice(r.cut-60,r.cut));assert.equal(j.three.right,dna.slice(r.cut,r.cut+60));
 }
});
