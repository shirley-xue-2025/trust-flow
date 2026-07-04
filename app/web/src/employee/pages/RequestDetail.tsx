import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { BoardroomEnvelope, EmployeeRequestRecord } from '@trustflow/shared';
import { AlertCircle, ArrowLeft, Bot, ExternalLink, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getEmployeeRequest } from '@/employee/api';
import { getBoardroomSession, getAuditForRequest, getPolicy } from '@/governance/api';
import { RequestTimeline } from '@/employee/components/RequestTimeline';
import { StatusBadge, isTerminalStatus } from '@/employee/components/StatusBadge';
import { BoardroomTranscript } from '@/components/trust/BoardroomTranscript';
import { StakeholderSummaryCard } from '@/components/trust/StakeholderSummaryCard';
import { ComplianceScoreCard } from '@/components/trust/ComplianceScoreCard';
import { PolicyTrustCard } from '@/components/trust/PolicyTrustCard';
import { AuditTrustList } from '@/components/trust/AuditTrustList';
import { AdvocatePanel } from '@/employee/components/AdvocatePanel';
import { EmployeeResolutionPanel } from '@/employee/components/EmployeeResolutionPanel';
import { computeComplianceScore } from '@/lib/complianceScore';
import type { GatewayAuditEvent, PolicyArtifact } from '@trustflow/shared';

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<EmployeeRequestRecord | null>(null);
  const [transcript, setTranscript] = useState<BoardroomEnvelope[]>([]);
  const [policy, setPolicy] = useState<PolicyArtifact | null>(null);
  const [audit, setAudit] = useState<GatewayAuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const r = await getEmployeeRequest(id);
        if (cancelled) return;
        setRecord(r);
        setError(null);

        if (r.session_id) {
          try {
            const session = await getBoardroomSession(r.session_id);
            if (!cancelled) setTranscript(session.transcript);
          } catch {
            if (!cancelled && r.transcript_snapshot?.length) {
              setTranscript(r.transcript_snapshot);
            }
          }
        } else if (!cancelled && r.transcript_snapshot?.length) {
          setTranscript(r.transcript_snapshot);
        }

        if (r.policy_id) {
          try {
            const p = await getPolicy(r.policy_id);
            if (!cancelled) setPolicy(p.policy);
          } catch {
            /* optional */
          }
          const events = await getAuditForRequest(r.policy_id);
          if (!cancelled) setAudit(events.filter((e) => e.policy_id === r.policy_id));
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
  }, [id, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

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
  const score = computeComplianceScore(record, policy);
  const defaultTab =
    record.status === 'negotiating' || record.status === 'submitted'
      ? 'negotiation'
      : record.status === 'denied_pending_employee' || record.status === 'agent_recommended_deny'
        ? 'overview'
        : 'overview';

  const showDenyPath =
    record.status === 'denied_pending_employee' ||
    record.status === 'agent_recommended_deny' ||
    record.status === 'denied';

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{record.tool_display_name}</h1>
          <p className="text-muted-foreground capitalize">
            {record.use_case_category.replace(/_/g, ' ')} · submitted{' '}
            {new Date(record.submitted_at).toLocaleString()}
          </p>
        </div>
        <StatusBadge status={record.status} className="self-start" />
      </div>

      {record.parent_request_id && (
        <Alert>
          <AlertTitle>Linked to prior request</AlertTitle>
          <AlertDescription>
            Alternative proposal for{' '}
            <Link to={`/employee/requests/${record.parent_request_id}`} className="underline">
              parent request
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {inProgress && record.status !== 'pending_signoff' && (
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">Stakeholder review in progress</p>
              <Progress value={transcript.length > 0 ? Math.min(90, 20 + transcript.length * 12) : 15} className="h-2" />
              <p className="text-xs text-muted-foreground">
                You can follow the negotiation below — Compliance, Procurement, IT, and Works Council
                debate your request in real time.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {record.status === 'pending_signoff' && (
        <Alert>
          <AlertTitle>Waiting for human sign-off</AlertTitle>
          <AlertDescription>
            Stakeholders recommended approval. DPO and IT must sign off before you can use this tool.
          </AlertDescription>
        </Alert>
      )}

      {showDenyPath && <AdvocatePanel requestId={record.request_id} />}
      {showDenyPath && <EmployeeResolutionPanel record={record} onUpdated={reload} />}

      <StakeholderSummaryCard turns={transcript} />

      <ComplianceScoreCard score={score} />

      <Tabs defaultValue={defaultTab}>
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="negotiation">
            Negotiation {transcript.length > 0 ? `(${transcript.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="policy">Policy</TabsTrigger>
          <TabsTrigger value="activity">My usage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
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

                {record.status === 'pending_signoff' && (
                  <p className="text-sm text-amber-800">
                    Waiting for DPO sign-off — you cannot use this tool until human reviewers approve.
                  </p>
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

          <Button variant="outline" size="sm" asChild>
            <Link to={`/governance/requests/${record.request_id}`}>
              <ExternalLink className="h-3.5 w-3.5" />
              Open governance view (DPO / Legal)
            </Link>
          </Button>
        </TabsContent>

        <TabsContent value="negotiation" className="mt-4">
          <p className="mb-4 text-sm text-muted-foreground">
            Transparent stakeholder debate — so you know why a decision was made, not just the outcome.
          </p>
          <BoardroomTranscript turns={transcript} />
        </TabsContent>

        <TabsContent value="policy" className="mt-4">
          <PolicyTrustCard
            policy={policy}
            hash={record.policy_version_hash}
            policyId={record.policy_id}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <AuditTrustList
            events={audit}
            title="Your gateway activity"
            emptyMessage="Usage is logged here after you use an approved tool."
          />
        </TabsContent>
      </Tabs>

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
    </div>
  );
}
