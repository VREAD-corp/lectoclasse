#!/usr/bin/env python3
"""Merges JSON Lines records by id: later files replace earlier ones (a re-run of the cold gate on rewritten items
updates the main answers/verdicts file). Usage: python3 qa/merge_records.py main.jsonl new.jsonl [...]"""
import json, sys
from pathlib import Path

main = Path(sys.argv[1])
rows = {}
order = []
for f in [main, *map(Path, sys.argv[2:])]:
    if not f.exists():
        continue
    for line in f.read_text().splitlines():
        if line.strip():
            r = json.loads(line)
            if r["id"] not in rows:
                order.append(r["id"])
            rows[r["id"]] = r
main.write_text("".join(json.dumps(rows[i], ensure_ascii=False) + "\n" for i in order))
print(f"{main}: {len(order)} records")
