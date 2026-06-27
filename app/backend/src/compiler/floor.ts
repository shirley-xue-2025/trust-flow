/**
 * Floor check — reject any proposal weaker than the org policy_floor (NO LLM).
 *
 * These are the org's non-negotiable red lines. Even if the agents (or a
 * malformed/adversarial LLM proposal) try to weaken them, the deterministic
 * compiler refuses. This is the safety gate that makes "the LLM never touches
 * enforcement" true.
 */
import type { OrgConfig, PolicyArtifact } from '@trustflow/shared';

const RETENTION_RANK: Record<string, number> = {
  standard_6mo: 0,
  financial_sector: 1,
  high_risk_extended: 2,
};

export interface FloorViolation {
  field: string;
  reason: string;
}

/** Returns the list of floor violations; empty array = passes floor. */
export function checkFloor(draft: PolicyArtifact, org: OrgConfig): FloorViolation[] {
  const violations: FloorViolation[] = [];
  const floor = org.policy_floor;

  // Raw prompt logging may never be enabled above the floor.
  if (floor.audit.raw_prompt_logging === false && draft.audit.raw_prompt_logging === true) {
    violations.push({
      field: 'audit.raw_prompt_logging',
      reason: 'raw prompt logging is forbidden by org policy floor',
    });
  }

  // Manager dashboards may never be enabled above the floor.
  if (
    floor.audit.manager_dashboard_allowed === false &&
    draft.audit.manager_dashboard_allowed === true
  ) {
    violations.push({
      field: 'audit.manager_dashboard_allowed',
      reason: 'manager dashboard access is forbidden by org policy floor',
    });
  }

  // Retention class may not be weaker (shorter) than the floor.
  const floorRank = RETENTION_RANK[floor.min_retention_class] ?? 0;
  const draftRank = RETENTION_RANK[draft.audit.retention_class] ?? 0;
  if (draftRank < floorRank) {
    violations.push({
      field: 'audit.retention_class',
      reason: `retention ${draft.audit.retention_class} is weaker than floor ${floor.min_retention_class}`,
    });
  }

  // Prohibited practices are denied if the floor says so.
  if (floor.deny_prohibited_practices && draft.risk_tier === 'prohibited') {
    violations.push({
      field: 'risk_tier',
      reason: 'prohibited practice is denied by org policy floor',
    });
  }

  return violations;
}
