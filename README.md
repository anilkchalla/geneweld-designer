# GeneWeld Designer 1.2 beta — pPRISM

Preserves the original site's visual design. Adds a sequence-based assembled donor, automatically populated 5′/3′ genomic junctions, source-colored DNA, codon-aligned 5′ translation, reporter frame checks, and four vector-specific single-stranded arm oligos.

This release is specific to `pPRISM-mRFP1-5HAmodified.dna` (5,841 bp), not a universal pGTag vector configuration. The plasmid sequence and feature coordinates are embedded in `src/pprism-reference.js`; no manual insert-end input is needed.

## Inputs

Paste gene-sense genomic DNA with one coding exon in square brackets. Choose the codon position (0, 1, or 2) of its first base, a 20 nt SpCas9 guide without PAM, plus/minus guide orientation, and 24/48 bp homology arms. Provide enough genomic sequence for arms plus three external bases. Optional protein input remains reference-only and is not validated.

## Results

- Original target map, homology arms and export controls.
- Four single-stranded oligos, each written 5′→3′: A and B are annealing partners for each arm, not ssODN repair donors.
- Colored overhangs, spacers, homology and padding within the oligos.
- Full predicted circular donor sequence after both arm inserts, retaining the reference sequence origin.
- Expected integrated sequence from supplied genomic context, with homology represented once.
- Approximately 60 bp on each side of both junctions; shorter genomic contexts show available bases only.
- Continuous codon groups and amino acids at the 5′ junction, color-coded by source. Phase matching and upstream stops are reported separately.
- Full coding translation through the annotated mRFP1 stop. The cassette's 3′ junction is noncoding relative to the target fusion.
- Oligo CSV/FASTA, complete design JSON, donor FASTA and predicted genomic-product FASTA.

The downstream vector region also contains the secondary EGFP cassette; it is preserved, not translated as part of the upstream target–P2A–mRFP1 fusion. P2A mediates ribosomal skipping.

## Model and limits

Predicted forward cassette insertion at the analyzed cut, no genomic deletion, and precise intended homology-mediated junctions. Frame-completing genomic padding is retained before the vector linker. External homology-arm spacers and backbone-only cloning sequences are excluded from the predicted genomic insertion. Full-transcript splicing, repair outcomes, expression, genome-wide specificity and experimental junction identity are not established by the app.

This computational model uses the supplied reference and annotated cassette boundaries; confirm them against the intended cloning/release strategy and sequence both experimental junctions. A matching codon phase does not prove a functional product. See `VERIFICATION_NOTES.md` for exact coordinates and checks.

## Run locally

No build or installation is required. Serve the directory with `python3 -m http.server 8000` and open `http://localhost:8000`. Opening the HTML directly from disk may prevent ES module loading.

With Node.js installed, run `npm test`.

See `UPLOAD_INSTRUCTIONS.md` for GitHub Pages update steps.
