/**
 * HITL request state — derive display status, boardroom completion, activation gates.
 */
import type {
  BoardroomEnvelope,
  EmployeeRequestRecord,
  EmployeeRequestStatus,
  OrgConfig,
  RequestPacket,
  ReviewerRole,
  SessionOutcome,
} from '@trustflow/shared';

export const DEMO_REVIEWERS: Record<
  ReviewerRole,
  { reviewer_id: string; reviewer_display_name: string }
> = {
  dpo: { reviewer_id: 'katrin.mueller@nordpay.example', reviewer_display_name: 'Katrin Müller' },
  procurement: {
    reviewer_id: 'procurement@nordpay.example',
    reviewer_display_name: 'Procurement Lead',
  },
  it: { reviewer_id: 'ciso@nordpay.example', reviewer_display_name: 'IT Security' },
};

export function defaultHitlFields(): Pick<
  EmployeeRequestRecord,
  'negotiation_phase' | 'human_decision' | 'employee_resolution' | 'policy_activation'
> {
  return {
    negotiation_phase: 'submitted',
    human_decision: 'not_required',
    employee_resolution: 'not_applicable',
    policy_activation: 'none',
  };
}

export function deriveDisplayStatus(record: EmployeeRequestRecord): EmployeeRequestStatus {
  if (record.negotiation_phase === 'submitted') return 'submitted';
  if (record.negotiation_phase === 'negotiating') return 'negotiating';

  if (record.agent_outcome === 'PENDING_EXTERNAL') return 'pending_external';
  if (record.agent_outcome === 'PENDING_HUMAN') return 'pending_human';

  if (record.employee_resolution === 'appealed') {
    if (record.human_decision === 'pending') return 'appeal_pending';
    return 'denied_closed';
  }

  if (record.agent_outcome === 'DENIED') {
    if (record.employee_resolution === 'pending') return 'denied_pending_employee';
    if (record.employee_resolution === 'accepted') return 'denied_closed';
    return 'denied_pending_employee';
  }

  if (record.agent_outcome === 'APPROVED') {
    if (record.policy_activation === 'active' && record.human_decision === 'complete') return 'approved';
    if (record.human_decision === 'pending' || record.policy_activation === 'draft') {
      return 'pending_signoff';
    }
    return 'agent_recommended_approve';
  }

  return record.status ?? 'submitted';
}

export function syncRecord(record: EmployeeRequestRecord): EmployeeRequestRecord {
  const display_status = deriveDisplayStatus(record);
  return { ...record, status: display_status, display_status };
}

export function migrateLegacyRecord(record: EmployeeRequestRecord): EmployeeRequestRecord {
  if (record.negotiation_phase) return syncRecord(record);

  const base = { ...record, ...defaultHitlFields() };
  const legacy = record.status;

  if (legacy === 'submitted') {
    return syncRecord({ ...base, negotiation_phase: 'submitted' });
  }
  if (legacy === 'negotiating') {
    return syncRecord({ ...base, negotiation_phase: 'negotiating' });
  }
  if (legacy === 'approved') {
    return syncRecord({
      ...base,
      negotiation_phase: 'complete',
      agent_outcome: record.outcome ?? 'APPROVED',
      outcome: record.outcome ?? 'APPROVED',
      human_decision: 'complete',
      employee_resolution: 'not_applicable',
      policy_activation: record.policy_id ? 'active' : 'none',
    });
  }
  if (legacy === 'denied') {
    return syncRecord({
      ...base,
      negotiation_phase: 'complete',
      agent_outcome: record.outcome ?? 'DENIED',
      outcome: record.outcome ?? 'DENIED',
      human_decision: 'not_required',
      employee_resolution: 'accepted',
      policy_activation: 'none',
    });
  }
  if (legacy === 'pending_external') {
    return syncRecord({
      ...base,
      negotiation_phase: 'complete',
      agent_outcome: 'PENDING_EXTERNAL',
      outcome: 'PENDING_EXTERNAL',
      policy_activation: record.policy_id ? 'draft' : 'none',
    });
  }
  if (legacy === 'pending_human') {
    return syncRecord({
      ...base,
      negotiation_phase: 'complete',
      agent_outcome: 'PENDING_HUMAN',
      outcome: 'PENDING_HUMAN',
      human_decision: 'pending',
      policy_activation: 'none',
    });
  }

  return syncRecord(base);
}

export function procurementReviewRequired(
  packet: RequestPacket,
  transcript: BoardroomEnvelope[],
): boolean {
  if (packet.vendor_dpa_status !== 'signed') return true;
  return transcript.some(
    (e) =>
      e.agent === 'procurement' &&
      e.demands?.some((d) => d.hard && String(d.field).toLowerCase().includes('dpa')),
  );
}

export function requiredReviewerRoles(
  packet: RequestPacket,
  transcript: BoardroomEnvelope[],
): ReviewerRole[] {
  const roles: ReviewerRole[] = ['dpo', 'it'];
  if (procurementReviewRequired(packet, transcript)) roles.push('procurement');
  return roles;
}

export function externalGatesClear(packet: RequestPacket, org: OrgConfig): boolean {
  const br = packet.betriebsvereinbarung_status ?? org.betriebsvereinbarung_status;
  if (org.entity_country === 'DE' && org.has_works_council && br === 'pending') return false;
  return true;
}

export interface ActivationState {
  can_activate: boolean;
  blocking_reasons: string[];
}

export function activationState(
  record: EmployeeRequestRecord,
  reviews: { reviewer_role: ReviewerRole; status: string; required: boolean }[],
  org: OrgConfig,
): ActivationState {
  const blocking: string[] = [];
  if (!externalGatesClear(record.packet, org)) {
    blocking.push('external_gate_pending');
  }
  for (const r of reviews) {
    if (r.required && r.status === 'pending') {
      blocking.push(`${r.reviewer_role}_review_pending`);
    }
    if (r.required && r.status === 'rejected') {
      blocking.push(`${r.reviewer_role}_review_rejected`);
    }
  }
  if (record.policy_activation !== 'draft' && record.policy_activation !== 'none') {
    if (record.policy_activation === 'active') {
      return { can_activate: true, blocking_reasons: [] };
    }
  }
  if (!record.policy_id) blocking.push('no_policy_compiled');
  return { can_activate: blocking.length === 0 && !!record.policy_id, blocking_reasons: blocking };
}

export function boardroomCompletePatch(
  record: EmployeeRequestRecord,
  outcome: SessionOutcome,
  org: OrgConfig,
  session: {
    session_id: string;
    deny_code?: string;
    routing_decision?: string;
    policy_id?: string;
    policy_version_hash?: string;
    transcript_length?: number;
  },
  transcript: BoardroomEnvelope[],
): Partial<EmployeeRequestRecord> {
  const patch: Partial<EmployeeRequestRecord> = {
    negotiation_phase: 'complete',
    agent_outcome: outcome,
    outcome,
    session_id: session.session_id,
    deny_code: session.deny_code,
    routing_decision: session.routing_decision,
    policy_id: session.policy_id,
    policy_version_hash: session.policy_version_hash,
    transcript_length: session.transcript_length,
  };

  switch (outcome) {
    case 'APPROVED':
      patch.policy_activation = session.policy_id ? 'draft' : 'none';
      patch.human_decision = 'pending';
      patch.employee_resolution = 'not_applicable';
      if (!externalGatesClear(record.packet, org)) {
        patch.human_decision = 'not_required';
      }
      break;
    case 'DENIED':
      patch.policy_activation = 'none';
      patch.human_decision = 'not_required';
      patch.employee_resolution = 'pending';
      break;
    case 'PENDING_EXTERNAL':
      patch.policy_activation = session.policy_id ? 'draft' : 'none';
      patch.human_decision = 'not_required';
      patch.employee_resolution = 'not_applicable';
      break;
    case 'PENDING_HUMAN':
      patch.policy_activation = 'none';
      patch.human_decision = 'pending';
      patch.employee_resolution = 'not_applicable';
      break;
  }

  // Avoid unused transcript warning — roles computed at review spawn time.
  void transcript;
  return patch;
}
