import type { EmployeeRequestRecord, PolicyArtifact } from '@trustflow/shared';
import { DENY_LABELS } from './agentLabels.js';

export interface ComplianceCheck {
  id: string;
  label: string;
  status: 'done' | 'pending' | 'blocked' | 'na';
  detail?: string;
}

export interface ComplianceScoreResult {
  percent: number;
  checks: ComplianceCheck[];
  summary: string;
}

/** Role-friendly compliance breakdown — not a legal certification. */
export function computeComplianceScore(
  record: EmployeeRequestRecord,
  policy?: PolicyArtifact | null,
): ComplianceScoreResult {
  const gates = policy?.gates ?? record.packet;
  const brStatus =
    policy?.gates?.betriebsvereinbarung_status ??
    record.packet.betriebsvereinbarung_status ??
    'pending';
  const brBlockedByPolicy = policy?.deny_overrides?.includes('BETRIEBSVEREINBARUNG_PENDING');
  const dpaStatus =
    policy?.gates?.vendor_dpa_status ?? record.packet.vendor_dpa_status ?? 'pending';

  const display = record.display_status ?? record.status;

  const checks: ComplianceCheck[] = [
    {
      id: 'vendor_dpa',
      label: 'Vendor DPA',
      status:
        dpaStatus === 'signed' || dpaStatus === 'not_applicable'
          ? 'done'
          : dpaStatus === 'pending'
            ? 'pending'
            : 'blocked',
      detail:
        dpaStatus === 'signed'
          ? 'Procurement confirmed signed DPA'
          : dpaStatus === 'pending'
            ? 'Awaiting procurement sign-off'
            : undefined,
    },
    {
      id: 'betriebsrat',
      label: 'Betriebsvereinbarung',
      status:
        brStatus === 'signed' || brStatus === 'not_required'
          ? brBlockedByPolicy
            ? 'pending'
            : 'done'
          : brStatus === 'pending'
            ? 'pending'
            : 'blocked',
      detail:
        brBlockedByPolicy || brStatus === 'pending'
          ? 'Works council annex required before rollout'
          : brStatus === 'signed'
            ? 'Works council agreement in place'
            : undefined,
    },
    {
      id: 'policy',
      label: 'Compiled policy',
      status: record.policy_id && record.policy_version_hash ? 'done' : display === 'negotiating' ? 'pending' : 'blocked',
      detail: record.policy_version_hash
        ? `Signed hash ${record.policy_version_hash.slice(0, 12)}…`
        : 'Boardroom has not produced a policy yet',
    },
    {
      id: 'gateway',
      label: 'Gateway enforcement',
      status:
        display === 'approved'
          ? 'done'
          : display === 'denied' || display === 'denied_closed'
            ? 'blocked'
            : record.policy_id
              ? 'pending'
              : 'na',
      detail:
        display === 'approved'
          ? `Routing: ${record.routing_decision ?? 'configured'}`
          : record.deny_code
            ? DENY_LABELS[record.deny_code] ?? `Blocked: ${record.deny_code}`
            : undefined,
    },
    {
      id: 'audit',
      label: 'Audit trail',
      status: policy?.audit?.required_fields?.length ? 'done' : record.policy_id ? 'pending' : 'na',
      detail: policy?.audit?.retention_class
        ? `Retention: ${policy.audit.retention_class.replace(/_/g, ' ')}`
        : 'Art. 26-ready fields when policy compiles',
    },
  ];

  const scored = checks.filter((c) => c.status !== 'na');
  const done = scored.filter((c) => c.status === 'done').length;
  const percent = scored.length ? Math.round((done / scored.length) * 100) : 0;

  let summary = 'Negotiation in progress';
  if (display === 'approved') summary = 'Ready for governed use';
  else if (display === 'pending_signoff') summary = 'Waiting for human sign-off';
  else if (display === 'denied' || display === 'denied_closed' || display === 'denied_pending_employee') {
    summary = 'Cannot approve under current gates';
  } else if (display === 'pending_external') summary = 'Waiting on external sign-off';
  else if (display === 'pending_human' || display === 'appeal_pending') summary = 'Needs DPO or IT decision';

  return { percent, checks, summary };
}
