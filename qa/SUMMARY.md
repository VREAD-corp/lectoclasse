# QA summary: Lectoclasse kits (Le Menteur, Le Petit Poucet)

Checks run with READ FRANCE's reading engine (VREAD-corp/vread-reading-engine), every model step offline: cold answers, judgements and rewrites were written by Octave's independent subagents and fed back as files. Raw files: `qa/cold/` (prompts, answers, verdicts), `qa/items/` (the item sets), `qa/logs/` (one JSON + Markdown report per set and gate).

Round 0 = the kits as published on 2026-10-14. Blocking gate: the summary gate (a pupil holding a fiche-de-lecture summary, qa/summaries/), because the cold model knows these canonical texts by heart (memory gate: 50 of 65 questions answered right without the text). 35 questions were rewritten (round 1: 34 pass; acte-5.q2 only earns part of the marks from the summary, kept with a warning), one key corrected against the text (acte-4.q10, « sans la voir »), and 65 supporting passages added (qa/evidence.json). Checkpoints: one per act of Le Menteur, one per ~1,000 words of Le Petit Poucet, built with the engine's historical FR prompt v4 and segmenter; act I's first checkpoint leaked and was rewritten.

| Set | Items | Round 0: memory gate leaks | Round 0: summary gate leaks | Round 0: other failures | Final: failing | Final: cold gate |
|---|---|---|---|---|---|---|
| checkpoints/Le Menteur | 5 | 2 | - | 0 | 0 | 5 pass, 0 leak, 0 partial, 0 pending |
| checkpoints/Le Petit Poucet | 4 | 4 | - | 0 | 0 | 4 pass, 0 leak, 0 partial, 0 pending |
| lectoclasse/le-menteur | 55 | 40 | 29 | 0 | 0 | 42 pass, 0 leak, 13 partial, 0 pending |
| lectoclasse/petit-poucet | 10 | 10 | 6 | 0 | 0 | 10 pass, 0 leak, 0 partial, 0 pending |
| **Total** | **74** | **56** | **35** | **0** | **0** | |

Blocking gate for this repo: **summary**. A leak is an item answered right by the cold answerer (MC letter, or an open answer judged worth full marks); a partial (half marks) is reported as a warning.

