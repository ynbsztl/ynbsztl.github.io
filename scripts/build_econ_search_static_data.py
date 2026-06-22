#!/usr/bin/env python3
"""
Build static JSON shards for the Econ Search page.

Input:  files/RePEc_list.csv
Output: assets/econ-search/manifest.json
        assets/econ-search/papers_*.json

The frontend defaults to rank 1-3 journals. Rank 4-5 journals remain
available but are unchecked by default.
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
SOURCE = ROOT / "files" / "RePEc_list.csv"
OUT_DIR = ROOT / "assets" / "econ-search"
DEFAULT_RANKS = {1, 2, 3}

PERIODS = [
    ("b1980", "1907-1979", None, 1979),
    ("1980s", "1980-1989", 1980, 1989),
    ("1990s", "1990-1999", 1990, 1999),
    ("2000_2004", "2000-2004", 2000, 2004),
    ("2005_2009", "2005-2009", 2005, 2009),
    ("2010_2012", "2010-2012", 2010, 2012),
    ("2013_2015", "2013-2015", 2013, 2015),
    ("2016_2018", "2016-2018", 2016, 2018),
    ("2019_2020", "2019-2020", 2019, 2020),
    ("2021_2022", "2021-2022", 2021, 2022),
    ("2023_2024", "2023-2024", 2023, 2024),
    ("2025plus", "2025+", 2025, None),
]

SPACE_RE = re.compile(r"\s+")


def clean(value: Any) -> str:
    if value is None:
        return ""
    return SPACE_RE.sub(" ", str(value).strip().replace("\ufeff", "")).strip()


def parse_int(value: Any) -> int | None:
    text = clean(value)
    if not text:
        return None
    try:
        return int(float(text))
    except ValueError:
        return None


def period_for_year(year: int) -> tuple[str, str, int | None, int | None] | None:
    for period in PERIODS:
        _key, _label, start, end = period
        if (start is None or year >= start) and (end is None or year <= end):
            return period
    return None


def paper_url(row: dict[str, Any]) -> str:
    doi = clean(row.get("doi"))
    if doi:
        return f"https://doi.org/{doi}"
    return ""


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing source file: {SOURCE}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    buckets: dict[tuple[str, int], list[dict[str, Any]]] = {}
    journal_meta: dict[str, dict[str, Any]] = {}
    rank_counts: Counter[int] = Counter()
    year_counts: Counter[int] = Counter()
    skipped = 0

    with SOURCE.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            year = parse_int(row.get("year"))
            rank = parse_int(row.get("rank"))
            period = period_for_year(year) if year is not None else None
            if year is None or rank is None or period is None:
                skipped += 1
                continue

            journal = clean(row.get("journal_abbr"))
            journal_name = clean(row.get("journal_name"))
            if not journal:
                skipped += 1
                continue

            paper = {
                "title": clean(row.get("title")),
                "authors": clean(row.get("authors")),
                "abstract": clean(row.get("abstract")),
                "url": paper_url(row),
                "journal": journal,
                "journal_name": journal_name,
                "rank": rank,
                "year": year,
            }

            buckets.setdefault((period[0], rank), []).append(paper)
            year_counts[year] += 1
            rank_counts[rank] += 1

            meta = journal_meta.setdefault(
                journal,
                {
                    "abbr": journal,
                    "name": journal_name,
                    "rank": rank,
                    "count": 0,
                    "default": rank in DEFAULT_RANKS,
                },
            )
            meta["count"] += 1
            if rank < meta["rank"]:
                meta["rank"] = rank
                meta["default"] = rank in DEFAULT_RANKS
            if journal_name and not meta["name"]:
                meta["name"] = journal_name

    manifest = {
        "source": "files/RePEc_list.csv",
        "generated_at": int(time.time()),
        "source_mtime": int(SOURCE.stat().st_mtime),
        "total": sum(len(items) for items in buckets.values()),
        "year_min": min(year_counts) if year_counts else None,
        "year_max": max(year_counts) if year_counts else None,
        "default_ranks": sorted(DEFAULT_RANKS),
        "rank_counts": {str(rank): count for rank, count in sorted(rank_counts.items())},
        "journals": sorted(
            journal_meta.values(),
            key=lambda item: (item["rank"], item["abbr"]),
        ),
        "shards": [],
    }

    for period_key, label, start, end in PERIODS:
        ranks_for_period = sorted(rank for pkey, rank in buckets if pkey == period_key)
        for rank in ranks_for_period:
            records = buckets[(period_key, rank)]
            records.sort(key=lambda p: (p["year"], p["journal"], p["title"]))
            filename = f"papers_{period_key}_r{rank}.json"
            out = OUT_DIR / filename
            with out.open("w", encoding="utf-8") as f:
                json.dump(records, f, ensure_ascii=False, separators=(",", ":"))

            manifest["shards"].append(
                {
                    "key": f"{period_key}_r{rank}",
                    "period": period_key,
                    "label": label,
                    "from": start,
                    "to": end,
                    "rank": rank,
                    "count": len(records),
                    "url": f"/assets/econ-search/{filename}",
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
    print(f"Journals: {len(manifest['journals']):,}")
    if skipped:
        print(f"Skipped: {skipped:,} row(s)")
    for shard in manifest["shards"]:
        out = ROOT / shard["url"].lstrip("/")
        print(
            f"OK     : {shard['key']:>13} {shard['count']:>6,} records "
            f"({out.stat().st_size / (1024 * 1024):.1f} MB)"
        )


if __name__ == "__main__":
    main()
