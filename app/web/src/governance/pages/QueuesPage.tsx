import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getGovernanceQueues, type GovernanceQueueItem } from '@/governance/api';
import { useGovernanceRole } from '@/governance/useGovernanceRole';
import { StatusBadge } from '@/employee/components/StatusBadge';
import type { EmployeeRequestStatus } from '@trustflow/shared';

const QUEUE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'signoff', label: 'Sign-off' },
  { id: 'appeals', label: 'Appeals' },
  { id: 'external', label: 'External' },
  { id: 'in_review', label: 'In review' },
] as const;

type QueueTab = (typeof QUEUE_TABS)[number]['id'];

export default function GovernanceQueuesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useGovernanceRole();
  const queue = (searchParams.get('queue') as QueueTab) || 'signoff';

  const [items, setItems] = useState<GovernanceQueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getGovernanceQueues({ queue, role })
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
        setError(null);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [queue, role]);

  useEffect(() => {
    load();
  }, [load]);

  function setQueue(next: QueueTab) {
    setSearchParams({ queue: next, role });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Queues</h1>
        <p className="text-muted-foreground">
          Items for your selected reviewer role — switch DPO, Procurement, or IT Security in the header.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
        {QUEUE_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setQueue(id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              queue === id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {QUEUE_TABS.find((t) => t.id === queue)?.label ?? 'Queue'}
            {!loading && ` (${total})`}
          </CardTitle>
          <CardDescription>
            {role === 'all'
              ? 'All pending items'
              : `Items awaiting ${role.toUpperCase()} action`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items in this queue.</p>
          ) : (
            <>
              <ul className="space-y-3 md:hidden">
                {items.map((item) => (
                  <li key={`${item.request_id}-${item.kind}-m`} className="rounded-lg border p-4">
                    <Link
                      to={`/governance/requests/${item.request_id}`}
                      className="font-medium hover:underline"
                    >
                      {item.actor_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {item.department.replace(/_/g, ' ')} · {item.tool_display_name}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge
                        status={(item.display_status ?? 'pending_signoff') as EmployeeRequestStatus}
                      />
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Employee</th>
                    <th className="pb-2 pr-4 font-medium">Tool</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 pr-4 font-medium">Reviews</th>
                    <th className="pb-2 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={`${item.request_id}-${item.kind}`} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <Link
                          to={`/governance/requests/${item.request_id}`}
                          className="font-medium hover:underline"
                        >
                          {item.actor_name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {item.department.replace(/_/g, ' ')}
                        </p>
                      </td>
                      <td className="py-3 pr-4">{item.tool_display_name}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge
                          status={(item.display_status ?? 'pending_signoff') as EmployeeRequestStatus}
                        />
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {Object.entries(item.reviews_summary ?? {})
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ') || '—'}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(item.submitted_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
