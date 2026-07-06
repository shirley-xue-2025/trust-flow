/**
 * Routing (LAYER A — deterministic). Resolves the model route for a request from
 * the policy's routing rules.
 *
 * LOCAL_QWEN_72B is a sovereign on-prem safety gateway, not an alternate answer
 * engine: when a policy sends sensitive/payment traffic there, the local node
 * redacts the prompt and the (redacted) request is then relayed to the org's
 * completion route (usually CLOUD_QWEN_MAX) — the cloud model still produces the
 * answer. `localRedaction` on the result flags that this relay happened. Only
 * when `routing.default` itself is LOCAL_QWEN_72B (no cloud route to relay to)
 * is it a genuine fully-local terminal decision — that path is STUBBED (no GPU
 * in the hackathon MVP), which is what `stubbed` / `stubbedLocalResponse` cover.
 */
import type { PolicyArtifact, RequestPacket, RoutingDecision } from '@trustflow/shared';

export interface RouteResolution {
  decision: RoutingDecision;
  /** Provider string for the audit event. */
  model_provider: string;
  model_id: string;
  stubbed: boolean;
  /** True when sensitive/payment traffic was redacted on the local node before
   * relaying to `decision` for completion (see module doc). */
  localRedaction: boolean;
}

export const ROUTE_META: Record<RoutingDecision, { provider: string; model: string }> = {
  CLOUD_QWEN_MAX: { provider: 'alibaba', model: 'qwen-max' },
  LOCAL_QWEN_72B: { provider: 'local', model: 'qwen2.5-72b-instruct' },
  BLOCKED: { provider: 'none', model: 'none' },
};

/** True when the request carries data classes the policy treats as sensitive. */
export function isSensitiveRequest(request: RequestPacket): boolean {
  return (request.data_classes ?? []).some((c) => c.includes('payment'));
}

/** Resolve the route a policy yields for a request (deterministic). */
export function resolveRoute(
  policy: PolicyArtifact,
  request: RequestPacket,
): RouteResolution {
  const sensitive = isSensitiveRequest(request);
  let sensitiveTarget: string | undefined;
  if (sensitive && policy.routing.sensitive) {
    sensitiveTarget = policy.routing.sensitive;
  }
  // Any explicit rule whose predicate fires wins (deterministic predicate names).
  for (const rule of policy.routing.rules ?? []) {
    if (rule.if === 'data_class_payment_schema' && sensitive) {
      sensitiveTarget = rule.route;
    }
  }

  const defaultTarget = policy.routing.default;
  // The local node is a redaction relay (not the destination) whenever the
  // sensitive-path target is LOCAL_QWEN_72B and a different completion route
  // exists to relay to. If the org's default route IS the local node, there's
  // nowhere else to relay to, so it's a genuine fully-local decision.
  const localRedaction = sensitiveTarget === 'LOCAL_QWEN_72B' && defaultTarget !== 'LOCAL_QWEN_72B';
  const target = localRedaction ? defaultTarget : (sensitiveTarget ?? defaultTarget);

  const decision = (target as RoutingDecision) in ROUTE_META
    ? (target as RoutingDecision)
    : 'CLOUD_QWEN_MAX';
  const meta = ROUTE_META[decision];
  return {
    decision,
    model_provider: meta.provider,
    model_id: meta.model,
    stubbed: decision === 'LOCAL_QWEN_72B',
    localRedaction,
  };
}

/** Canned mock response body for the stubbed local node. */
export function stubbedLocalResponse(prompt: string): string {
  return `[LOCAL_QWEN_72B mock] Processed ${prompt.length} chars on the sovereign on-prem node. (stubbed response — no GPU in hackathon MVP)`;
}
