import type { EmployeeRequestRecord } from '@trustflow/shared';
import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'submitted', label: 'Request submitted' },
  { key: 'negotiating', label: 'Agent boardroom review' },
  { key: 'decision', label: 'Decision & policy compile' },
  { key: 'gateway', label: 'Gateway enforcement ready' },
] as const;

function stepIndex(status: EmployeeRequestRecord['status']): number {
  if (status === 'submitted') return 0;
  if (status === 'negotiating') return 1;
  if (status === 'approved') return 3;
  return 2;
}

export function RequestTimeline({ record }: { record: EmployeeRequestRecord }) {
  const active = stepIndex(record.status);

  return (
    <ol className="space-y-4">
      {STEPS.map((step, i) => {
        const done = i < active || (i === 3 && record.status === 'approved');
        const current = i === active;
        const failed = i >= 2 && (record.status === 'denied' || record.status === 'pending_external' || record.status === 'pending_human');

        return (
          <li key={step.key} className="flex gap-3">
            <div
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                done && !failed && 'border-emerald-500 bg-emerald-50 text-emerald-600',
                current && 'border-primary bg-primary/10 text-primary',
                failed && i === 2 && 'border-amber-500 bg-amber-50 text-amber-600',
                !done && !current && 'border-muted bg-muted/30 text-muted-foreground',
              )}
            >
              {done && !failed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : failed && i === 2 ? (
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
                  Legal, Procurement, IT, and Works Council agents are negotiating…
                  {record.transcript_length ? ` (${record.transcript_length} turns)` : ''}
                </p>
              )}
              {i === 2 && record.outcome && (
                <p className="text-sm text-muted-foreground">Outcome: {record.outcome}</p>
              )}
              {i === 3 && record.status === 'approved' && record.policy_id && (
                <p className="text-sm text-muted-foreground">Policy {record.policy_id} active at gateway</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
