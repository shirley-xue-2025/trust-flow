# R3 — Market evidence plan (synthetic interview fuel)

**Goal:** Collect real discourse from EU enterprises about AI adoption blockers — GDPR, cost, approval friction — to ground a synthetic DPO persona and validate TrustFlow's problem framing.

**Not started:** batch scrape. This doc defines protocol.

---

## Research questions

1. What do IT admins / compliance people **actually say** blocks Copilot/ChatGPT rollout?
2. How often do **works council / Betriebsrat** appear in public threads?
3. Is **token cost runaway** a top-3 pain or niche?
4. What workarounds do employees admit (shadow AI)?

---

## Sources (priority order)

| Source | Sub-targets | Tool | Sample first? |
|--------|-------------|------|---------------|
| Reddit | r/sysadmin, r/legaltech, r/gdpr, r/de_EDV | Apify Reddit scraper | Yes — 5 posts |
| G2 | Microsoft Copilot, ChatGPT Enterprise, Google Gemini reviews (EU filter) | Apify / manual | 5 reviews |
| LinkedIn | Posts mentioning "Betriebsrat KI", "EU AI Act deployer" | Manual / Apify | Deferred (ToS) |
| Hacker News | "Copilot enterprise GDPR" | Algolia HN API | 5 threads |

---

## Sample-first protocol (required before batch)

1. Pull **5 posts** per subreddit with keywords: `Copilot GDPR`, `ChatGPT enterprise`, `works council AI`, `AI token cost`.
2. Tag each excerpt: `blocker_type` ∈ {legal, cost, shadow_ai, technical, approval_process, other}.
3. Show tagged samples to Shirley for pattern confirmation.
4. Only then scale to 50–100 items.

---

## Output artifacts

```
docs/research/evidence/
  samples/           # 3-5 item batches with before/after tags
  corpus.jsonl       # {id, source, url, date, text, tags[]}
  synthesis.md       # Themes + counts (re-derived, not chat-passed)
```

---

## Synthetic persona construction (phase 2)

**Input:** Top 30 tagged excerpts + R1/R2 regulatory facts.

**Output:** `docs/research/personas/dpo_fintech_de.md`

- Name, constraints, red lines, acceptable compromises
- Scripted objections for boardroom roleplay
- "Hidden actor" discoveries

**Method:** LLM-assisted **only after** evidence corpus exists — persona must cite evidence IDs.

---

## Apify execution log

| Run | Actor | Items raw | Corpus items | Cost USD |
|-----|-------|-----------|--------------|----------|
| Pilot | `trudax/reddit-scraper-lite` | 20 | — | 0.12 |
| Batch 2 | same | 100 cap → filtered | 55 | 0.44 |
| HN | Algolia API (free) | — | 4 | 0.00 |
| **Total** | | | **55** | **~0.56** |

**Actor choice:** `trudax/reddit-scraper-lite` — 3.5M+ runs, 4.6★, ~$0.004/result. G2 scrapers on Apify rated poorly; deferred.

**Gap:** `r/gdpr` under-sampled (Reddit 429 rate limits during crawl). Optional follow-up run if DE GDPR voice needed in corpus.

**Script:** `scripts/collect_evidence.py` (re-runnable with `max_total_charge_usd` cap).

**Decision (2026-06-25):** Batch 002 sufficient for persona v0.1; no further scrape until persona review or fake-door copy needs G2 voice.

---

## Initial anecdotal signals (web search, n=5, not corpus)

Themes appearing in public commentary (to validate with corpus):

- **DPA / subprocessor** anxiety for US-model providers
- **Shadow AI** when official channels slow
- **Per-seat Copilot cost** vs unclear ROI
- **Logging** as double-edged sword (compliance vs surveillance fears)
- **EU AI Act** cited vaguely; few mention specific articles

Treat as **hypothesis seeds only** — not measured prevalence.
