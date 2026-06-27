/**
 * Routing (LAYER A — deterministic). Resolves the model route for a request from
 * the policy's routing rules. LOCAL_QWEN_72B is STUBBED — we still produce a real
 * routing decision + audit event, but the response body is a canned mock.
 */
import type { PolicyArtifact, RequestPacket, RoutingDecision } from '@trustflow/shared';

export interface RouteResolution {
  decision: RoutingDecision;
  /** Provider string for the audit event. */
  model_provider: string;
  model_id: string;
  stubbed: boolean;
}

const ROUTE_META: Record<RoutingDecision, { provider: string; model: string }> = {
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
  let target = policy.routing.default;
  if (isSensitiveRequest(request) && policy.routing.sensitive) {
    target = policy.routing.sensitive;
  }
  // Any explicit rule whose predicate fires wins (deterministic predicate names).
  for (const rule of policy.routing.rules ?? []) {
    if (rule.if === 'data_class_payment_schema' && isSensitiveRequest(request)) {
      target = rule.route;
    }
  }

  const decision = (target as RoutingDecision) in ROUTE_META
    ? (target as RoutingDecision)
    : 'CLOUD_QWEN_MAX';
  const meta = ROUTE_META[decision];
  return {
    decision,
    model_provider: meta.provider,
    model_id: meta.model,
    stubbed: decision === 'LOCAL_QWEN_72B',
  };
}

/** Canned mock response body for the stubbed local node. */
export function stubbedLocalResponse(prompt: string): string {
  return `[LOCAL_QWEN_72B mock] Processed ${prompt.length} chars on the sovereign on-prem node. (stubbed response — no GPU in hackathon MVP)`;
}
