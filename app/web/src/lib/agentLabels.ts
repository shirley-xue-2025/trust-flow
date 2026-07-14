export const AGENT_LABELS: Record<string, string> = {
  workflow_runner: 'Workflow Runner',
  procurement: 'Procurement & Vendor Risk',
  corporate_compliance: 'Corporate Compliance',
  works_council: 'Works Council Liaison',
  it_infra: 'IT & Infrastructure',
};

export const DENY_LABELS: Record<string, string> = {
  BETRIEBSVEREINBARUNG_PENDING: 'Works council agreement (Betriebsvereinbarung) not signed',
  VENDOR_DPA_PENDING: 'Vendor data processing agreement pending',
  PII_BLOCK: 'Personal data blocked at gateway',
  HIGH_RISK_USE_DENIED: 'High-risk use case requires human oversight',
  TOOL_NOT_APPROVED: 'Tool not on approved registry',
  BUDGET_EXCEEDED: 'Budget cap exceeded',
  PROHIBITED_PRACTICE: 'Prohibited AI practice',
};

export const STANCE_LABELS: Record<string, string> = {
  approve: 'Supports',
  conditional_approve: 'Conditional',
  conditional_reject: 'Concerns',
  reject: 'Opposes',
  pass: 'Deferred',
};

/** Human labels for routing_decision codes shown to judges. */
export const ROUTING_LABELS: Record<string, string> = {
  CLOUD_QWEN_MAX: 'Completed in cloud',
  LOCAL_QWEN_72B: 'Processed on-prem',
  BLOCKED: 'Blocked',
};

export function formatRoutingLabel(
  route: string | null | undefined,
  outcome?: string | null,
): string | null {
  if (!route || outcome === 'DENIED') return null;
  return ROUTING_LABELS[route] ?? route.replace(/_/g, ' ').toLowerCase();
}
