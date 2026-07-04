import { cn } from '@/lib/utils';

export type GovernanceReviewerRole = 'all' | 'dpo' | 'procurement' | 'it';

const ROLES: { id: GovernanceReviewerRole; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'dpo', label: 'DPO' },
  { id: 'procurement', label: 'Procurement' },
  { id: 'it', label: 'IT' },
];

export function GovernanceRoleSwitcher({
  value,
  onChange,
  className,
}: {
  value: GovernanceReviewerRole;
  onChange: (role: GovernanceReviewerRole) => void;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex flex-wrap gap-1 rounded-lg border bg-muted/50 p-0.5 text-xs font-medium', className)}>
      {ROLES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'rounded-md px-3 py-1.5 transition-colors',
            value === id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
