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
 * The policy is loaded by id/hash; every pre-flight/routing decision is a pure
 * function of the policy + the request, and every outcome emits a
 * schema-valid audit event. This holds fully offline (no API key): the
 * completion step then returns the deterministic placeholder text below. With
 * an API key configured, the completion step (5→6) becomes a live call to the
 * resolved route's model — the "no LLM in this path" invariant applies to
 * pre-flight/routing only, not to the completion result itself.
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
import {
  ROUTE_META,
  resolveRoute,
  routeClientConfig,
  stubbedCloudResponse,
  stubbedLocalResponse,
} from './routing.js';
import { emitAuditEvent } from './audit.js';
import { chatComplete, hasApiKeyFor } from '../qwen/client.js';

const GATEWAY_SYSTEM_PROMPT =
  'You are a corporate AI assistant operating under an enterprise governance policy. Answer the user prompt directly and concisely.';

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
  /** True when sensitive/payment traffic was redacted on the sovereign local
   * node before being relayed to `routing_decision` for completion. */
  local_redaction: boolean;
  /** Audit event for the local redaction hop, present only when local_redaction
   * is true. Chained to `audit_event` via parent_event_id. */
  redaction_audit_event?: GatewayAuditEvent;
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

export async function runInference(
  req: InferenceRequest,
  ctx: GatewayContext,
  opts: { activation_status?: 'draft' | 'active' | 'revoked' } = {},
): Promise<InferenceResult> {
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
    return {
      outcome: 'denied',
      deny_reason_code: code,
      routing_decision: 'BLOCKED',
      local_redaction: false,
      audit_event,
    };
  };

  // Policy must be human-activated before gateway enforcement (HITL spec).
  if (opts.activation_status && opts.activation_status !== 'active') {
    return deny('POLICY_NOT_ACTIVATED');
  }

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

  // Local redaction relay: the sovereign node already did its job (the PII scan
  // above), so this hop is purely an audit record of "traffic passed through
  // the local safety gateway before continuing to the cloud" — chained to the
  // completion event via parent_event_id.
  let redaction_audit_event: GatewayAuditEvent | undefined;
  if (route.localRedaction) {
    const localMeta = ROUTE_META.LOCAL_QWEN_72B;
    redaction_audit_event = emitAuditEvent({
      event_id: randomUUID(),
      event_type: 'pii_redaction',
      ...base,
      model_provider: localMeta.provider,
      model_id: localMeta.model,
      routing_decision: 'LOCAL_QWEN_72B',
      pii_actions: pii.actions.length ? pii.actions : undefined,
      input_fingerprint: sha256(prompt),
      output_fingerprint: sha256(pii.redactedText),
      outcome: 'redirected',
      disclosure_shown: policy.gates.disclosure_required ?? false,
    });
  }

  const cfg = routeClientConfig(route.decision);
  const response_body = hasApiKeyFor(cfg)
    ? await chatComplete(cfg, GATEWAY_SYSTEM_PROMPT, pii.redactedText)
    : route.stubbed
      ? stubbedLocalResponse(pii.redactedText)
      : stubbedCloudResponse(route.decision);

  // 6. Post-flight: fingerprint output, emit audit event
  const audit_event = emitAuditEvent({
    event_id: randomUUID(),
    parent_event_id: redaction_audit_event?.event_id,
    event_type: 'inference_response',
    ...base,
    model_provider: route.model_provider,
    model_id: route.model_id,
    routing_decision: route.decision,
    pii_actions: redaction_audit_event ? undefined : pii.actions.length ? pii.actions : undefined,
    input_fingerprint: sha256(pii.redactedText),
    output_fingerprint: sha256(response_body),
    outcome: route.decision === 'LOCAL_QWEN_72B' ? 'redirected' : 'allowed',
    disclosure_shown: policy.gates.disclosure_required ?? false,
    token_usage: { prompt_tokens: estimateTokens(pii.redactedText) },
  });

  return {
    outcome: audit_event.outcome,
    routing_decision: route.decision,
    local_redaction: route.localRedaction,
    redaction_audit_event,
    redacted_prompt: pii.redactedText,
    response_body,
    audit_event,
  };
}
