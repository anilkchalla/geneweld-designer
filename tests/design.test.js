import test from 'node:test';import assert from 'node:assert/strict';import {parseSequence,findTargets,design,rc} from '../src/design.js';
test('bracket coordinates and whitespace',()=>{const p=parseSequence('>demo\naaa[ATGCCC]\nttt');assert.deepEqual(p,{dna:'AAAATGCCCTTT',exonStart:3,exonEnd:9});});
test('reverse complement',()=>assert.equal(rc('ACGT'), 'ACGT'));
test('forward PAM and cut',()=>{const d='A'.repeat(60)+'ACGTACGTACGTACGTACGT'+'AGG'+'T'.repeat(60); const s=findTargets(d,'ACGTACGTACGTACGTACGT','+');assert.equal(s[0].cut,77);});
test('reverse PAM and cut',()=>{const guide='ACGTACGTACGTACGTACGA';const d='A'.repeat(60)+'CCG'+rc(guide)+'T'.repeat(60);const s=findTargets(d,guide,'-');assert.equal(s[0].cut,66);});
test('all codon positions yield a complete frame and correct oligos',()=>{const guide='ACGTACGTACGTACGTACGT';const d='A'.repeat(65)+guide+'AGG'+'T'.repeat(65); for(const position of [0,1,2]){const r=design({raw:'['+d+']',guide,strand:'+',position,armLength:48});assert.equal((r.cut+r.padLength+r.position)%3,0);assert.equal(r.oligos['5HA-B'],'ATCC'+rc(r.padding+r.five+r.leftSpacer));assert.equal(r.oligos['3HA-B'],'CGG'+rc(r.three+r.rightSpacer));}});
test('reject malformed exon',()=>assert.throws(()=>parseSequence('ACGT'),/Enclose/));
test('reject missing PAM',()=>assert.throws(()=>design({raw:'['+'A'.repeat(120)+']',guide:'C'.repeat(20)}),/No exact/));
