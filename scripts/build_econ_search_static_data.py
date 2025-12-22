#!/usr/bin/env python3
"""
Build static JSON shards for econ-search page (GitHub Pages friendly).

Input:  Econ-Paper-Search/Data/papers_*.csv
Output: assets/econ-search/papers_*.json

We keep only fields needed by the frontend:
  - title, authors, abstract, url, journal, year
"""

from __future__ import annotations

import csv
import json
import os
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "Econ-Paper-Search" / "Data"
OUT_DIR = ROOT / "assets" / "econ-search"

PERIODS = ["b2000", "2000s", "2010s", "2015s", "2020s"]


def _iter_rows(csv_path: Path) -> Iterable[dict]:
    with csv_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Normalize and keep minimal keys
            title = (row.get("title") or "").strip()
            authors = (row.get("authors") or "").strip()
            abstract = (row.get("abstract") or "").strip()
            url = (row.get("url") or "").strip() or None
            journal = (row.get("journal") or "").strip()
            year_raw = (row.get("year") or "").strip()

            try:
                year = int(float(year_raw)) if year_raw else None
            except ValueError:
                year = None

            # Drop missing year entries (consistent with original cleaning)
            if year is None:
                continue

            yield {
                "title": title,
                "authors": authors,
                "abstract": abstract,
                "url": url,
                "journal": journal,
                "year": year,
            }


def build_one(period: str) -> tuple[int, Path]:
    src = DATA_DIR / f"papers_{period}.csv"
    if not src.exists():
        raise FileNotFoundError(f"Missing source file: {src}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"papers_{period}.json"

    items = list(_iter_rows(src))
    with out.open("w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, separators=(",", ":"))

    return len(items), out


def main() -> None:
    print(f"Data dir: {DATA_DIR}")
    print(f"Out dir : {OUT_DIR}")
    total = 0
    for p in PERIODS:
        n, out = build_one(p)
        total += n
        size_mb = out.stat().st_size / (1024 * 1024)
        print(f"OK  papers_{p}: {n:,} -> {out} ({size_mb:.1f} MB)")
    print(f"Done. Total records: {total:,}")


if __name__ == "__main__":
    main()


