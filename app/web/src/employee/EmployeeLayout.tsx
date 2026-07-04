import { NavLink, Outlet } from 'react-router-dom';
import type { EmployeeProfile } from '@trustflow/shared';
import { LayoutDashboard, MessageSquarePlus, ClipboardList, Shield } from 'lucide-react';
import { ProductRoleSwitcher } from '@/components/ProductRoleSwitcher';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const NAV = [
  { to: '/employee', end: true, label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { to: '/employee/requests/new', label: 'New request', shortLabel: 'New', icon: MessageSquarePlus },
  { to: '/employee/requests', end: true, label: 'My requests', shortLabel: 'Requests', icon: ClipboardList },
];

export default function EmployeeLayout({ profile }: { profile: EmployeeProfile }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-none text-foreground">TrustFlow</p>
              <p className="hidden text-xs text-muted-foreground sm:block">Employee portal</p>
            </div>
          </div>
          <div className="shrink-0">
          <ProductRoleSwitcher />
          </div>
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium">{profile.display_name}</p>
            <p className="text-xs text-muted-foreground">
              {profile.role.replace(/_/g, ' ')} · {profile.department.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </header>

      <div className="container flex gap-8 py-8 pb-32 md:pb-8">
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
            Switch to <strong>Governance</strong> to see DPO / Legal oversight of the same requests.
          </p>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet context={{ profile }} />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background md:hidden">
        {NAV.map(({ to, label, shortLabel, icon: Icon, end }) => (
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
