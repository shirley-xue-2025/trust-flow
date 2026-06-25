#!/usr/bin/env python3
"""Collect and tag market evidence for TrustFlow R3 research."""

from __future__ import annotations

import json
import re
import urllib.parse
import urllib.request
from collections import Counter
from dataclasses import asdict, dataclass
from datetime import timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

from apify_client import ApifyClient

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "docs" / "research" / "evidence"
RAW = EVIDENCE / "raw"

REDDIT_ACTOR = "trudax/reddit-scraper-lite"
BLOCKER_TYPES = ("legal", "cost", "shadow_ai", "technical", "approval_process", "other")

TAG_RULES: list[tuple[str, re.Pattern[str]]] = [
    ("legal", re.compile(r"\b(gdpr|dpa|data protection|privacy|subprocessor|eu ai act|compliance officer|legal team)\b", re.I)),
    ("cost", re.compile(r"\b(token|cost|expensive|budget|license|per seat|pricing|roi|billing)\b", re.I)),
    ("shadow_ai", re.compile(r"\b(shadow ai|personal account|blocked|ban\b|bypass|unsanctioned|without approval)\b", re.I)),
    ("approval_process", re.compile(r"\b(policy|approval|betriebsrat|works council|legal review|procurement|rollout|vetting)\b", re.I)),
    ("technical", re.compile(r"\b(sso|dlp|proxy|azure|integration|tenant|entra|conditional access|firewall)\b", re.I)),
]

REDDIT_START_URLS = [
    "https://www.reddit.com/r/sysadmin/search/?q=Copilot+GDPR&restrict_sr=1&sort=relevance&t=year",
    "https://www.reddit.com/r/sysadmin/search/?q=ChatGPT+enterprise+blocked&restrict_sr=1&sort=relevance&t=year",
    "https://www.reddit.com/r/sysadmin/search/?q=shadow+AI+employees&restrict_sr=1&sort=relevance&t=year",
    "https://www.reddit.com/r/sysadmin/search/?q=AI+token+cost&restrict_sr=1&sort=relevance&t=year",
    "https://www.reddit.com/r/sysadmin/search/?q=company+AI+policy&restrict_sr=1&sort=relevance&t=year",
    "https://www.reddit.com/r/gdpr/search/?q=ChatGPT+workplace&restrict_sr=1&sort=relevance&t=year",
    "https://www.reddit.com/r/gdpr/search/?q=Microsoft+Copilot&restrict_sr=1&sort=relevance&t=year",
    "https://www.reddit.com/r/legaltech/search/?q=enterprise+AI+compliance&restrict_sr=1&sort=relevance&t=year",
]

HN_QUERIES = [
    "copilot enterprise GDPR",
    "chatgpt workplace blocked company",
    "shadow AI employees enterprise",
    "enterprise AI compliance cost",
]


@dataclass
class EvidenceItem:
    id: str
    source: str
    source_type: str
    url: str
    title: str
    text: str
    community: str | None
    created_at: str | None
    tags: list[str]
    is_post: bool


def load_token() -> str:
    for line in Path(ROOT / ".env").read_text().splitlines():
        if line.startswith("APIFY_TOKEN="):
            return line.split("=", 1)[1].strip()
    raise RuntimeError("APIFY_TOKEN not found in .env")


def tag_text(text: str) -> list[str]:
    tags = [name for name, pattern in TAG_RULES if pattern.search(text)]
    return tags or ["other"]


def is_reddit_post(item: dict[str, Any]) -> bool:
    if item.get("dataType") == "post":
        return True
    url = item.get("url") or ""
    return "/comments/" in url and "/u/" not in url and url.rstrip("/").count("/") <= 7


def normalize_reddit(item: dict[str, Any], idx: int) -> EvidenceItem | None:
    text = (item.get("body") or item.get("title") or "").strip()
    if len(text) < 40:
        return None
    title = (item.get("title") or "").strip()
    combined = f"{title}\n{text}"
    # Skip low-signal generic MSP / vendor rants unless tagged
    if not any(t in tag_text(combined) for t in BLOCKER_TYPES if t != "other"):
        if item.get("dataType") == "comment":
            return None
    return EvidenceItem(
        id=f"R{idx:04d}",
        source="reddit",
        source_type="community",
        url=item.get("url") or "",
        title=title[:300],
        text=text[:2000],
        community=item.get("communityName") or item.get("parsedCommunityName"),
        created_at=item.get("createdAt"),
        tags=tag_text(combined),
        is_post=is_reddit_post(item),
    )


def fetch_hn(query: str, hits: int = 8) -> list[dict[str, Any]]:
    url = (
        "https://hn.algolia.com/api/v1/search?"
        + urllib.parse.urlencode({"query": query, "tags": "story", "hitsPerPage": hits})
    )
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.load(resp).get("hits", [])


def normalize_hn(hit: dict[str, Any], idx: int) -> EvidenceItem | None:
    title = hit.get("title") or ""
    # Pull top comments for blocker signal
    story_id = hit.get("objectID")
    comment_url = (
        "https://hn.algolia.com/api/v1/search?"
        + urllib.parse.urlencode(
            {
                "tags": f"comment,story_{story_id}",
                "hitsPerPage": 5,
            }
        )
    )
    comments: list[str] = []
    try:
        with urllib.request.urlopen(comment_url, timeout=30) as resp:
            for c in json.load(resp).get("hits", []):
                if c.get("comment_text"):
                    comments.append(c["comment_text"])
    except Exception:
        pass
    text = "\n".join(comments) or title
    if len(text) < 30:
        return None
    combined = f"{title}\n{text}"
    tags = tag_text(combined)
    if tags == ["other"] and hit.get("num_comments", 0) < 3:
        return None
    return EvidenceItem(
        id=f"H{idx:04d}",
        source="hackernews",
        source_type="community",
        url=hit.get("url") or f"https://news.ycombinator.com/item?id={story_id}",
        title=title[:300],
        text=text[:2000],
        community="hackernews",
        created_at=hit.get("created_at"),
        tags=tags,
        is_post=True,
    )


def run_reddit(client: ApifyClient, max_items: int, max_charge_usd: Decimal) -> tuple[list[dict], float]:
    run_input = {
        "maxItems": max_items,
        "maxPostCount": 15,
        "maxComments": 3,
        "proxy": {"useApifyProxy": True},
        "startUrls": [{"url": u} for u in REDDIT_START_URLS],
    }
    run = client.actor(REDDIT_ACTOR).call(
        run_input=run_input,
        wait_duration=timedelta(minutes=8),
        max_total_charge_usd=max_charge_usd,
    )
    items = list(client.dataset(run.default_dataset_id).iterate_items())
    usage = float(run.usage_total_usd or 0)
    RAW.mkdir(parents=True, exist_ok=True)
    (RAW / "reddit_run_meta.json").write_text(
        json.dumps(
            {
                "actor": REDDIT_ACTOR,
                "run_id": run.id,
                "dataset_id": run.default_dataset_id,
                "usage_usd": usage,
                "item_count": len(items),
            },
            indent=2,
        )
    )
    return items, usage


def write_corpus(items: list[EvidenceItem], path: Path) -> None:
    with path.open("w", encoding="utf-8") as f:
        for item in items:
            f.write(json.dumps(asdict(item), ensure_ascii=False) + "\n")


def write_synthesis(items: list[EvidenceItem], path: Path, spend_usd: float) -> None:
    tag_counts = Counter(t for i in items for t in i.tags)
    source_counts = Counter(i.source for i in items)
    post_count = sum(1 for i in items if i.is_post)
    lines = [
        "# R3 evidence synthesis",
        "",
        f"**Generated:** corpus build script",
        f"**Total items:** {len(items)} ({post_count} posts/threads, {len(items) - post_count} comments)",
        f"**Apify spend (Reddit):** ${spend_usd:.2f}",
        "",
        "## Tag distribution (items may have multiple tags)",
        "",
        "| blocker_type | count |",
        "|--------------|-------|",
    ]
    for tag in BLOCKER_TYPES:
        lines.append(f"| {tag} | {tag_counts.get(tag, 0)} |")
    lines += [
        "",
        "## Source mix",
        "",
    ]
    for src, n in source_counts.most_common():
        lines.append(f"- **{src}:** {n}")
    lines += [
        "",
        "## Themes (re-derived from corpus)",
        "",
    ]
    if tag_counts.get("approval_process", 0) >= tag_counts.get("legal", 0):
        lines.append("- **Approval / policy friction** appears at least as often as raw GDPR citations in community discourse.")
    if tag_counts.get("shadow_ai", 0) > 0:
        lines.append("- **Shadow AI** shows up when official channels block or slow rollout.")
    if tag_counts.get("cost", 0) > 0:
        lines.append("- **Token/seat cost** is present but verify prevalence vs legal blockers in sample review.")
    else:
        lines.append("- **Token cost** underrepresented in this batch — may need targeted G2/manual pass later.")
    if tag_counts.get("approval_process", 0) > 0 and "betriebsrat" not in " ".join(i.text.lower() for i in items):
        lines.append("- **Betriebsrat** rarely named on Reddit/HN — DE-specific gate may be invisible in English forums.")
    path.write_text("\n".join(lines) + "\n")


def main() -> None:
    token = load_token()
    client = ApifyClient(token)

    print("Running Reddit batch...")
    raw_reddit, spend = run_reddit(client, max_items=100, max_charge_usd=Decimal("3.00"))

    evidence: list[EvidenceItem] = []
    idx = 1
    for raw in raw_reddit:
        item = normalize_reddit(raw, idx)
        if item:
            evidence.append(item)
            idx += 1

    print("Fetching Hacker News...")
    hn_idx = 1
    for q in HN_QUERIES:
        for hit in fetch_hn(q):
            item = normalize_hn(hit, hn_idx)
            if item:
                evidence.append(item)
                hn_idx += 1

    # Dedupe by URL
    seen: set[str] = set()
    deduped: list[EvidenceItem] = []
    for item in evidence:
        if item.url in seen:
            continue
        seen.add(item.url)
        deduped.append(item)

    EVIDENCE.mkdir(parents=True, exist_ok=True)
    write_corpus(deduped, EVIDENCE / "corpus.jsonl")
    write_synthesis(deduped, EVIDENCE / "synthesis.md", spend)

    samples_dir = EVIDENCE / "samples"
    samples_dir.mkdir(parents=True, exist_ok=True)
    batch_lines = [
        "# Batch 002 — community sources (tagged)",
        "",
        f"**Items in corpus:** {len(deduped)} | **Reddit Apify spend:** ${spend:.2f}",
        "",
        "| ID | source | tags | excerpt |",
        "|----|--------|------|---------|",
    ]
    for item in deduped[:12]:
        excerpt = item.text.replace("\n", " ")[:120] + "…"
        batch_lines.append(
            f"| {item.id} | {item.source}/{item.community or '?'} | {', '.join(item.tags)} | {excerpt} |"
        )
    (samples_dir / "batch_002_community.md").write_text("\n".join(batch_lines) + "\n")

    print(f"Done: {len(deduped)} items, spend ${spend:.2f}")


if __name__ == "__main__":
    main()
