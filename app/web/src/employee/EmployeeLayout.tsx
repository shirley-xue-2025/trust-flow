import { Link, NavLink, Outlet } from 'react-router-dom';
import type { EmployeeProfile } from '@trustflow/shared';
import { LayoutDashboard, MessageSquarePlus, ClipboardList, Shield, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const NAV = [
  { to: '/employee', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employee/requests/new', label: 'New request', icon: MessageSquarePlus },
  { to: '/employee/requests', end: true, label: 'My requests', icon: ClipboardList },
];

export default function EmployeeLayout({ profile }: { profile: EmployeeProfile }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">TrustFlow</p>
              <p className="text-xs text-muted-foreground">Employee portal</p>
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{profile.display_name}</p>
            <p className="text-xs text-muted-foreground">
              {profile.role.replace(/_/g, ' ')} · {profile.department.replace(/_/g, ' ')}
            </p>
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
          <Link
            to="/demo"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Demo console (judges)
          </Link>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet context={{ profile }} />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background md:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
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
            {label.split(' ').pop()}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
