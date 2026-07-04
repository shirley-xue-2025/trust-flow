import type { EmployeeRequestStatus } from '@trustflow/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  pending_external: 'Pending external',
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
  className,
}: {
  status: EmployeeRequestStatus;
  className?: string;
}) {
  return (
    <Badge variant={VARIANTS[status] ?? 'secondary'} className={cn(className)}>
      {LABELS[status] ?? status}
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
