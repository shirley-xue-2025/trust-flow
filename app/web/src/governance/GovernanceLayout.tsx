import { NavLink, Outlet } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, Shield, ScrollText } from 'lucide-react';
import { ArchitectureStrip } from '@/components/ArchitectureStrip';
import { ProductRoleSwitcher } from '@/components/ProductRoleSwitcher';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { GovernanceRoleSwitcher } from '@/governance/GovernanceRoleSwitcher';
import { GOVERNANCE_PERSONAS } from '@/governance/governancePersonas';
import { governanceLink, useGovernanceRole } from '@/governance/useGovernanceRole';

const NAV = [
  { to: '/governance', end: true, label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
  { to: '/governance/queues', label: 'Queues', shortLabel: 'Queues', icon: ClipboardList },
  { to: '/governance/audit', label: 'Audit log', shortLabel: 'Audit', icon: ScrollText },
];

export default function GovernanceLayout() {
  const { role, setRole } = useGovernanceRole();
  const persona = GOVERNANCE_PERSONAS[role];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-none text-foreground">TrustFlow</p>
              <p className="hidden text-xs text-muted-foreground sm:block">Governance console</p>
            </div>
          </div>
          <div className="shrink-0">
            <ProductRoleSwitcher />
          </div>
        </div>

        <div className="container flex flex-col gap-2 border-t bg-muted/25 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">Viewing as</span>
            <GovernanceRoleSwitcher value={role} onChange={setRole} className="max-w-full" />
          </div>
          <div className="min-w-0 text-left sm:text-right">
            <p className="truncate text-sm font-medium text-foreground">{persona.name}</p>
            <p className="truncate text-xs text-muted-foreground">{persona.title}</p>
          </div>
        </div>
      </header>

      <ArchitectureStrip />

      <div className="container flex gap-8 py-8 pb-32 md:pb-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="space-y-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={governanceLink(to, role)}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <Separator className="my-6" />
          <p className="px-3 text-xs text-muted-foreground">{persona.hint}</p>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet context={{ role }} />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background md:hidden">
        {NAV.map(({ to, shortLabel, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={governanceLink(to, role)}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <Icon className="h-5 w-5" />
            {shortLabel}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
