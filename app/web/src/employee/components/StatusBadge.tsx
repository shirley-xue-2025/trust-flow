import type { EmployeeRequestStatus } from '@trustflow/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const LABELS: Record<EmployeeRequestStatus, string> = {
  submitted: 'Submitted',
  negotiating: 'In review',
  approved: 'Approved',
  denied: 'Denied',
  pending_external: 'Pending external',
  pending_human: 'Needs DPO review',
};

const VARIANTS: Record<EmployeeRequestStatus, 'default' | 'secondary' | 'destructive' | 'success' | 'warning'> = {
  submitted: 'secondary',
  negotiating: 'default',
  approved: 'success',
  denied: 'destructive',
  pending_external: 'warning',
  pending_human: 'warning',
};

export function StatusBadge({
  status,
  className,
}: {
  status: EmployeeRequestStatus;
  className?: string;
}) {
  return (
    <Badge variant={VARIANTS[status]} className={cn(className)}>
      {LABELS[status]}
    </Badge>
  );
}

export function isTerminalStatus(status: EmployeeRequestStatus): boolean {
  return status !== 'submitted' && status !== 'negotiating';
}
