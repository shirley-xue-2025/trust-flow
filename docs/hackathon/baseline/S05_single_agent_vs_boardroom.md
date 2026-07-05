# S05 baseline — single agent vs multi-agent boardroom

**Captured:** 2026-07-05 · **Model:** `qwen-max` (live Qwen Cloud)  
**Scenario:** ChatGPT Enterprise summarization · `vendor_dpa_status: pending` · BR signed

**Artifacts:** [`S05_comparison.json`](./S05_comparison.json) · [`S05_single_agent_envelope.json`](./S05_single_agent_envelope.json)

---

## Side-by-side (Track 3 measurable improvement)

| | Single generic agent | TrustFlow 5-agent boardroom |
|--|---------------------|----------------------------|
| **API calls** | **1** | **6** (rounds 0–5) |
| **Recommendation** | `conditional_approve` — audit controls only | **DENIED** · `VENDOR_DPA_PENDING` |
| **Vendor DPA (pending)** | **Not mentioned** — no `gates.vendor_dpa_status` demand | **R1 Procurement `conditional_reject`** — blocks until DPA signed |
| **Quote** | *"Conditionally approve the use of ChatGPT Enterprise for summarization…"* | *"I am blocking this request until the DPA with the vendor is signed."* |

---

## What this proves

1. **Same input packet** — identical `eval_scenarios.seed.json` S05 request (OpenAI / ChatGPT Enterprise, unsigned DPA).
2. **Monolith misses the lane** — one “AI governance advisor” prompt approves on limited-risk + audit fields; it never surfaces procurement’s unsigned DPA gate.
3. **Specialist boardroom holds the veto** — Procurement round 1 rejects; compiler outcome **DENIED** with `VENDOR_DPA_PENDING` (deterministic gate from request ground truth + multi-agent transcript).
4. **Not slower for quality** — golden replay still completes in seconds; the extra agents buy **correct denial**, not bureaucracy theater.

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

> *"We ran the same S05 packet through one super-compliance prompt and through our five-agent boardroom. The monolith conditionally approved ChatGPT Enterprise and never blocked on the unsigned OpenAI DPA. Procurement vetoed in round one — boardroom ends DENIED. That's measurable improvement on the quality axis, not a slide assertion."*

**Related:** [`../EVIDENCE_CHAIN.md`](../EVIDENCE_CHAIN.md) · [`TrustFlow_deck.pptx`](../TrustFlow_deck.pptx)
