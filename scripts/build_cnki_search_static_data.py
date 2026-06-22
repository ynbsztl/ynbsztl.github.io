#!/usr/bin/env python3
"""
Build static JSON shards for the CNKI search page.

Input:  files/cnki_list.csv
Output: assets/cnki-search/manifest.json
        assets/cnki-search/papers_*.json

Run this after updating files/cnki_list.csv, then commit and deploy the
regenerated JSON files.
"""

from __future__ import annotations

import csv
import json
import re
import time
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "files" / "cnki_list.csv"
OUT_DIR = ROOT / "assets" / "cnki-search"

SHARDS = [
    ("b1980", "1955-1979", None, 1979),
    ("1980s", "1980-1989", 1980, 1989),
    ("1990s", "1990-1999", 1990, 1999),
    ("2000s", "2000-2009", 2000, 2009),
    ("2010s", "2010-2019", 2010, 2019),
    ("2020s", "2020+", 2020, None),
]

TAG_RE = re.compile(r"<[^>]+>")
SPACE_RE = re.compile(r"\s+")


def clean(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip().replace("\ufeff", "")
    text = TAG_RE.sub("", text)
    text = SPACE_RE.sub(" ", text).strip()
    return "" if text == "." else text


def parse_year(value: Any) -> int | None:
    text = clean(value)
    if not text:
        return None
    try:
        return int(float(text))
    except ValueError:
        return None


def shard_key(year: int) -> str | None:
    for key, _label, start, end in SHARDS:
        if (start is None or year >= start) and (end is None or year <= end):
            return key
    return None


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing source file: {SOURCE}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    buckets: dict[str, list[dict[str, Any]]] = {key: [] for key, *_ in SHARDS}
    journal_counts: Counter[str] = Counter()
    year_counts: Counter[int] = Counter()
    skipped = 0

    with SOURCE.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            year = parse_year(row.get("year"))
            if year is None:
                skipped += 1
                continue

            key = shard_key(year)
            if key is None:
                skipped += 1
                continue

            journal = clean(row.get("journal_name"))
            paper = {
                "title": clean(row.get("title")),
                "abstract": clean(row.get("abstract")),
                "authors": clean(row.get("authors")),
                "year": year,
                "keywords": clean(row.get("keywords")),
                "journal": journal,
                "journal_id": clean(row.get("journal_id")),
            }

            buckets[key].append(paper)
            journal_counts[journal] += 1
            year_counts[year] += 1

    manifest = {
        "source": "files/cnki_list.csv",
        "generated_at": int(time.time()),
        "source_mtime": int(SOURCE.stat().st_mtime),
        "total": sum(len(items) for items in buckets.values()),
        "journals": [
            {"name": name, "count": count}
            for name, count in journal_counts.most_common()
        ],
        "year_min": min(year_counts) if year_counts else None,
        "year_max": max(year_counts) if year_counts else None,
        "shards": [],
    }

    for key, label, start, end in SHARDS:
        records = buckets[key]
        records.sort(key=lambda p: (p["year"], p["journal"], p["title"]))
        out = OUT_DIR / f"papers_{key}.json"
        with out.open("w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, separators=(",", ":"))

        manifest["shards"].append(
            {
                "key": key,
                "label": label,
                "from": start,
                "to": end,
                "count": len(records),
                "url": f"/assets/cnki-search/papers_{key}.json",
            }
        )

    manifest_path = OUT_DIR / "manifest.json"
    with manifest_path.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"Source : {SOURCE}")
    print(f"Out dir: {OUT_DIR}")
    print(f"Total  : {manifest['total']:,}")
    print(f"Years  : {manifest['year_min']} - {manifest['year_max']}")
    if skipped:
        print(f"Skipped: {skipped:,} row(s)")
    for shard in manifest["shards"]:
        out = OUT_DIR / f"papers_{shard['key']}.json"
        print(f"OK     : {shard['key']:>5} {shard['count']:>6,} records ({out.stat().st_size / (1024 * 1024):.1f} MB)")


if __name__ == "__main__":
    main()
