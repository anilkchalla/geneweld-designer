# Upload Version 1.2 pPRISM

Keep the existing repository. Extract this ZIP, then upload its contents at repository root, preserving the `src` and `tests` folders. Do not upload the ZIP itself or an enclosing folder. Back up the current repository first.

## Required website files

Replace:
- `index.html`
- `src/app.js`
- `src/design.js` — required: corrected pPRISM overhangs and reverse-oligo body
- `src/styles.css`

Add:
- `src/pprism-reference.js`
- `src/product.js`
- `src/product-view.js`

Upload all seven website files together. Omitting any imported module prevents the app from loading. They replace the generic pGTag/optional-end-preview approach with the supplied pPRISM reference.

## Documentation and tests

Replace `README.md`, `UPLOAD_INSTRUCTIONS.md`, `package.json`, and `tests/design.test.js`. Add `VERIFICATION_NOTES.md` and `tests/product.test.js`.

Older `src/junctions.js` and `tests/junctions.test.js`, if present from Version 1.1, are no longer used by the website; they may remain. Preserve unrelated repository settings, licenses, workflow files and custom-domain configuration.

## Deployment

1. Commit the complete update to the branch/folder already selected in Settings → Pages.
2. Wait for the Pages deployment to finish and verify that it deployed this commit.
3. Refresh the site, using a hard refresh if necessary.
4. Confirm the header says **Version 1.2 beta · pPRISM**.
5. Generate the synthetic demo. Section **06 · Final product & reading frame** should appear with a green phase-check result, donor and integrated schematics, colored DNA, codon boxes with amino acids, and the noncoding 3′ junction.
6. Confirm the sample 5′ oligos begin `GAGC` and `CCCG`; 3′ oligos begin `AAG` and `CGG`. Download the donor FASTA as an additional check.

The live site inspected during preparation was still serving a Version 1.0 beta HTML page and script. If features remain missing after upload, verify the Pages deployment commit and source folder before changing code further.

No GitHub files or live deployment were changed in preparing this package.
