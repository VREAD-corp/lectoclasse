# QA of the Lectoclasse kits (reading engine)

Run on 2026-10-16 with READ FRANCE's reading engine, VREAD-corp/vread-reading-engine (the in-house QA gates of
vread-workflow-def, pre-Octave snapshot `a5df9a9`). No model key, no network: every model step was done offline by
fresh Octave subagents and fed back as files. Results: [SUMMARY.md](SUMMARY.md).

- `export-items.mjs`: the questions and keys of `src/pages/echantillon.html` and `college.html` → `items/` (one unit
  per act; one per numbered paragraph of the tale), with the supporting passages of `evidence.json` (checked word
  for word against the text by the engine).
- Static gates: passages found in their unit, closed (oui/non) questions, hidden multiple choice, true/false
  (warning), near-duplicates, MC options and key.
- Cold-answer gate, **memory** version (historical; `cold/`): title + author + question only. The cold model knows
  Corneille and Perrault by heart (50 of 65 answered right), so this is kept as a measure.
- Cold-answer gate, **summary** version (blocking; `cold/summary/`): the pupil holds a fiche-de-lecture summary
  (`summaries/`, written from the text by an agent that never saw the questions) and may answer only from it,
  quoting it; the engine checks the quote. Open answers are judged against the key (`*.judge.jsonl`).
- Fixes: the 35 leaking questions were rewritten in the pages (same act, same type, same count), re-gated, re-tested.
- Checkpoints (`checkpoints/`): the engine segments the text (acts; 1,000-word parts of the tale), writes the
  historical FR prompt v4 (written by `--prompts-out`; not kept in this public repo), an agent answered it offline (`*.answers.json`), the engine validated it;
  the files that passed both gates are in `content/checkpoints/` and are written into the pages by
  `tools/insert-checkpoints.mjs`.

```sh
E=../vread-reading-engine/bin/reading-engine.mjs
node qa/export-items.mjs
node $E qa qa/items/le-menteur.json --gate summary --summaries qa/summaries/le-menteur.json \
  --cold qa/cold/summary/le-menteur.answers.jsonl --judge qa/cold/summary/le-menteur.judge.jsonl
node tools/insert-checkpoints.mjs && npm run pdf
```
