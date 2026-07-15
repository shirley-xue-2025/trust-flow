# S05 baseline — single agent vs multi-agent boardroom

**Captured:** 2026-07-14 · **Model:** `qwen-max` (live Qwen Cloud)  
**Scenario:** ChatGPT Enterprise summarization · `vendor_dpa_status: pending` · BR signed

**Artifacts:** [`S05_comparison.json`](./S05_comparison.json) · [`S05_single_agent_envelope.json`](./S05_single_agent_envelope.json) · [`s05_single_vs_multi_agent_comparison.png`](./s05_single_vs_multi_agent_comparison.png) (video / Medium still)

---

## Side-by-side (Track 3 measurable improvement)

| | Single generic agent | Specialist boardroom (demo cast) |
|--|---------------------|----------------------------|
| **API calls** | **1** | **14** (v2 debate: lanes + rebuttals + finals) |
| **Recommendation** | conditional approve — audit controls only | **DENIED** · vendor DPA pending |
| **Vendor DPA (pending)** | **Not mentioned** — no vendor-gate demand | **Round 1 — Procurement Opposes** + rebuttal — blocks until DPA signed |
| **Quote** | *"Approve … with the condition that raw prompt logging remains disabled…"* | *"We can't move forward without a signed DPA…"* (Procurement; compiler still denies) |

---

## What this proves

1. **Same input packet** — identical `eval_scenarios.seed.json` S05 request (OpenAI / ChatGPT Enterprise, unsigned DPA).
2. **Monolith misses the lane** — one “AI governance advisor” prompt approves on limited-risk + audit fields; it never surfaces procurement’s unsigned DPA gate.
3. **Specialist boardroom holds the veto** — Procurement blocks in round 1; Runner negotiates routing workarounds in rebuttals; compiler outcome stays **DENIED** with vendor DPA pending (deterministic gate — dialogue can compromise, legal vetoes cannot).
4. **Not bureaucracy theater** — recorded demo still completes in seconds; the extra turns buy **real debate + correct denial**, not latency for its own sake.

---

## Reproduce

```bash
cd app
npm run baseline:demo -- S05          # live compare (needs DASHSCOPE_API_KEY)
npm run baseline:demo -- S05 --write  # refresh JSON artifacts in this folder
```

Without a key: read committed `S05_comparison.json` (evidence for judges / deck).

---

## Slide 5 speaker line

> *"We ran the same unsigned-DPA request through one super-compliance prompt and through our specialist boardroom. The monolith conditionally approved ChatGPT Enterprise and never blocked on the unsigned OpenAI DPA. Procurement vetoed — the boardroom debated workarounds but still ended DENIED. That's measurable improvement on the quality axis, not a slide assertion."*

**Related:** [`../EVIDENCE_CHAIN.md`](../EVIDENCE_CHAIN.md) · [`s05_single_vs_multi_agent_comparison.png`](./s05_single_vs_multi_agent_comparison.png)
