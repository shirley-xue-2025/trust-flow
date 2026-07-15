import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EmployeeProfile, EmployeeRequestRecord } from '@trustflow/shared';
import { ArrowRight, Bot, Clock, Plus, Users, UserCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getApprovedTools, listEmployeeRequests } from '@/employee/api';
import { StatusBadge } from '@/employee/components/StatusBadge';

export default function EmployeeDashboard({ profile }: { profile: EmployeeProfile }) {
  const [requests, setRequests] = useState<EmployeeRequestRecord[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);

  useEffect(() => {
    listEmployeeRequests(profile.user_id).then(setRequests).catch(() => setRequests([]));
    getApprovedTools(profile.user_id)
      .then((t) => setApprovedCount(t.length))
      .catch(() => setApprovedCount(0));
  }, [profile.user_id]);

  const pending = requests.filter(
    (r) => r.status === 'submitted' || r.status === 'negotiating' || r.status === 'pending_signoff',
  ).length;
  const recent = requests.slice(0, 5);

  const demoLinks = [
    { id: 'demo-s04-pending-signoff', label: 'Claude Code — pending sign-off' },
    { id: 'demo-s05-denied', label: 'ChatGPT — denied (appeal demo)' },
    { id: 'demo-s02-external', label: 'Claude Code — works council gate pending' },
  ];

  const tourSteps = [
    {
      step: 1,
      title: 'Watch agents negotiate',
      description: 'Stakeholder agents in the boardroom — full trace on your request, or live replay in glassbox.',
      icon: Users,
      to: '/employee/requests/demo-s04-pending-signoff',
    },
    {
      step: 2,
      title: 'Human sign-off',
      description: 'DPO and IT approve before any tool goes live.',
      icon: UserCheck,
      to: '/governance/queues?queue=signoff&role=dpo',
    },
    {
      step: 3,
      title: 'Gateway audit',
      description: 'After sign-off, see PII masked and disclosure banners in gateway activity. Live tests in glassbox.',
      icon: ShieldCheck,
      to: '/employee/requests/demo-s04-pending-signoff?tab=activity',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome, {profile.display_name.split(' ')[0]}</h1>
          <p className="text-muted-foreground">
            Request AI tools through official channels — governed by policy, not shadow IT.
          </p>
        </div>
        <Button asChild>
          <Link to="/employee/requests/new">
            <Plus className="h-4 w-4" />
            Request a tool
          </Link>
        </Button>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Hackathon demo tour</CardTitle>
          <CardDescription>
            Agent boardroom negotiates → Compiler signs → Humans approve → Gateway enforces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {tourSteps.map(({ step, title, description, icon: Icon, to }) => (
              <Link
                key={step}
                to={to}
                className="group flex flex-col rounded-lg border p-4 transition-colors hover:border-primary/40 hover:bg-muted/50"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {step}
                  </span>
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <p className="font-medium text-foreground">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved tools</CardDescription>
            <CardTitle className="text-3xl">{approvedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Ready to use via the governed gateway</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In review</CardDescription>
            <CardTitle className="text-3xl">{pending}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Stakeholder review or pending sign-off</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total requests</CardDescription>
            <CardTitle className="text-3xl">{requests.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Your submission history</p>
          </CardContent>
        </Card>
      </div>

      {approvedCount > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-primary" />
              You have approved tools
            </CardTitle>
            <CardDescription>
              Use approved tools in your IDE — TrustFlow records gateway enforcement and audit here,
              not an in-app chat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link to="/employee/requests/demo-s04-pending-signoff?tab=activity">
                View gateway activity →
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demo scenarios (pre-seeded)</CardTitle>
          <CardDescription>
            Cold-start requests with full negotiation transcripts — reset via{' '}
            <code className="text-xs">POST /v1/demo/reseed</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {demoLinks.map((d) => (
            <Button key={d.id} variant="outline" size="sm" asChild>
              <Link to={`/employee/requests/${d.id}`}>{d.label}</Link>
            </Button>
          ))}
          <Button variant="secondary" size="sm" asChild>
            <Link to="/glassbox">Glassbox — live boardroom replay →</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Recent requests</CardTitle>
            <CardDescription>Track approval status and next steps</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/employee/requests">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No requests yet. Submit your first tool access request.</p>
              <Button asChild size="sm">
                <Link to="/employee/requests/new">Get started</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {recent.map((r) => (
                <li key={r.request_id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.tool_display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.use_case_category.replace(/_/g, ' ')} ·{' '}
                      {new Date(r.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} denyCode={r.deny_code} />
                    <Button variant="ghost" size="icon" asChild>
                      <Link to={`/employee/requests/${r.request_id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
