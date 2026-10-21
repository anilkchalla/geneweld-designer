# pPRISM sequence verification and implementation notes

## Reference

Source: user-supplied `pPRISM-mRFP1-5HAmodified.dna`, 5,841 bp circular DNA. DNA and feature coordinates were extracted from its SnapGene packets. Document notes were treated as data, not instructions. The original file is unchanged. The file SHA-256 is stored in `src/pprism-reference.js` and in exported JSON results.

Both cloning-site contexts pasted by the user match this reference exactly after case normalization.

NEB defines BfuAI as **ACCTGC(4/8)** and BspQI as **GCTCTTC(1/4)**. The cleavage positions are outside their recognition sequences; app overhangs come from the actual vector sequence at those positions.

- [NEB BfuAI](https://www.neb.com/en-us/products/r0701-bfuai)
- [NEB BspQI](https://www.neb.com/en-us/products/r0712-bspqi)

## Restriction sites and cohesive ends

Recognition coordinates below are 1-based inclusive in the original reference; orientation refers to the displayed reference strand.

| Arm | Enzyme | Reverse recognition site | Forward recognition site | A oligo 5′ tail | B oligo 5′ tail |
| --- | --- | --- | --- | --- | --- |
| 5′ | BfuAI | 795–800, GCAGGT | 812–817, ACCTGC | GAGC | CCCG |
| 3′ | BspQI | 4433–4439, GAAGAGC | 4539–4545, GCTCTTC | AAG | CGG |

For implementation, cut boundaries are zero-based:

| Site | Top-strand boundary | Bottom-strand boundary |
| --- | --- | --- |
| 5′ left / reverse BfuAI | 786 | 790 |
| 5′ right / forward BfuAI | 821 | 825 |
| 3′ left / reverse BspQI | 4428 | 4431 |
| 3′ right / forward BspQI | 4546 | 4549 |

The four oligos are written 5′→3′. Let `RC` mean reverse complement:

```text
5HA-A = GAGC + leftSpacer + 5HA + padding
5HA-B = CCCG + RC(leftSpacer + 5HA + padding)
3HA-A = AAG  + 3HA + rightSpacer
3HA-B = CGG  + RC(3HA + rightSpacer)
```

The A and B bodies must be exact reverse complements; the 5′ tails form the vector-compatible cohesive ends. The previous 5′ B body used the wrong order inside the reverse-complement expression; that is corrected here. Its former generic pGTag tails are also replaced with the supplied pPRISM-specific tails.

## Assembled donor and predicted genomic product

Using zero-based half-open slices of the original reference `V`:

```text
fivePayload  = leftSpacer + 5HA + padding
threePayload = 3HA + rightSpacer
central      = V[821:4431]

donor = V[0:790] + fivePayload + central + threePayload + V[4546:5841]

retained genomic insert = padding + central
predicted genomic product = genome[0:cut] + retained genomic insert + genome[cut:]
```

These expressions retain each cohesive-end sequence once in the ligated donor and each homology-arm sequence once in the predicted genomic product. External spacers are not included in the expected integrated segment. This assumes the intended forward cassette is integrated between the two genomic arms with no genomic deletion; it is not a simulation of all possible repair outcomes or donor-release products.

The retained central region is 3,610 bp and includes the supplied downstream vector sequence and secondary EGFP cassette. No unknown insert bases are substituted or inferred from generic pGTag constants.

## Frame interpretation

The retained vector linker is **CGG**, original reference bases 822–824. The annotated P2A begins at base 825 and spans 825–881; mRFP1 spans 882–1556, ending in TAA. P2A translates as `ATNFSLLKQAGDVEENPGP` from the extracted sequence.

The three-base linker preserves codon phase after genomic frame-completion padding. The program independently checks the actual P2A position in the assembled genomic sequence against the supplied exon-start codon position. Codon boxes continue across genomic DNA, padding, linker, P2A and mRFP1. A codon may contain bases from two sources and retains those source colors.

The frame result is separate from an upstream-stop check. A phase match alone is not an expression prediction. The 3′ junction is displayed as noncoding relative to this target–P2A–mRFP1 transcript. P2A causes ribosomal skipping; the display does not imply that the entire translated region remains one stable fusion protein. Full-transcript splicing and experimental integration are outside the supplied single-exon model.

## Validation

The final suite contains 12 tests, including the seven updated core-design tests and five product tests. Product tests cover the exact supplied contexts, independently calculated cut positions, standard genetic-code translation, P2A translation, oligo complementarity, both strands × both arm lengths × all three frame positions, complete donor reconstruction, single-copy homology in the expected genomic product, removal of both pairs of cloning sites in the fixtures, short-context windows and incomplete leading exon codons.

Browser checks confirmed generation of the four colored oligos, automatic cassette ends, phase status, source-colored junction DNA, codon/translation boxes and donor FASTA download. The downloaded synthetic-demo donor is compared with the sequence returned directly by the product generator. The demo is synthetic and is not a recommended biological target.

The live HTML/script fetched during preparation still indicated Version 1.0 beta. This package is Version 1.2 beta · pPRISM; verify the deployed version and Pages commit after upload.
