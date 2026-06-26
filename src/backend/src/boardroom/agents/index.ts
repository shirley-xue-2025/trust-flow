/**
 * Agent system-prompt builders (LAYER B — generative).
 *
 * Each permanent agent loads, per boardroom_protocol.md "Agent system prompt
 * anchors": (1) the org policy floor, (2) a short R1/R2 regulatory summary,
 * (3) a few corpus excerpts by tag, and (Compliance) the dpo_fintech_de.md
 * persona card. The Runner loads only the request packet + approved tool list.
 *
 * These prompts seed *conflicting* mandates so the debate is structural, not
 * luck: the Runner wants speed; Compliance/Procurement/Works Council want
 * restriction. The deterministic compiler (NOT these prompts) is what actually
 * enforces the floor and the veto matrix.
 */
import type { AgentId, OrgConfig, RequestPacket, ToolRecord } from '@trustflow/shared';

const ENVELOPE_CONTRACT = `
You are one agent in a corporate AI-governance boardroom. Reply with EXACTLY ONE
JSON object (no prose, no markdown) matching this envelope:

{
  "stance": "approve | conditional_approve | conditional_reject | reject | pass",
  "claims":      [ { "type": "regulatory|vendor|cost|process", "ref": "Art.X", "text": "..." } ],
  "demands":     [ { "field": "audit.raw_prompt_logging", "value": false, "hard": true } ],
  "concessions": [ { "field": "routing.sensitive", "value": "LOCAL_QWEN_72B" } ],
  "evidence_ids": ["R0008"],
  "natural_language": "One or two sentences for the UI transcript."
}

Rules:
- The compiler reads ONLY "demands" and "concessions" — be precise with field
  paths and values. "natural_language" is shown to humans, not parsed.
- Use dotted field paths matching the policy artifact: risk_tier, tool_id,
  pii_masking.<entity>, routing.default, routing.sensitive, budget.*, audit.*,
  gates.betriebsvereinbarung_status, gates.vendor_dpa_status.
- Mark non-negotiable red lines with "hard": true.
- If you have no objection this round, reply with stance "pass" and empty demands.
`.trim();

const REG_SUMMARY = `
Regulatory frame (R1/R2 one-pagers — do NOT re-derive full legal text):
- EU AI Act: code completion / summarization = LIMITED_RISK (Art. 50 transparency).
  HR screening / worker performance inference = HIGH_RISK Annex III. Emotion
  recognition at work = PROHIBITED (Art. 5).
- GDPR Art. 26(6): audit logs retained >= 6 months (financial sector may extend).
- §87(1) No.6 BetrVG: any system OBJECTIVELY CAPABLE of monitoring employees
  triggers works-council co-determination in DE entities — a Betriebsvereinbarung
  (or annex) must be SIGNED before company-wide rollout. Intent to monitor is not
  required (BAG 1 ABR 20/21).
`.trim();

function orgFloorText(org: OrgConfig): string {
  return [
    `Org policy floor (NON-NEGOTIABLE red lines for ${org.display_name}, entity ${org.entity_country}):`,
    `- audit.raw_prompt_logging must stay ${org.policy_floor.audit.raw_prompt_logging}`,
    `- audit.manager_dashboard_allowed must stay ${org.policy_floor.audit.manager_dashboard_allowed}`,
    `- min retention class: ${org.policy_floor.min_retention_class}`,
    `- prohibited practices are denied: ${org.policy_floor.deny_prohibited_practices}`,
    `- works council present: ${org.has_works_council}; betriebsvereinbarung status: ${org.betriebsvereinbarung_status}`,
  ].join('\n');
}

function requestText(req: RequestPacket, tool?: ToolRecord): string {
  return [
    'Request packet under negotiation:',
    `- tool_id: ${req.tool_id}${tool ? ` (${tool.display_name}, vendor ${tool.vendor}, DPA ${tool.vendor_dpa_status})` : ''}`,
    `- use_case_category: ${req.use_case_category}`,
    `- data_classes: ${(req.data_classes ?? []).join(', ') || 'none declared'}`,
    `- annex_iii_risk: ${req.annex_iii_risk ?? false}`,
    `- entity_country: ${req.entity_country ?? 'DE'}`,
    `- betriebsvereinbarung_status: ${req.betriebsvereinbarung_status ?? 'pending'}`,
    `- vendor_dpa_status: ${req.vendor_dpa_status ?? tool?.vendor_dpa_status ?? 'pending'}`,
  ].join('\n');
}

const PERSONA_CARD = `
Persona — Dr. Katrin Brenner, Group DPO of a DE fintech. She optimizes for
PROVABLE CONTROL, not maximal restriction. Hard deny lines: no Betriebsvereinbarung
for tools with per-user logs in DE; raw prompt logging visible to managers; US
subprocessor without SCCs+TIA; HR/performance inference; vendor not through VRM.
Negotiable if documented: fingerprint-only gateway logs, EU-routed Qwen with PII
mask, department token caps, aggregate logs for DPO only.
`.trim();

export interface AgentPromptContext {
  org: OrgConfig;
  request: RequestPacket;
  tool?: ToolRecord;
  approvedTools: ToolRecord[];
}

export const AGENT_TITLES: Record<AgentId, string> = {
  workflow_runner: 'Workflow Runner',
  corporate_compliance: 'Corporate Compliance',
  it_infra: 'IT & Infra',
  procurement: 'Procurement & Vendor Risk',
  works_council: 'Works Council Liaison',
};

function buildRunner(ctx: AgentPromptContext): string {
  return [
    'ROLE: Workflow Runner — you ADVOCATE for the employee request. You want this',
    'tool approved fast for the productivity win. You may concede on routing or',
    'logging, but you push for the use case. You CANNOT override red lines.',
    '',
    'Approved tool list: ' + ctx.approvedTools.map((t) => t.tool_id).join(', '),
    '',
    requestText(ctx.request, ctx.tool),
    '',
    ENVELOPE_CONTRACT,
  ].join('\n');
}

function buildCompliance(ctx: AgentPromptContext): string {
  return [
    'ROLE: Corporate Compliance (GUARDIAN). You own GDPR, EU AI Act risk tiering,',
    'audit-field scope, and DPIA triggers. You have VETO on prohibited or high-risk',
    'use without human oversight. You demand fingerprint-only logs and EU routing',
    'for sensitive data. Channel the persona below.',
    '',
    PERSONA_CARD,
    '',
    orgFloorText(ctx.org),
    '',
    REG_SUMMARY,
    '',
    requestText(ctx.request, ctx.tool),
    '',
    ENVELOPE_CONTRACT,
  ].join('\n');
}

function buildItInfra(ctx: AgentPromptContext): string {
  return [
    'ROLE: IT & Infra (OPTIMIZER). You own routing, cost, sovereignty, SSO. You',
    'prefer routing sensitive / payment-schema traffic to LOCAL_QWEN_72B for data',
    'sovereignty and cost, with a department token cap. You can block a route only',
    'if capacity/budget is impossible.',
    '',
    orgFloorText(ctx.org),
    '',
    'Routing targets: ' + Object.keys(ctx.org.routing_targets).join(', '),
    '',
    requestText(ctx.request, ctx.tool),
    '',
    ENVELOPE_CONTRACT,
  ].join('\n');
}

function buildProcurement(ctx: AgentPromptContext): string {
  return [
    'ROLE: Procurement & Vendor Risk (GATEKEEPER). You own DPA, subprocessor list,',
    'VRM. You have VETO if vendor_dpa_status != signed. No approval until the DPA is',
    'executed.',
    '',
    REG_SUMMARY,
    '',
    requestText(ctx.request, ctx.tool),
    '',
    ENVELOPE_CONTRACT,
  ].join('\n');
}

function buildWorksCouncil(ctx: AgentPromptContext): string {
  return [
    'ROLE: Works Council Liaison (CO-DESIGN, DE entities). You own Betriebsvereinbarung',
    'status and logging visibility. You have VETO if entity is DE and',
    'betriebsvereinbarung_status == pending for company-wide rollout. A small pilot',
    'may be conditional after an annex draft circulates.',
    '',
    orgFloorText(ctx.org),
    '',
    REG_SUMMARY,
    '',
    requestText(ctx.request, ctx.tool),
    '',
    ENVELOPE_CONTRACT,
  ].join('\n');
}

const BUILDERS: Record<AgentId, (ctx: AgentPromptContext) => string> = {
  workflow_runner: buildRunner,
  corporate_compliance: buildCompliance,
  it_infra: buildItInfra,
  procurement: buildProcurement,
  works_council: buildWorksCouncil,
};

export function buildSystemPrompt(agent: AgentId, ctx: AgentPromptContext): string {
  return BUILDERS[agent](ctx);
}

export function buildUserPrompt(agent: AgentId, round: number): string {
  return `Round ${round}. As ${AGENT_TITLES[agent]}, state your position on this request now. Emit your single JSON envelope.`;
}
