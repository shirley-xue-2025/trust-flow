import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EmployeeProfile, EmployeeRequestRecord } from '@trustflow/shared';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listEmployeeRequests } from '@/employee/api';
import { StatusBadge } from '@/employee/components/StatusBadge';

export default function RequestsListPage({ profile }: { profile: EmployeeProfile }) {
  const [requests, setRequests] = useState<EmployeeRequestRecord[]>([]);

  useEffect(() => {
    listEmployeeRequests(profile.user_id).then(setRequests).catch(() => setRequests([]));
  }, [profile.user_id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My requests</h1>
          <p className="text-muted-foreground">All tool access requests and their approval status</p>
        </div>
        <Button asChild>
          <Link to="/employee/requests/new">New request</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request history</CardTitle>
          <CardDescription>{requests.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Tool</th>
                    <th className="pb-3 pr-4 font-medium">Use case</th>
                    <th className="pb-3 pr-4 font-medium">Submitted</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.request_id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{r.tool_display_name}</td>
                      <td className="py-3 pr-4 capitalize text-muted-foreground">
                        {r.use_case_category.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(r.submitted_at).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={r.status} denyCode={r.deny_code} />
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/employee/requests/${r.request_id}`}>
                            Details
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
