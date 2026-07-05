/**
 * Governance queue builders and human-review actions.
 */
import { randomUUID } from 'node:crypto';
import { sha256 } from '@trustflow/shared';
import type {
  AppealRecord,
  EmployeeRequestRecord,
  HumanReviewRecord,
  OrgConfig,
  ReviewerRole,
} from '@trustflow/shared';
import { emitAuditEvent } from '../gateway/audit.js';
import { activationState, deriveDisplayStatus, externalGatesClear, syncRecord } from '../employee/requestState.js';
import {
  getEmployeeRequest,
  isApprovedForGateway,
  listEmployeeRequests,
  nextStepsForRecord,
  serializeEmployeeRequest,
  updateEmployeeRequest,
} from '../employee/requests.js';
import {
  decideHumanReview,
  getHumanReview,
  listHumanReviews,
  reviewsSummary,
  spawnHumanReviews,
} from '../store/humanReviews.js';
import { getPendingAppealForRequest, listAppeals, decideAppeal, getAppeal } from '../store/appeals.js';
import { activatePolicy, listPolicies, resolveStoredPolicy } from '../store/index.js';
import { runEmployeeBoardroom } from '../employee/runBoardroom.js';
import { runInference } from '../gateway/enforce.js';
import { REGISTRY } from '../fixtures/index.js';
import type { ToolRegistry } from '@trustflow/shared';

export type GovernanceQueue =
  | 'all'
  | 'signoff'
  | 'appeals'
  | 'external'
  | 'in_review'
  | 'negotiating';

export interface QueueItem {
  kind: 'signoff' | 'appeal' | 'external' | 'in_review';
  request_id: string;
  display_status: EmployeeRequestRecord['display_status'];
  actor_name: string;
  tool_display_name: string;
  department: string;
  agent_outcome?: EmployeeRequestRecord['agent_outcome'];
  policy_id?: string;
  policy_activation: EmployeeRequestRecord['policy_activation'];
  submitted_at: string;
  pending_review?: HumanReviewRecord;
  reviews_summary: Partial<Record<ReviewerRole, HumanReviewRecord['status']>>;
  external_gates: {
    betriebsvereinbarung_status?: string;
    vendor_dpa_status?: string;
    blocking: boolean;
  };
  appeal?: AppealRecord;
}

function matchesRoleFilter(
  record: EmployeeRequestRecord,
  reviews: HumanReviewRecord[],
  role: ReviewerRole | 'all',
): boolean {
  if (role === 'all') return true;
  return reviews.some((r) => r.reviewer_role === role && r.status === 'pending');
}

function buildQueueItem(
  record: EmployeeRequestRecord,
  kind: QueueItem['kind'],
  org: OrgConfig,
  reviews: HumanReviewRecord[],
  appeal?: AppealRecord | null,
): QueueItem {
  const display = deriveDisplayStatus(record);
  const pending = reviews.find((r) => r.status === 'pending');
  return {
    kind,
    request_id: record.request_id,
    display_status: display,
    actor_name: record.actor_name,
    tool_display_name: record.tool_display_name,
    department: record.department,
    agent_outcome: record.agent_outcome,
    policy_id: record.policy_id,
    policy_activation: record.policy_activation,
    submitted_at: record.submitted_at,
    pending_review: pending,
    reviews_summary: reviewsSummary(reviews),
    external_gates: {
      betriebsvereinbarung_status: record.packet.betriebsvereinbarung_status ?? org.betriebsvereinbarung_status,
      vendor_dpa_status: record.packet.vendor_dpa_status,
      blocking: !externalGatesClear(record.packet, org),
    },
    appeal: appeal ?? undefined,
  };
}

export function buildGovernanceQueue(
  org: OrgConfig,
  opts: {
    queue?: GovernanceQueue;
    role?: ReviewerRole | 'all';
    limit?: number;
    offset?: number;
  } = {},
): { queue: GovernanceQueue; role: ReviewerRole | 'all'; total: number; items: QueueItem[] } {
  const queue = opts.queue ?? 'all';
  const role = opts.role ?? 'all';
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  const items: QueueItem[] = [];

  for (const record of listEmployeeRequests()) {
    const display = deriveDisplayStatus(record);
    const reviews = listHumanReviews(record.request_id);
    const appeal = getPendingAppealForRequest(record.request_id);

    const candidates: QueueItem['kind'][] = [];
    if (display === 'pending_signoff' || display === 'agent_recommended_approve') {
      candidates.push('signoff');
    }
    if (display === 'appeal_pending') candidates.push('appeal');
    if (display === 'pending_external') candidates.push('external');
    if (display === 'negotiating' || display === 'submitted' || display === 'pending_human') {
      candidates.push('in_review');
    }

    for (const kind of candidates) {
      if (queue !== 'all' && queue !== kind && !(queue === 'in_review' && kind === 'in_review') && !(queue === 'negotiating' && kind === 'in_review')) {
        continue;
      }
      if (queue === 'negotiating' && display !== 'negotiating' && display !== 'submitted') continue;
      if (!matchesRoleFilter(record, reviews, role)) continue;
      items.push(buildQueueItem(record, kind, org, reviews, appeal));
    }
  }

  const total = items.length;
  return { queue, role, total, items: items.slice(offset, offset + limit) };
}

export function governanceOverviewStats(org: OrgConfig) {
  const requests = listEmployeeRequests();
  const policies = listPolicies();
  const activePolicies = policies.filter((p) => p.activation_status === 'active').length;

  const byDisplay = (s: EmployeeRequestRecord['status']) =>
    requests.filter((r) => deriveDisplayStatus(r) === s).length;

  return {
    total_requests: requests.length,
    in_review: byDisplay('negotiating') + byDisplay('submitted') + byDisplay('pending_human'),
    pending_signoff: byDisplay('pending_signoff') + byDisplay('agent_recommended_approve'),
    appeals_pending: byDisplay('appeal_pending'),
    pending_external: byDisplay('pending_external'),
    approved: byDisplay('approved'),
    denied_closed: byDisplay('denied_closed') + byDisplay('denied'),
    blocked:
      byDisplay('denied_pending_employee') +
      byDisplay('denied_closed') +
      byDisplay('pending_external'),
    policies_compiled: policies.length,
    policies_active: activePolicies,
  };
}

function finalizeRequestActivation(
  requestId: string,
  record: EmployeeRequestRecord,
  reviewerIds: string[],
  reviewerIdForAudit: string,
  org: OrgConfig,
): EmployeeRequestRecord {
  if (!record.policy_id) return serializeEmployeeRequest(record);

  activatePolicy(record.policy_id, reviewerIds, record.policy_version_hash);

  const stored = resolveStoredPolicy(record.policy_id, record.policy_version_hash);
  if (stored?.policy) {
    runInference(
      {
        policy: stored.policy,
        policy_version_hash: stored.policy_version_hash,
        request: record.packet,
        prompt: 'Email the receipt to katrin.brenner@nordpay.example for review.',
        actor_id: record.actor_id,
      },
      { org, registry: REGISTRY },
      { activation_status: 'active' },
    );
  }

  const activated = syncRecord({
    ...getEmployeeRequest(requestId)!,
    human_decision: 'complete',
    policy_activation: 'active',
  });
  updateEmployeeRequest(requestId, {
    human_decision: 'complete',
    policy_activation: 'active',
    status: activated.status,
    display_status: activated.display_status,
    next_steps: nextStepsForRecord(activated, REGISTRY),
  });

  emitAuditEvent({
    event_id: randomUUID(),
    event_type: 'policy_activated',
    policy_id: record.policy_id,
    policy_version_hash: record.policy_version_hash ?? 'none',
    actor_id: record.actor_id,
    tool_id: record.tool_id,
    model_provider: 'none',
    model_id: 'none',
    routing_decision: 'BLOCKED',
    outcome: 'allowed',
    human_reviewer_id: reviewerIdForAudit,
  });

  return serializeEmployeeRequest(getEmployeeRequest(requestId)!);
}

export function decideReviewForRequest(
  requestId: string,
  reviewId: string,
  decision: 'approve' | 'reject',
  rationale: string,
  reviewerId: string,
  org: OrgConfig,
): {
  record: EmployeeRequestRecord;
  human_reviews: HumanReviewRecord[];
  activation: ReturnType<typeof activationState>;
  audit_event_id: string;
} | { error: string; code: number } {
  if (rationale.trim().length < 20) {
    return { error: 'rationale must be at least 20 characters', code: 400 };
  }

  const record = getEmployeeRequest(requestId);
  if (!record) return { error: 'request not found', code: 404 };

  const review = getHumanReview(reviewId);
  if (!review || review.request_id !== requestId) return { error: 'review not found', code: 404 };
  if (review.status !== 'pending') return { error: 'review already decided', code: 409 };

  const rationaleHash = sha256(rationale.trim());
  decideHumanReview(reviewId, decision === 'approve' ? 'approve' : 'reject', rationale.trim(), rationaleHash);

  const human_reviews = listHumanReviews(requestId);
  let patch: Partial<EmployeeRequestRecord> = {};

  if (decision === 'reject') {
    patch = {
      human_decision: 'rejected',
      employee_resolution: 'pending',
      policy_activation: 'none',
    };
  } else {
    const activation = activationState(record, human_reviews, org);
    if (activation.can_activate && record.policy_id) {
      patch = {
        human_decision: 'complete',
        policy_activation: 'active',
      };
    } else {
      patch = { human_decision: 'pending' };
    }
  }

  const updated = updateEmployeeRequest(requestId, patch);
  if (!updated) return { error: 'update failed', code: 500 };

  if (patch.policy_activation === 'active' && record.policy_id) {
    finalizeRequestActivation(
      requestId,
      getEmployeeRequest(requestId)!,
      human_reviews.filter((r) => r.status === 'approved').map((r) => r.reviewer_id),
      reviewerId,
      org,
    );
  }

  const audit = emitAuditEvent({
    event_type: 'human_sign_off',
    policy_id: record.policy_id ?? 'none',
    policy_version_hash: record.policy_version_hash ?? 'none',
    actor_id: record.actor_id,
    tool_id: record.tool_id,
    model_provider: 'none',
    model_id: 'none',
    routing_decision: 'BLOCKED',
    outcome: decision === 'approve' ? 'allowed' : 'denied',
    human_reviewer_id: reviewerId,
    human_override: {
      reviewer_id: reviewerId,
      timestamp: new Date().toISOString(),
      action: decision === 'approve' ? 'approved' : 'rejected',
    },
  });

  const finalRecord = serializeEmployeeRequest(getEmployeeRequest(requestId)!);
  return {
    record: finalRecord,
    human_reviews: listHumanReviews(requestId),
    activation: activationState(finalRecord, listHumanReviews(requestId), org),
    audit_event_id: audit.event_id,
  };
}

export function activateRequestPolicy(
  requestId: string,
  reviewerId: string,
  org: OrgConfig,
): { record: EmployeeRequestRecord } | { error: string; code: number } {
  const record = getEmployeeRequest(requestId);
  if (!record) return { error: 'request not found', code: 404 };

  if (isApprovedForGateway(record)) {
    const activated = syncRecord(record);
    const steps = nextStepsForRecord(activated, REGISTRY);
    if (JSON.stringify(record.next_steps) !== JSON.stringify(steps)) {
      updateEmployeeRequest(requestId, {
        next_steps: steps,
        status: activated.status,
        display_status: activated.display_status,
      });
      return { record: serializeEmployeeRequest(getEmployeeRequest(requestId)!) };
    }
    return { record: serializeEmployeeRequest(record) };
  }

  const reviews = listHumanReviews(requestId);
  const activation = activationState(record, reviews, org);
  if (!activation.can_activate || !record.policy_id) {
    return { error: 'activation blocked', code: 409 };
  }

  const finalRecord = finalizeRequestActivation(
    requestId,
    record,
    reviews.filter((r) => r.status === 'approved').map((r) => r.reviewer_id),
    reviewerId,
    org,
  );

  return { record: finalRecord };
}

export function governanceRequestDetail(requestId: string, org: OrgConfig) {
  const record = getEmployeeRequest(requestId);
  if (!record) return null;
  const human_reviews = listHumanReviews(requestId);
  const appeal = getPendingAppealForRequest(requestId);
  const policy = record.policy_id
    ? resolveStoredPolicy(record.policy_id, record.policy_version_hash)
    : null;
  return {
    record: serializeEmployeeRequest(record),
    human_reviews,
    appeal,
    activation: activationState(record, human_reviews, org),
    policy,
  };
}

export function listAllAppeals(): AppealRecord[] {
  return listAppeals();
}

export function ensureReviewsForRequest(requestId: string, transcript = [] as import('@trustflow/shared').BoardroomEnvelope[]) {
  const record = getEmployeeRequest(requestId);
  if (!record) return [];
  if (listHumanReviews(requestId).length) return listHumanReviews(requestId);
  return spawnHumanReviews(requestId, record.packet, transcript);
}

export async function decideAppealForRequest(
  appealId: string,
  decision: 'grant' | 'deny',
  rationale: string,
  reviewerId: string,
  org: OrgConfig,
  registry: ToolRegistry,
  registryPatch?: { betriebsvereinbarung_status?: 'signed' | 'pending' },
): Promise<
  | { record: EmployeeRequestRecord; appeal: AppealRecord; next_step: string }
  | { error: string; code: number }
> {
  if (rationale.trim().length < 20) {
    return { error: 'rationale must be at least 20 characters', code: 400 };
  }

  const appeal = getAppeal(appealId);
  if (!appeal) return { error: 'appeal not found', code: 404 };
  if (appeal.status !== 'pending') return { error: 'appeal already decided', code: 409 };

  const record = getEmployeeRequest(appeal.request_id);
  if (!record) return { error: 'request not found', code: 404 };

  if (decision === 'deny') {
    decideAppeal(appealId, 'deny', rationale.trim());
    const updated = updateEmployeeRequest(appeal.request_id, {
      employee_resolution: 'accepted',
      human_decision: 'rejected',
    });
    emitAuditEvent({
      event_type: 'appeal_decision',
      policy_id: record.policy_id ?? 'none',
      policy_version_hash: record.policy_version_hash ?? 'none',
      actor_id: record.actor_id,
      tool_id: record.tool_id,
      model_provider: 'none',
      model_id: 'none',
      routing_decision: 'BLOCKED',
      outcome: 'denied',
      human_reviewer_id: reviewerId,
    });
    return {
      record: serializeEmployeeRequest(updated!),
      appeal: getAppeal(appealId)!,
      next_step: 'denied_closed',
    };
  }

  let grantRouting: AppealRecord['grant_routing'] = 'human_reviews';
  let nextStep = 'human_reviews';

  if (appeal.appeal_type === 'procedural') {
    const packet = { ...record.packet };
    if (registryPatch?.betriebsvereinbarung_status) {
      packet.betriebsvereinbarung_status = registryPatch.betriebsvereinbarung_status;
    } else if (appeal.appeal_type === 'procedural') {
      packet.betriebsvereinbarung_status = 'signed';
    }
    updateEmployeeRequest(appeal.request_id, {
      packet,
      employee_resolution: 'not_applicable',
      human_decision: 'pending',
    });
    const refreshed = getEmployeeRequest(appeal.request_id)!;
    spawnHumanReviews(appeal.request_id, refreshed.packet, refreshed.transcript_snapshot ?? []);
    grantRouting = 'human_reviews';
    nextStep = 'human_reviews';
  } else if (appeal.appeal_type === 'factual' || appeal.appeal_type === 'alternative_scope') {
    grantRouting = 'reopen_boardroom';
    nextStep = 'boardroom_round';
    const replay = appeal.appeal_type === 'factual' ? 'S01' : 'S04';
    decideAppeal(appealId, 'grant', rationale.trim(), grantRouting);
    await runEmployeeBoardroom(appeal.request_id, org, registry, { replayScenarioId: replay });
    const updated = getEmployeeRequest(appeal.request_id)!;
    emitAuditEvent({
      event_type: 'appeal_decision',
      policy_id: updated.policy_id ?? 'none',
      policy_version_hash: updated.policy_version_hash ?? 'none',
      actor_id: updated.actor_id,
      tool_id: updated.tool_id,
      model_provider: 'none',
      model_id: 'none',
      routing_decision: 'BLOCKED',
      outcome: 'allowed',
      human_reviewer_id: reviewerId,
    });
    return {
      record: serializeEmployeeRequest(updated),
      appeal: getAppeal(appealId)!,
      next_step: nextStep,
    };
  }

  decideAppeal(appealId, 'grant', rationale.trim(), grantRouting);
  emitAuditEvent({
    event_type: 'appeal_decision',
    policy_id: record.policy_id ?? 'none',
    policy_version_hash: record.policy_version_hash ?? 'none',
    actor_id: record.actor_id,
    tool_id: record.tool_id,
    model_provider: 'none',
    model_id: 'none',
    routing_decision: 'BLOCKED',
    outcome: 'allowed',
    human_reviewer_id: reviewerId,
  });

  return {
    record: serializeEmployeeRequest(getEmployeeRequest(appeal.request_id)!),
    appeal: getAppeal(appealId)!,
    next_step: nextStep,
  };
}
