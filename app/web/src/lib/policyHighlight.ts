import type { PolicyArtifact } from '@trustflow/shared';

/** JSON line keys highlighted in rules.json (negotiated above org seed defaults). */
export const POLICY_JSON_HIGHLIGHT_KEYS = [
  'sensitive',
  'retention_class',
  'deny_overrides',
  'max_tokens_per_day',
  'risk_tier',
  'default',
] as const;

export interface PolicyHighlightRow {
  label: string;
  value: string;
}

/** Human-readable summary of what the boardroom negotiated into the policy artifact. */
export function policyNegotiatedHighlights(policy: PolicyArtifact): PolicyHighlightRow[] {
  const rows: PolicyHighlightRow[] = [];

  if (policy.risk_tier) {
    rows.push({ label: 'Risk tier', value: policy.risk_tier });
  }
  if (policy.routing?.sensitive) {
    rows.push({ label: 'Sensitive data routing', value: policy.routing.sensitive });
  }
  if (policy.routing?.default) {
    rows.push({ label: 'Default route', value: policy.routing.default });
  }
  if (policy.audit?.retention_class) {
    rows.push({ label: 'Audit retention', value: policy.audit.retention_class });
  }
  if (policy.budget?.max_tokens_per_day) {
    rows.push({
      label: 'Daily token cap',
      value: policy.budget.max_tokens_per_day.toLocaleString(),
    });
  }
  for (const [entity, action] of Object.entries(policy.pii_masking ?? {})) {
    rows.push({ label: `PII · ${entity}`, value: action });
  }
  if ((policy.deny_overrides ?? []).length > 0) {
    rows.push({
      label: 'Standing blocks until gates clear',
      value: policy.deny_overrides!.join(', '),
    });
  }

  return rows;
}

export function policyJsonLineHighlighted(line: string): boolean {
  return POLICY_JSON_HIGHLIGHT_KEYS.some((k) => line.includes(`"${k}"`));
}
