# GeneWeld Designer — Version 1.0 beta

A lightweight, static, browser-only designer for short homology arms and the four cloning oligonucleotides used with **pGTag/GeneWeld**. Works on GitHub Pages; no backend, build step or external APIs.

## Upload to GitHub

Create a public GitHub repository (suggested name: `geneweld-designer`) and upload these paths **preserving directory structure**:

```
index.html
package.json
README.md
.gitignore
.nojekyll
src/app.js
src/design.js
src/styles.css
tests/design.test.js
.github/workflows/pages.yml
```

**Important:** GitHub's web upload UI may hide dotfiles. The safest approach is to upload via Git or GitHub Desktop, or ensure `.github/workflows/pages.yml`, `.nojekyll` and `.gitignore` are uploaded.

### Enable Pages

1. Under repository **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
2. Push the files to the `main` branch. The included workflow runs tests and publishes the static webpage.
3. The published address will be `https://YOUR-USERNAME.github.io/geneweld-designer/` (if you used the suggested repo name).
4. Subsequent pushes to `main` redeploy automatically.

### Run locally

From the repository folder:

```sh
npm test
python3 -m http.server 8000
```

Open `http://localhost:8000/`.

## Inputs and coordinate conventions

- Paste one genomic sequence with one coding exon marked `[ATGC...]` and optional intronic sequence outside the brackets.
- The entire sequence is **gene-sense 5′→3′**, regardless of CRISPR guide orientation.
- First exon nucleotide codon position: **0 = first base**, **1 = second base**, **2 = third base** of a codon (not the formal splice phase).
- Enter the 20-nucleotide protospacer, excluding PAM; choose + or − strand relative to displayed DNA.
- SpCas9 NGG cleavage is three base pairs PAM-proximal, usually between protospacer bases 17 and 18 in guide orientation.
- Select 24- or 48-base homology arms. The software requires 3 additional flanking bases on either extreme to choose nonhomologous spacer triplets.
- Multiple genomic guide matches can be selected using the target-match dropdown.

## Oligo construction

Following the **GeneWeld manual homology-arm protocol**, Section E:

```
5HA-A = GCGG + upstreamSpacer + upstreamHomology + framePadding
5HA-B = ATCC + reverseComplement(framePadding + upstreamHomology + upstreamSpacer)
3HA-A = AAG + downstreamHomology + downstreamSpacer
3HA-B = CGG + reverseComplement(downstreamHomology + downstreamSpacer)
```

The B oligos intentionally differ from simple full-length reverse complements because of cloning-compatible cohesive ends. Nonhomologous spacer triplets consist of a base absent from the next three upstream/downstream neighboring genomic nucleotides. Frame padding copies 0–2 downstream reference nucleotides to complete a codon in the upstream product.

## Limitations and research verification

**Research prototype: independently verify all oligonucleotides against your vector before synthesis.**

- No genomic off-target search, guide efficiency scoring, or transcript retrieval.
- The optional protein field is displayed for context but **not translated or validated in this beta**.
- No full-vector sequence is included, so predicted fusion to a specific 2A/reporter is **not** verified.
- One coding exon only; no exon junction reading-frame reconstruction or alternative splice isoforms.
- The frame refers to the exon coding strand, but exon-bracket input does not prove that all marked bases are coding.
- Some sequence motifs may decrease cloning efficiency; these are flagged, not automatically redesigned.
- The initial unit tests cover parsing, strand mapping, codon-phase arithmetic and oligo structural invariants; they are **not** yet independent gold-standard comparisons to published hand2 or other full design examples.

## Scientific reference

Welker et al., *GeneWeld: Efficient Targeted Integration Directed by Short Homology in Zebrafish*, Bio-protocol 11(14):e4100 (2021). https://pmc.ncbi.nlm.nih.gov/articles/PMC8329467/

Full protocol: https://media.addgene.org/cms/filer_public/40/c9/40c90221-7656-4f9a-b3f7-2c82942b2cc2/geneweld_protocol.pdf
