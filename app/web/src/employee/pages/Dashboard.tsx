import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EmployeeProfile, EmployeeRequestRecord } from '@trustflow/shared';
import { ArrowRight, Bot, Clock, Plus } from 'lucide-react';
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

  const pending = requests.filter((r) => r.status === 'submitted' || r.status === 'negotiating').length;
  const recent = requests.slice(0, 5);

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
            <p className="text-xs text-muted-foreground">Agent boardroom negotiating policy</p>
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
            <CardDescription>Use them through TrustFlow — PII masked, routing enforced, audit logged.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link to="/employee/tools">Open tool workspace →</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
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
                    <StatusBadge status={r.status} />
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
