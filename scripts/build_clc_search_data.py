#!/usr/bin/env python3
"""Build a compact CLC index from acdzh's nested JSON, without changing labels.

Download the source URL below, then run:
    python3 scripts/build_clc_search_data.py /path/to/clc.json
The source project specifies non-commercial use. See assets/clc-search/README.md.
"""

import argparse
import hashlib
import json
from pathlib import Path

SOURCE_URL = "https://raw.githubusercontent.com/acdzh/Chinese-Library-Classification/master/clc.json"
ROOT_CODES = list("ABCDEFGHIJKNOPQRSTUVXZ")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    source = args.source.read_bytes()
    tree = json.loads(source)
    if [node["id"] for node in tree] != ROOT_CODES:
        raise ValueError("Expected the 22 CLC root categories in source order")

    rows, seen = [], set()

    def visit(nodes, parent=-1):
        for node in nodes:
            code, name = node["id"], node["desc"]
            if not code or not name or code in seen:
                raise ValueError("Missing or duplicate classification: " + code)
            seen.add(code)
            index = len(rows)
            rows.append([code, name, parent])
            visit(node.get("children", []), index)

    visit(tree)
    output = Path(__file__).resolve().parents[1] / "assets/clc-search"
    output.mkdir(parents=True, exist_ok=True)
    payload = {
        "edition": "第五版（公开整理数据）",
        "source": SOURCE_URL,
        "source_updated": "2023-06-14",
        "source_sha256": hashlib.sha256(source).hexdigest(),
        "count": len(rows),
        "fields": ["code", "name", "parent_index"],
        "rows": rows,
    }
    target = output / "index.json"
    target.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Built {len(rows):,} categories; {target.stat().st_size:,} bytes → {target}")


if __name__ == "__main__":
    main()
