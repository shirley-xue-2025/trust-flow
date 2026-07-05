import type { BoardroomEnvelope, GatewayAuditEvent, PolicyArtifact, RequestPacket } from '@trustflow/shared';
import type { BoardroomResult, InferenceResponse } from '../api.js';
import { DENY_LABELS } from '../lib/agentLabels.js';

export interface GlassboxSummaryContext {
  request?: RequestPacket;
  replay?: string;
  turns: BoardroomEnvelope[];
  running: boolean;
  result: BoardroomResult | null;
  policy?: PolicyArtifact;
  policyHash?: string;
  inference: InferenceResponse | null;
  auditEvents: GatewayAuditEvent[];
}

export function nodeSummary(id: string, ctx: GlassboxSummaryContext): string {
  const { request, replay, turns, running, result, policy, policyHash, inference, auditEvents } = ctx;

  switch (id) {
    case 'request':
      if (!request) return 'Pick a scenario or configure';
      return `${request.tool_id} · ${request.use_case_category.replace(/_/g, ' ')}`;
    case 'org-gates': {
      if (!request) return 'DPA · Works council · entity';
      const br = request.betriebsvereinbarung_status ?? 'from packet';
      const dpa = request.vendor_dpa_status ?? 'from packet';
      const classes = request.data_classes?.length ? `${request.data_classes.length} data class` : 'no sensitive class';
      return `DPA ${dpa} · Works council ${br} · ${classes}`;
    }
    case 'boardroom':
      if (running) return `Live · ${turns.length} turns streaming`;
      if (turns.length === 0) return replay ? `Replay ${replay} — click Run` : 'Five agents · click Run';
      return `${turns.length} rounds · ${result?.outcome ?? '…'}`;
    case 'compiler':
      if (!result) return 'Awaiting boardroom';
      return `${result.outcome} · signed hash`;
    case 'policy':
      if (!policy) return 'No rules.json yet';
      return `v${policy.version} · ${(policy.deny_overrides ?? []).length} overrides`;
    case 'gateway':
      if (!policy) return 'Needs compiled policy';
      if (!inference) return 'Send a prompt to test';
      return `${inference.outcome} · route ${inference.routing_decision}`;
    case 'audit':
      return auditEvents.length ? `${auditEvents.length} events · retention` : 'Empty until inference';
    case 'result': {
      const outcome = inference?.outcome ?? result?.outcome;
      if (!outcome) return 'Run pipeline';
      const route = inference?.routing_decision ?? result?.routing_decision;
      const hash = policyHash?.slice(0, 10);
      return `${outcome}${route ? ` · ${route}` : ''}${hash ? ` · ${hash}…` : ''}`;
    }
    default:
      return '';
  }
}

export function resultGrounding(ctx: GlassboxSummaryContext): {
  decision: string;
  routing: string;
  grounding: string;
  numbersFrom: string;
  detail: string;
} {
  const outcome = (ctx.inference?.outcome ?? ctx.result?.outcome ?? 'pending') as string;
  const routing = ctx.inference?.routing_decision ?? ctx.result?.routing_decision ?? '—';
  const hasHash = Boolean(ctx.policyHash);
  const hasAudit = ctx.auditEvents.length > 0;
  const pii = ctx.inference?.audit_event?.pii_actions?.[0];

  let detail = 'Agents propose; deterministic compiler signs; gateway enforces without LLM.';
  if (pii?.action === 'masked') {
    detail = `Email masked at gateway — business continues on ${routing}.`;
  } else if (ctx.inference?.outcome === 'denied') {
    const code = ctx.inference.deny_reason_code;
    detail = code ? (DENY_LABELS[code] ?? `Blocked: ${code}`) : 'Blocked at gateway.';
  } else if (ctx.result?.outcome === 'DENIED') {
    const code = ctx.result.deny_code;
    detail = code
      ? (DENY_LABELS[code] ?? `Boardroom denied: ${code}`)
      : 'Boardroom denied — policy gates.';
  }

  return {
    decision: outcome.toUpperCase(),
    routing,
    grounding: hasHash && hasAudit ? '✓ hash signed · audit emitted' : hasHash ? '✓ compiler hash signed' : 'pending compile',
    numbersFrom: 'deterministic gateway',
    detail,
  };
}
