/**
 * Single-agent baseline — one "super governance" prompt on the same request packet
 * the multi-agent boardroom sees. Used for Track 3 measurable-improvement evidence:
 * monolith rubber-stamps; specialist lanes surface procurement veto (S05).
 */
import type { BoardroomEnvelope, OrgConfig, RequestPacket, ToolRecord } from '@trustflow/shared';
import { parseEnvelope } from '../boardroom/envelope.js';
import { qwenAgentTurn } from '../qwen/client.js';

const SINGLE_AGENT_CONTRACT = `
Reply with EXACTLY ONE JSON object (no prose, no markdown):

{
  "stance": "approve | conditional_approve | conditional_reject | reject",
  "claims":      [ { "type": "regulatory|vendor|cost|process", "ref": "...", "text": "..." } ],
  "demands":     [ { "field": "audit.raw_prompt_logging", "value": false, "hard": true } ],
  "concessions": [ { "field": "routing.sensitive", "value": "LOCAL_QWEN_72B" } ],
  "evidence_ids": ["R0008"],
  "natural_language": "One or two sentences — your final recommendation to leadership."
}

Use the same field paths as the boardroom: risk_tier, audit.*, pii_masking.*, routing.*,
gates.*, budget.*.
`.trim();

function orgFloorText(org: OrgConfig): string {
  return [
    `Org policy floor (${org.display_name}, ${org.entity_country}):`,
    `- audit.raw_prompt_logging must stay ${org.policy_floor.audit.raw_prompt_logging}`,
    `- audit.manager_dashboard_allowed must stay ${org.policy_floor.audit.manager_dashboard_allowed}`,
    `- min retention: ${org.policy_floor.min_retention_class}`,
    `- works council present: ${org.has_works_council}`,
  ].join('\n');
}

function requestText(req: RequestPacket, tool?: ToolRecord): string {
  return [
    'Employee tool request:',
    `- tool_id: ${req.tool_id}${tool ? ` (${tool.display_name}, vendor ${tool.vendor})` : ''}`,
    `- use_case: ${req.use_case_category}`,
    `- entity: ${req.entity_country ?? 'DE'}`,
    `- vendor_dpa_status: ${req.vendor_dpa_status ?? tool?.vendor_dpa_status ?? 'pending'}`,
    `- betriebsvereinbarung_status: ${req.betriebsvereinbarung_status ?? 'pending'}`,
    `- annex_iii_risk: ${req.annex_iii_risk ?? false}`,
  ].join('\n');
}

/** Prompt models a single generic "AI governance advisor" — no specialist lanes. */
export function buildSingleAgentSystemPrompt(ctx: {
  org: OrgConfig;
  request: RequestPacket;
  tool?: ToolRecord;
}): string {
  return [
    'ROLE: Enterprise AI Governance Advisor (MONOLITH BASELINE).',
    'You are the ONLY agent — you must cover compliance, vendor risk, works council,',
    'and IT in one shot. There is no separate Procurement queue or Works Council',
    'review step after you. Leadership expects a clear approve/conditional answer',
    'so employees can start using the tool.',
    '',
    'Bias: for LIMITED_RISK use cases (summarization, code completion), favor',
    'conditional_approve with standard safeguards (audit retention, transparency,',
    'no raw prompt logging) rather than blocking on process gates that may be',
    '"in progress". Vendor DPAs and Betriebsvereinbarung are important but are often',
    'handled in parallel with pilot rollouts — do not be the bottleneck unless the',
    'use case is high-risk or prohibited.',
    '',
    orgFloorText(ctx.org),
    '',
    requestText(ctx.request, ctx.tool),
    '',
    SINGLE_AGENT_CONTRACT,
  ].join('\n');
}

export function buildSingleAgentUserPrompt(): string {
  return [
    'Assess this request and emit your single JSON recommendation.',
    'There is no debate — your envelope is the final governance opinion.',
  ].join('\n');
}

export async function runSingleAgentBaseline(opts: {
  session_id: string;
  org: OrgConfig;
  request: RequestPacket;
  tool?: ToolRecord;
}): Promise<BoardroomEnvelope> {
  const systemPrompt = buildSingleAgentSystemPrompt(opts);
  const userPrompt = buildSingleAgentUserPrompt();
  const raw = await qwenAgentTurn({
    systemPrompt,
    userPrompt,
    session_id: opts.session_id,
    round: 0,
    agent: 'corporate_compliance',
  });
  return {
    ...parseEnvelope(raw, {
      session_id: opts.session_id,
      round: 0,
      agent: 'corporate_compliance',
    }),
    agent: 'corporate_compliance' as const,
  };
}

/** Map envelope stance to a plain recommendation for judges. */
export function recommendationFromStance(stance: BoardroomEnvelope['stance']): 'APPROVE' | 'DENY' | 'CONDITIONAL' {
  if (stance === 'approve') return 'APPROVE';
  if (stance === 'reject' || stance === 'conditional_reject') return 'DENY';
  return 'CONDITIONAL';
}
