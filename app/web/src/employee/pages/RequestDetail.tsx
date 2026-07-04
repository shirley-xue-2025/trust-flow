import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { EmployeeRequestRecord } from '@trustflow/shared';
import { AlertCircle, ArrowLeft, Bot, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { getEmployeeRequest } from '@/employee/api';
import { RequestTimeline } from '@/employee/components/RequestTimeline';
import { StatusBadge, isTerminalStatus } from '@/employee/components/StatusBadge';

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<EmployeeRequestRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const r = await getEmployeeRequest(id);
        if (!cancelled) {
          setRecord(r);
          setError(null);
        }
        return r;
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
        return null;
      }
    };

    void load();
    const interval = setInterval(async () => {
      const r = await load();
      if (r && isTerminalStatus(r.status)) clearInterval(interval);
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load request</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!record) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const inProgress = !isTerminalStatus(record.status);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/employee/requests">
          <ArrowLeft className="h-4 w-4" />
          Back to requests
        </Link>
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{record.tool_display_name}</h1>
          <p className="text-muted-foreground capitalize">
            {record.use_case_category.replace(/_/g, ' ')} · submitted{' '}
            {new Date(record.submitted_at).toLocaleString()}
          </p>
        </div>
        <StatusBadge status={record.status} className="self-start" />
      </div>

      {inProgress && (
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">Agent boardroom in session</p>
              <Progress value={record.status === 'negotiating' ? 60 : 20} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Compliance, Procurement, IT, and Works Council are negotiating your policy…
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>Where your request is in the approval pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <RequestTimeline record={record} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next steps</CardTitle>
            <CardDescription>What happens now</CardDescription>
          </CardHeader>
          <CardContent>
            {(record.next_steps ?? []).length > 0 ? (
              <ul className="space-y-2 text-sm">
                {record.next_steps!.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    {step}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Waiting for boardroom outcome…</p>
            )}

            {record.deny_code && (
              <>
                <Separator className="my-4" />
                <p className="text-xs text-muted-foreground">
                  Gateway deny code: <code className="rounded bg-muted px-1">{record.deny_code}</code>
                </p>
              </>
            )}

            {record.status === 'approved' && record.policy_id && (
              <>
                <Separator className="my-4" />
                <Button asChild className="w-full">
                  <Link to={`/employee/tools/${record.request_id}`}>
                    <Bot className="h-4 w-4" />
                    Use {record.tool_display_name}
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {record.business_justification && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your justification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{record.business_justification}</p>
          </CardContent>
        </Card>
      )}

      {record.policy_id && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compiled policy</CardTitle>
            <CardDescription>
              Deterministic rules enforced at the gateway — not interpreted by an LLM at runtime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Policy ID:</span>{' '}
              <code className="rounded bg-muted px-1">{record.policy_id}</code>
            </p>
            {record.policy_version_hash && (
              <p className="break-all text-xs text-muted-foreground">hash: {record.policy_version_hash}</p>
            )}
            {record.routing_decision && (
              <p>
                <span className="text-muted-foreground">Routing:</span> {record.routing_decision}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
