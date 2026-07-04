import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const ROLES = [
  { to: '/employee', label: 'Employee' },
  { to: '/governance', label: 'Governance' },
] as const;

export function ProductRoleSwitcher({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="hidden text-xs text-muted-foreground sm:inline">Viewing as</span>
      <div className="inline-flex rounded-lg border bg-muted/50 p-0.5 text-xs font-medium">
      {ROLES.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'rounded-md px-3 py-1.5 transition-colors',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          {label}
        </NavLink>
      ))}
      </div>
    </div>
  );
}
