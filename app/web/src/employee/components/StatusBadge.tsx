import type { EmployeeRequestStatus } from '@trustflow/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DENY_LABELS } from '@/lib/agentLabels';

const LABELS: Record<EmployeeRequestStatus, string> = {
  submitted: 'Submitted',
  negotiating: 'Stakeholder review',
  agent_recommended_approve: 'Recommended approve',
  pending_signoff: 'Pending sign-off',
  approved: 'Approved',
  agent_recommended_deny: 'Recommended deny',
  denied_pending_employee: 'Action required',
  appeal_pending: 'Appeal pending',
  denied_closed: 'Closed',
  pending_external: 'Pending external gate',
  pending_human: 'Needs DPO review',
  denied: 'Denied',
};

const VARIANTS: Record<
  EmployeeRequestStatus,
  'default' | 'secondary' | 'destructive' | 'success' | 'warning'
> = {
  submitted: 'secondary',
  negotiating: 'default',
  agent_recommended_approve: 'warning',
  pending_signoff: 'warning',
  approved: 'success',
  agent_recommended_deny: 'destructive',
  denied_pending_employee: 'warning',
  appeal_pending: 'warning',
  denied_closed: 'destructive',
  pending_external: 'warning',
  pending_human: 'warning',
  denied: 'destructive',
};

export function StatusBadge({
  status,
  denyCode,
  className,
}: {
  status: EmployeeRequestStatus;
  /** Plain-English gate when status is pending_external */
  denyCode?: string;
  className?: string;
}) {
  let label = LABELS[status] ?? status;
  if (status === 'pending_external' && denyCode && DENY_LABELS[denyCode]) {
    label = `Pending — ${DENY_LABELS[denyCode]}`;
  } else if (status === 'denied' && denyCode && DENY_LABELS[denyCode]) {
    label = `Denied — ${DENY_LABELS[denyCode]}`;
  }

  return (
    <Badge variant={VARIANTS[status] ?? 'secondary'} className={cn(className)}>
      {label}
    </Badge>
  );
}

export function isTerminalStatus(status: EmployeeRequestStatus): boolean {
  return (
    status !== 'submitted' &&
    status !== 'negotiating' &&
    status !== 'pending_signoff' &&
    status !== 'agent_recommended_approve' &&
    status !== 'denied_pending_employee' &&
    status !== 'appeal_pending'
  );
}

/** Poll only while negotiation or sign-off may still change. */
export function shouldPollRequest(status: EmployeeRequestStatus): boolean {
  return status === 'submitted' || status === 'negotiating' || status === 'pending_signoff';
}
