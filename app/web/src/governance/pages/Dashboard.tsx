import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EmployeeRequestRecord } from '@trustflow/shared';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getGovernanceOverview, type GovernanceOverview } from '@/governance/api';
import { StatusBadge } from '@/employee/components/StatusBadge';
import { AuditTrustList } from '@/components/trust/AuditTrustList';

export default function GovernanceDashboard() {
  const [data, setData] = useState<GovernanceOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGovernanceOverview()
      .then(setData)
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Governance overview</h1>
        <p className="text-muted-foreground">
          {data.org.display_name ?? data.org.org_id} · {data.org.entity_country} entity · works
          council {data.org.betriebsvereinbarung_status ?? 'pending'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="In review" value={data.stats.in_review} hint="Boardroom negotiating" />
        <StatCard title="Approved" value={data.stats.approved} hint="Gateway-ready tools" />
        <StatCard title="Blocked / external" value={data.stats.blocked} hint="BR, DPA, or denied" />
        <StatCard title="Policies compiled" value={data.stats.policies_compiled} hint="Signed artifacts" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All access requests</CardTitle>
          <CardDescription>Click a row for negotiation transcript, policy, and audit evidence.</CardDescription>
        </CardHeader>
        <CardContent>
          <RequestTable requests={data.requests} />
        </CardContent>
      </Card>

      <AuditTrustList
        events={data.recent_audit}
        title="Recent gateway activity (org-wide)"
        emptyMessage="No gateway activity recorded yet across the organization."
      />
    </div>
  );
}

function StatCard({ title, value, hint }: { title: string; value: number; hint: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function RequestTable({ requests }: { requests: EmployeeRequestRecord[] }) {
  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No employee requests yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Employee</th>
            <th className="pb-2 pr-4 font-medium">Tool</th>
            <th className="pb-2 pr-4 font-medium">Status</th>
            <th className="pb-2 font-medium">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.request_id} className="border-b last:border-0">
              <td className="py-3 pr-4">
                <Link to={`/governance/requests/${r.request_id}`} className="font-medium hover:underline">
                  {r.actor_name}
                </Link>
                <p className="text-xs text-muted-foreground">{r.department.replace(/_/g, ' ')}</p>
              </td>
              <td className="py-3 pr-4">{r.tool_display_name}</td>
              <td className="py-3 pr-4">
                <StatusBadge status={r.status} />
              </td>
              <td className="py-3 text-muted-foreground">
                {new Date(r.submitted_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
