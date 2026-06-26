/**
 * Gateway enforcement (LAYER A — deterministic). Runs the pre-flight checks in
 * the EXACT order from ARCHITECTURE §3.2:
 *
 *   4. Pre-flight checks (ordered):
 *      a. tool approved?
 *      b. betriebsvereinbarung_status == signed (if DE entity)?
 *      c. budget remaining?
 *      d. risk tier permits use case?
 *      e. PII scan → mask | block
 *   5. Route to model per policy.routing
 *   6. Post-flight: fingerprint output, emit audit event
 *
 * No LLM in this path. The policy is loaded by id/hash; every decision is a
 * pure function of the policy + the request, and every outcome emits a
 * schema-valid audit event.
 */
import { randomUUID } from 'node:crypto';
import { sha256 } from '@trustflow/shared';
import type {
  DenyReasonCode,
  GatewayAuditEvent,
  OrgConfig,
  PolicyArtifact,
  RequestPacket,
  RoutingDecision,
  ToolRegistry,
} from '@trustflow/shared';
import { scanAndApply } from './pii.js';
import { resolveRoute, stubbedLocalResponse } from './routing.js';
import { emitAuditEvent } from './audit.js';

export interface InferenceRequest {
  policy: PolicyArtifact;
  policy_version_hash: string;
  request: RequestPacket;
  prompt: string;
  actor_id?: string;
}

export interface InferenceResult {
  outcome: GatewayAuditEvent['outcome'];
  deny_reason_code?: DenyReasonCode;
  routing_decision: RoutingDecision | 'BLOCKED';
  redacted_prompt?: string;
  response_body?: string;
  audit_event: GatewayAuditEvent;
}

export interface GatewayContext {
  org: OrgConfig;
  registry: ToolRegistry;
  /** Per-pool tokens already consumed today (in-memory demo budget tracker). */
  budgetUsed?: Record<string, number>;
}

/** Approximate token count for the demo budget check (4 chars/token). */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function runInference(req: InferenceRequest, ctx: GatewayContext): InferenceResult {
  const { policy, request, prompt } = req;
  const actor_id = req.actor_id ?? 'emp_demo';
  const tool = ctx.registry.tools.find((t) => t.tool_id === policy.tool_id);

  const base = {
    policy_id: policy.policy_id,
    policy_version_hash: req.policy_version_hash,
    actor_id,
    department_id: request.department,
    tool_id: policy.tool_id,
    risk_tier: policy.risk_tier,
    input_fingerprint: sha256(prompt),
    retention_class: policy.audit.retention_class,
  } as const;

  const deny = (
    code: DenyReasonCode,
    extra: Partial<GatewayAuditEvent> = {},
  ): InferenceResult => {
    const audit_event = emitAuditEvent({
      event_type: code === 'PII_BLOCK' ? 'pii_redaction' : 'request_denied',
      ...base,
      model_provider: 'none',
      model_id: 'none',
      routing_decision: 'BLOCKED',
      outcome: 'denied',
      deny_reason_code: code,
      ...extra,
    });
    return { outcome: 'denied', deny_reason_code: code, routing_decision: 'BLOCKED', audit_event };
  };

  // 4a. tool approved? (in registry, with a signed-or-na DPA at policy level)
  if (!tool) return deny('TOOL_NOT_APPROVED');

  // Honor any standing deny_overrides on the policy (gates not yet cleared).
  const overrides = policy.deny_overrides ?? [];

  // 4b. betriebsvereinbarung signed (if DE)?
  if (ctx.org.entity_country === 'DE' && policy.gates.betriebsvereinbarung_status === 'pending') {
    return deny('BETRIEBSVEREINBARUNG_PENDING');
  }
  if (overrides.includes('BETRIEBSVEREINBARUNG_PENDING')) {
    return deny('BETRIEBSVEREINBARUNG_PENDING');
  }

  // Vendor DPA gate (procurement).
  if (policy.gates.vendor_dpa_status === 'pending' || overrides.includes('VENDOR_DPA_PENDING')) {
    return deny('VENDOR_DPA_PENDING');
  }

  // 4c. budget remaining?
  const poolId = policy.budget?.pool_id;
  const cap = policy.budget?.max_tokens_per_day;
  if (poolId && cap) {
    const used = ctx.budgetUsed?.[poolId] ?? 0;
    if (used + estimateTokens(prompt) > cap) {
      return deny('BUDGET_EXCEEDED', { event_type: 'budget_cap_hit', budget_pool_id: poolId });
    }
  }

  // 4d. risk tier permits use case?
  if (policy.risk_tier === 'prohibited') return deny('PROHIBITED_PRACTICE');
  if (policy.risk_tier === 'high_risk') return deny('HIGH_RISK_USE_DENIED');

  // 4e. PII scan → mask | block
  const pii = scanAndApply(prompt, policy.pii_masking);
  if (pii.blocked) {
    return deny('PII_BLOCK', {
      event_type: 'pii_redaction',
      pii_actions: pii.actions,
    });
  }

  // 5. Route to model per policy.routing
  const route = resolveRoute(policy, request);
  const response_body = route.stubbed
    ? stubbedLocalResponse(pii.redactedText)
    : `[${route.decision} response] (live call elided in gateway demo)`;

  // 6. Post-flight: fingerprint output, emit audit event
  const audit_event = emitAuditEvent({
    event_id: randomUUID(),
    event_type: 'inference_response',
    ...base,
    model_provider: route.model_provider,
    model_id: route.model_id,
    routing_decision: route.decision,
    pii_actions: pii.actions.length ? pii.actions : undefined,
    input_fingerprint: sha256(pii.redactedText),
    output_fingerprint: sha256(response_body),
    outcome: route.decision === 'LOCAL_QWEN_72B' ? 'redirected' : 'allowed',
    disclosure_shown: policy.gates.disclosure_required ?? false,
    token_usage: { prompt_tokens: estimateTokens(pii.redactedText) },
  });

  return {
    outcome: audit_event.outcome,
    routing_decision: route.decision,
    redacted_prompt: pii.redactedText,
    response_body,
    audit_event,
  };
}
