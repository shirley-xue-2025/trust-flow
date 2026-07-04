import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Shield, ScrollText } from 'lucide-react';
import { ProductRoleSwitcher } from '@/components/ProductRoleSwitcher';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/governance', end: true, label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
  { to: '/governance/audit', label: 'Audit log', shortLabel: 'Audit', icon: ScrollText },
];

export default function GovernanceLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-foreground">TrustFlow</p>
              <p className="text-xs text-muted-foreground">Governance console</p>
            </div>
          </div>
          <ProductRoleSwitcher />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-foreground">Katrin Müller</p>
            <p className="text-xs text-muted-foreground">Data Protection Officer · NordPay AG</p>
          </div>
        </div>
      </header>

      <div className="container flex gap-8 py-8 pb-24 md:pb-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="space-y-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
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
          <p className="px-3 text-xs text-muted-foreground">
            Oversight for Legal, DPO, IT, and works council — see negotiation outcomes, compiled
            policy, and gateway evidence.
          </p>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background md:hidden">
        {NAV.map(({ to, shortLabel, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
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
