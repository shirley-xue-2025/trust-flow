import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/employee/components/StatusBadge';
import { BoardroomTranscript } from '@/components/trust/BoardroomTranscript';
import { ComplianceScoreCard } from '@/components/trust/ComplianceScoreCard';
import { PolicyTrustCard } from '@/components/trust/PolicyTrustCard';
import { AuditTrustList } from '@/components/trust/AuditTrustList';
import { HumanReviewPanel } from '@/governance/components/HumanReviewPanel';
import {
  GovernanceRoleSwitcher,
  type GovernanceReviewerRole,
} from '@/governance/GovernanceRoleSwitcher';
import { getGovernanceRequest, type GovernanceRequestDetail } from '@/governance/api';
import { computeComplianceScore } from '@/lib/complianceScore';
import { DENY_LABELS } from '@/lib/agentLabels';

export default function GovernanceRequestOversight() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<GovernanceRequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<GovernanceReviewerRole>('dpo');

  const reload = useCallback(() => {
    if (!id) return;
    getGovernanceRequest(id)
      .then(setDetail)
      .catch((e) => setError((e as Error).message));
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!detail) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { record } = detail;
  const score = computeComplianceScore(record, detail.policy?.policy ?? null);
  const transcript = detail.session?.transcript ?? [];
  const defaultTab =
    record.status === 'pending_signoff' || record.status === 'agent_recommended_approve'
      ? 'signoff'
      : 'negotiation';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/governance/queues?queue=signoff&role=dpo">
          <ArrowLeft className="h-4 w-4" />
          Back to queues
        </Link>
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{record.tool_display_name}</h1>
          <p className="text-muted-foreground">
            {record.actor_name} · {record.use_case_category.replace(/_/g, ' ')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={record.status} />
          <GovernanceRoleSwitcher value={viewerRole} onChange={setViewerRole} />
        </div>
      </div>

      {record.deny_code && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>Gate:</strong> {DENY_LABELS[record.deny_code] ?? record.deny_code}
        </div>
      )}

      <HumanReviewPanel
        requestId={record.request_id}
        record={record}
        reviews={detail.human_reviews ?? []}
        activation={detail.activation}
        viewerRole={viewerRole}
        onUpdated={reload}
      />

      <ComplianceScoreCard score={score} />

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="signoff">Sign-off</TabsTrigger>
          <TabsTrigger value="negotiation">Boardroom</TabsTrigger>
          <TabsTrigger value="policy">Policy</TabsTrigger>
          <TabsTrigger value="audit">Gateway audit</TabsTrigger>
        </TabsList>
        <TabsContent value="signoff" className="mt-4">
          <p className="text-sm text-muted-foreground">
            Policy activation: <strong>{detail.policy?.activation_status ?? record.policy_activation}</strong>
            {detail.activation?.can_activate ? ' — ready to release' : ' — awaiting reviews'}
          </p>
        </TabsContent>
        <TabsContent value="negotiation" className="mt-4">
          <p className="mb-4 text-sm text-muted-foreground">
            Full stakeholder negotiation — what Legal, Procurement, IT, and Works Council said before
            any policy was compiled.
          </p>
          <BoardroomTranscript turns={transcript} />
        </TabsContent>
        <TabsContent value="policy" className="mt-4">
          <PolicyTrustCard
            policy={detail.policy?.policy}
            hash={detail.policy?.policy_version_hash ?? record.policy_version_hash}
            policyId={record.policy_id}
          />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <AuditTrustList events={detail.audit} />
        </TabsContent>
      </Tabs>

      {record.business_justification && (
        <div className="rounded-lg border p-4 text-sm">
          <p className="font-medium">Employee justification</p>
          <p className="mt-1 text-muted-foreground">{record.business_justification}</p>
        </div>
      )}
    </div>
  );
}
