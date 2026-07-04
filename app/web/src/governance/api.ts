import type {
  BoardroomEnvelope,
  EmployeeRequestRecord,
  GatewayAuditEvent,
  OrgConfig,
  PolicyArtifact,
} from '@trustflow/shared';

const GOV = '/v1/governance';
const BASE = '/v1';

export interface GovernanceOverview {
  org: OrgConfig;
  stats: {
    total_requests: number;
    in_review: number;
    pending_signoff?: number;
    appeals_pending?: number;
    pending_external?: number;
    approved: number;
    denied_closed?: number;
    blocked: number;
    policies_compiled: number;
    policies_active?: number;
    audit_events: number;
  };
  requests: EmployeeRequestRecord[];
  recent_audit: GatewayAuditEvent[];
}

export interface BoardroomSnapshot {
  session_id: string;
  state: string;
  outcome: string | null;
  deny_code: string | null;
  routing_decision: string | null;
  policy_id: string | null;
  policy_version_hash: string | null;
  transcript: BoardroomEnvelope[];
  policy: PolicyArtifact | null;
}

export interface GovernanceRequestDetail {
  record: EmployeeRequestRecord;
  human_reviews?: import('@trustflow/shared').HumanReviewRecord[];
  appeal?: import('@trustflow/shared').AppealRecord | null;
  activation?: { can_activate: boolean; blocking_reasons: string[] };
  session: { session_id: string; state: string; outcome: string | null; transcript: BoardroomEnvelope[] } | null;
  policy: { policy: PolicyArtifact; policy_version_hash: string; activation_status?: string } | null;
  audit: GatewayAuditEvent[];
}

export interface GovernanceQueueItem {
  kind: 'signoff' | 'appeal' | 'external' | 'in_review';
  request_id: string;
  display_status?: string;
  actor_name: string;
  tool_display_name: string;
  department: string;
  policy_activation: string;
  submitted_at: string;
  reviews_summary: Record<string, string>;
}

export async function getGovernanceQueues(params?: {
  queue?: string;
  role?: string;
}): Promise<{ queue: string; role: string; total: number; items: GovernanceQueueItem[] }> {
  const qs = new URLSearchParams();
  if (params?.queue) qs.set('queue', params.queue);
  if (params?.role) qs.set('role', params.role);
  const suffix = qs.toString() ? `?${qs}` : '';
  return (await fetch(`${GOV}/queues${suffix}`)).json();
}

export async function decideHumanReview(
  requestId: string,
  reviewId: string,
  body: { decision: 'approve' | 'reject'; rationale: string },
  reviewerRole?: string,
): Promise<unknown> {
  const res = await fetch(`${GOV}/requests/${requestId}/reviews/${reviewId}/decide`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Reviewer-Id': 'katrin.mueller@nordpay.example',
      'X-Reviewer-Role': reviewerRole ?? 'dpo',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'decide failed');
  return res.json();
}

export async function getGovernanceOverview(): Promise<GovernanceOverview> {
  return (await fetch(`${GOV}/overview`)).json();
}

export async function getGovernanceRequest(id: string): Promise<GovernanceRequestDetail> {
  const res = await fetch(`${GOV}/requests/${id}`);
  if (!res.ok) throw new Error((await res.json()).error ?? 'not found');
  return res.json();
}

export async function getBoardroomSession(sessionId: string): Promise<BoardroomSnapshot> {
  const res = await fetch(`${BASE}/boardroom/${sessionId}`);
  if (!res.ok) throw new Error((await res.json()).error ?? 'session not found');
  return res.json();
}

export async function getPolicy(policyId: string): Promise<{ policy: PolicyArtifact; policy_version_hash: string }> {
  const res = await fetch(`${BASE}/policy/${policyId}`);
  if (!res.ok) throw new Error('policy not found');
  return res.json();
}

export async function getAuditForRequest(policyId?: string, limit = 50): Promise<GatewayAuditEvent[]> {
  const events: GatewayAuditEvent[] = (await fetch(`${BASE}/audit?limit=${limit}`).then((r) => r.json())).events;
  if (!policyId) return events;
  return events.filter((e) => e.policy_id === policyId);
}
