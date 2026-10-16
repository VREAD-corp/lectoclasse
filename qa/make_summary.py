#!/usr/bin/env python3
"""Writes qa/SUMMARY.md from the reading engine's QA logs (qa/logs/<round>/<gate>/*.qa.json).
Rounds: round-0 = the content as it was on 2026-10-16 before any fix; final = after the rewrites.
Usage: python3 qa/make_summary.py "<title of the repo>" [--note "text"]"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LOGS = ROOT / "logs"
title = sys.argv[1] if len(sys.argv) > 1 else "QA"
note = sys.argv[sys.argv.index("--note") + 1] if "--note" in sys.argv else ""

def load(rnd, gate):
    d = LOGS / rnd / gate
    return {json.loads(f.read_text())["set"]: json.loads(f.read_text()) for f in sorted(d.glob("*.qa.json"))} if d.exists() else {}

r0m, r0s, fin_s, fin_m = load("round-0", "memory"), load("round-0", "summary"), load("final", "summary"), load("final", "memory")
final = fin_s or fin_m
gate = "summary" if fin_s else "memory"
sets = sorted(set(r0m) | set(r0s) | set(final))
lines = [f"# QA summary: {title}", "",
         "Checks run with READ FRANCE's reading engine (VREAD-corp/vread-reading-engine), every model step offline: "
         "cold answers, judgements and rewrites were written by Octave's independent subagents and fed back as files. "
         "Raw files: `qa/cold/` (prompts, answers, verdicts), `qa/items/` (the item sets), `qa/logs/` (one JSON + Markdown "
         "report per set and gate).", ""]
if note:
    lines += [note, ""]
lines += ["| Set | Items | Round 0: memory gate leaks | Round 0: summary gate leaks | Round 0: other failures | Final: failing | Final: cold gate |",
          "|---|---|---|---|---|---|---|"]
tot = dict(items=0, m=0, s=0, o=0, f=0)
for s in sets:
    a, b, c = r0m.get(s), r0s.get(s), final.get(s)
    items = (c or b or a)["totals"]["items"]
    m = a["totals"]["cold"]["leak"] if a else None
    sl = b["totals"]["cold"]["leak"] if b else None
    base = b or a
    other = sum(1 for i in base["items"] if any(x != "cold_answer" for x in i["failed"])) if base else 0
    f = c["totals"]["failing"] if c else None
    cg = (f'{c["totals"]["cold"]["pass"]} pass, {c["totals"]["cold"]["leak"]} leak, {c["totals"]["cold"]["partial"]} partial, {c["totals"]["cold"]["pending"]} pending' + (f', {c["totals"]["cold"]["exempt"]} exempt' if c["totals"]["cold"]["exempt"] else "")) if c else "-"
    lines.append(f"| {s} | {items} | {'-' if m is None else m} | {'-' if sl is None else sl} | {other} | {'-' if f is None else f} | {cg} |")
    tot["items"] += items; tot["m"] += m or 0; tot["s"] += sl or 0; tot["o"] += other; tot["f"] += f or 0
lines.append(f"| **Total** | **{tot['items']}** | **{tot['m']}** | **{tot['s']}** | **{tot['o']}** | **{tot['f']}** | |")
lines += ["", f"Blocking gate for this repo: **{gate}**. A leak is an item answered right by the cold answerer (MC letter, "
          "or an open answer judged worth full marks); a partial (half marks) is reported as a warning.", ""]
(ROOT / "SUMMARY.md").write_text("\n".join(lines) + "\n")
print("\n".join(lines))
