import type { EmployeeRequestRecord } from '@trustflow/shared';
import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'submitted', label: 'Request submitted' },
  { key: 'negotiating', label: 'Stakeholder review' },
  { key: 'recommendation', label: 'Agent recommendation' },
  { key: 'signoff', label: 'Human sign-off' },
  { key: 'gateway', label: 'Gateway active' },
] as const;

function stepIndex(status: EmployeeRequestRecord['status']): number {
  if (status === 'submitted') return 0;
  if (status === 'negotiating') return 1;
  if (
    status === 'agent_recommended_approve' ||
    status === 'agent_recommended_deny' ||
    status === 'denied_pending_employee' ||
    status === 'pending_external' ||
    status === 'pending_human' ||
    status === 'appeal_pending' ||
    status === 'denied'
  ) {
    return 2;
  }
  if (status === 'pending_signoff') return 3;
  if (status === 'approved') return 4;
  if (status === 'denied_closed') return 2;
  return 1;
}

export function RequestTimeline({ record }: { record: EmployeeRequestRecord }) {
  const active = stepIndex(record.status);
  const failed =
    record.status === 'denied_closed' ||
    record.status === 'denied_pending_employee' ||
    record.status === 'agent_recommended_deny' ||
    record.status === 'denied';

  return (
    <ol className="space-y-4">
      {STEPS.map((step, i) => {
        const done = i < active || (i === 4 && record.status === 'approved');
        const current = i === active;
        const stepFailed = failed && i === 2;

        return (
          <li key={step.key} className="flex gap-3">
            <div
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                done && !stepFailed && 'border-emerald-500 bg-emerald-50 text-emerald-600',
                current && !stepFailed && 'border-primary bg-primary/10 text-primary',
                stepFailed && 'border-destructive bg-destructive/10 text-destructive',
                !done && !current && 'border-muted bg-muted/30 text-muted-foreground',
              )}
            >
              {done && !stepFailed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : stepFailed ? (
                <XCircle className="h-4 w-4" />
              ) : current ? (
                <Clock className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className={cn('font-medium', current && 'text-primary')}>{step.label}</p>
              {current && record.status === 'negotiating' && (
                <p className="text-sm text-muted-foreground">
                  Stakeholders negotiating…
                  {record.transcript_length ? ` (${record.transcript_length} turns)` : ''}
                </p>
              )}
              {current && record.status === 'pending_signoff' && (
                <p className="text-sm text-muted-foreground">Waiting for DPO / IT parallel reviews</p>
              )}
              {i === 2 && record.outcome && (
                <p className="text-sm text-muted-foreground">Outcome: {record.outcome}</p>
              )}
              {i === 4 && record.status === 'approved' && record.policy_id && (
                <p className="text-sm text-muted-foreground">Policy {record.policy_id} active at gateway</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
