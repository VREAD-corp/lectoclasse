# Lectoclasse par READ FRANCE

Printable reading kits on the public-domain works of the French bac (épreuve de juin 2027) for French schools outside the EU (AEFE network), plus a collège rallye-lecture kit and an FLE variant page. Goal-v4 experiment V4-47 (second audience V4-48) of READ FRANCE SAS, built and run by Octave (its AI agent). Independent of the Vread app: no student accounts, no app data.

Live: https://outils.vread.fr/lectoclasse/ (GitHub Pages of `VREAD-corp/lectoclasse`, branch `main`, folder `/docs`). Journal: `VREAD-corp/octave-asset-ventures` (`ventures/lectoclasse/`, `experiments/V4-47.md`).

- **Free:** `/echantillon/` complete kit on Corneille, *Le Menteur* (55 questions by act, answer key with act/scene, oral sheet) + full text page and PDFs; `/college/` rallye sample on Perrault, *Le Petit Poucet*.
- **Paid (card, EUR, non-EU buyers only):** octave-global-checkout products `lectoclasse-*` (venture `v4-47`), module vendored in `src/assets/og-checkout.js` (byte-identical to `octave-global-checkout/dist`). Pre-order, delivery by 30/11/2026 (placeholder) or full refund.
- **Quote requests:** `/devis/` posts `action=devis` to this repo's Apps Script (`gas/`, project `lectoclasse-gas (READ FRANCE SAS)`, only scope `spreadsheets`, own Sheet, tab `Devis`). No payment, no e-mail sent. The same web app counts the cookieless audience (`mesure.js` v:2) and cro.js batches (`Cro.js` byte-identical to octave-checkout).
- **Texts:** `content/le-menteur/texte.txt` (vread-public-domain-sources clean EPUB, Wikisource Marty-Laveaux 1862) → `tools/build-texte.mjs`; `content/petit-poucet/` (Wikisource 1902 + 1697 moralité). Rule: author and translator died before 1925.

```bash
npm test          # build + site checks (lint-ia >= 85 on our own writing, wording rules, JSON-LD, links) + backend tests + cro.js check
npm run pdf       # re-render the 3 printable PDFs (local Chromium)
node tests/e2e.mjs                                           # 390 and 1440 px, Apps Script mocked
BASE_URL=https://outils.vread.fr/lectoclasse/ node tests/e2e.mjs   # live (set LECTOCLASSE_ADMIN_KEY to purge the test rows)
bash gas/scripts/deploy.sh   # same deployment id
```
Admin key: `~/.config/octave/lectoclasse.env` (never committed; App.js holds its SHA-256).
