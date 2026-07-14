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
import type {
  AgentId,
  BoardroomEnvelope,
  DebateBeat,
  OrgConfig,
  RequestPacket,
  ToolRecord,
} from '@trustflow/shared';

const ENVELOPE_CONTRACT = `
You are one agent in a corporate AI-governance boardroom. Reply with EXACTLY ONE
JSON object (no prose, no markdown) matching this envelope:

{
  "stance": "approve | conditional_approve | conditional_reject | reject | pass",
  "claims":      [ { "type": "regulatory|vendor|cost|process", "ref": "Art.X", "text": "..." } ],
  "demands":     [ { "field": "audit.raw_prompt_logging", "value": false, "hard": true } ],
  "concessions": [ { "field": "routing.sensitive", "value": "LOCAL_QWEN_72B" } ],
  "evidence_ids": ["R0008"],
  "natural_language": "3–5 sentences for the UI transcript — speak like a real meeting, not a bullet list."
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
    'ROLE: Workflow Runner — you ADVOCATE for the employee request and the',
    'productivity it unlocks. Push for approval. When an agent blocks or piles on',
    'restrictions, name the cost (delivery delay, employees falling back to Shadow',
    'AI) and propose a CONCRETE path forward — a narrower pilot, an alternative tool',
    'that already has a signed DPA, or EU routing — rather than capitulating. You may',
    'concede on routing, budget, or disclosure. You must NEVER offer to weaken the red',
    'lines below (no raw prompt logging, no manager dashboards) and do NOT raise hard',
    'demands against your own request.',
    '',
    'Approved tools (with DPA status, for proposing alternatives): ' +
      ctx.approvedTools.map((t) => `${t.tool_id} [DPA ${t.vendor_dpa_status}]`).join(', '),
    '',
    orgFloorText(ctx.org),
    '',
    requestText(ctx.request, ctx.tool),
    '',
    ENVELOPE_CONTRACT,
  ].join('\n');
}

function buildCompliance(ctx: AgentPromptContext): string {
  return [
    'ROLE: Corporate Compliance (GUARDIAN). You own GDPR, EU AI Act risk tiering,',
    'audit-field scope, and DPIA triggers. For Annex III / high-risk use without',
    'human oversight, or a prohibited practice, your stance is "reject". Otherwise',
    '"conditional_approve" with your audit/PII demands. Push back if another agent',
    'understates risk or if the Runner downplays a DPIA trigger. Demand only in your',
    'lane (risk_tier, audit.*, pii_masking.*). Channel the persona below.',
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
    'sovereignty and cost, with a department token cap. You generally approve, but',
    'you MAY challenge a demand that is operationally costly or a route that is',
    'infeasible, and push for the cheaper compliant option. Demand only routing.* /',
    'budget.* in your lane.',
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
    'VRM. When vendor_dpa_status is "signed" you may approve; when "pending" your',
    'stance is "conditional_reject" and you BLOCK until the DPA is executed — do not',
    'soften to conditional_approve. Demand only gates.vendor_dpa_status in your lane.',
    'You may point the Runner toward an alternative tool that already has a DPA.',
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
    'status and logging visibility. When entity is DE and betriebsvereinbarung_status',
    'is "pending" for company-wide rollout, your stance is "conditional_reject" — a',
    'signed annex is required first (a small documented pilot may be conditional).',
    'Demand only in your lane (betriebsvereinbarung, logging visibility to mgmt). You',
    'care about §87(1) No.6 BetrVG, not vendor or routing details — defer those.',
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

/** One-line digest of a prior turn, so the next agent can react to it by name. */
function digestTurn(env: BoardroomEnvelope): string {
  const demands =
    (env.demands ?? [])
      .map((d) => `${d.field}=${String(d.value)}${d.hard ? ' (hard)' : ''}`)
      .join(', ') || 'none';
  const title = AGENT_TITLES[env.agent as AgentId] ?? env.agent;
  return `- ${title} [${env.stance}]: ${env.natural_language} | demands: ${demands}`;
}

/**
 * The user prompt carries the running transcript so each agent NEGOTIATES
 * against what was actually said, rather than emitting an isolated monologue.
 */
export function buildUserPrompt(
  agent: AgentId,
  round: number,
  priorTurns: BoardroomEnvelope[] = [],
  opts: { beat?: DebateBeat; addressing?: AgentId } = {},
): string {
  const title = AGENT_TITLES[agent];
  const beat = opts.beat ?? (priorTurns.length === 0 ? 'opening' : 'lane');
  const addressingTitle = opts.addressing ? AGENT_TITLES[opts.addressing] : undefined;

  const beatInstruction = (() => {
    switch (beat) {
      case 'opening':
        return `Round ${round}. You OPEN the boardroom. State the business case with urgency and specifics — what ships, what data is involved, what timeline is at risk.`;
      case 'lane':
        return `Round ${round}. As ${title}, give your LANE review — your mandate's verdict on this request.`;
      case 'rebuttal':
        return addressingTitle
          ? `Round ${round}. REBUTTAL — respond directly to ${addressingTitle}. This is a real back-and-forth: challenge their blocker, propose a narrower pilot, an alternative tool, or a concrete compromise. Do not rubber-stamp.`
          : `Round ${round}. REBUTTAL — respond to the prior speaker. Push back or propose a compromise.`;
      case 'final':
        return `Round ${round}. FINAL POSITION — state your sign-off stance given the full debate. Summarize what you accept, what still blocks you, and any concessions you are offering.`;
      default:
        return `Round ${round}. As ${title}, respond to the debate.`;
    }
  })();

  if (priorTurns.length === 0) {
    return `${beatInstruction} Emit your single JSON envelope.`;
  }

  return [
    beatInstruction,
    '',
    'The debate so far (oldest first):',
    priorTurns.map(digestTurn).join('\n'),
    '',
    `As ${title}, RESPOND to the debate — engage specific agents by name in natural_language.`,
    `A real boardroom does NOT rubber-stamp: where your mandate differs, push back,`,
    `challenge a demand as excessive, or propose an alternative.`,
    `- Emit "demands" ONLY for fields in YOUR domain. Do NOT repeat demands already`,
    `  listed above — the compiler already has them; react in natural_language.`,
    `- Use stance "reject" or "conditional_reject" when you are actually blocking.`,
    `- If you have no objection in your lane, stance "pass" with empty demands.`,
    `Then emit your single JSON envelope.`,
  ].join('\n');
}
