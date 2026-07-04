import { useState } from 'react';
import type { EmployeeRequestRecord, HumanReviewRecord } from '@trustflow/shared';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { decideHumanReview } from '@/governance/api';
import type { GovernanceReviewerRole } from '@/governance/GovernanceRoleSwitcher';

const ROLE_LABELS: Record<string, string> = {
  dpo: 'DPO / Legal',
  procurement: 'Procurement',
  it: 'IT / CISO',
};

export function HumanReviewPanel({
  requestId,
  record,
  reviews,
  activation,
  viewerRole,
  onUpdated,
}: {
  requestId: string;
  record: EmployeeRequestRecord;
  reviews: HumanReviewRecord[];
  activation?: { can_activate: boolean; blocking_reasons: string[] };
  viewerRole: GovernanceReviewerRole;
  onUpdated: () => void;
}) {
  const [rationale, setRationale] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendingForViewer = reviews.find(
    (r) => r.status === 'pending' && (viewerRole === 'all' || r.reviewer_role === viewerRole),
  );

  const showSignOff =
    record.status === 'pending_signoff' ||
    record.status === 'agent_recommended_approve' ||
    record.status === 'appeal_pending';

  if (!showSignOff && reviews.length === 0) return null;

  async function decide(review: HumanReviewRecord, decision: 'approve' | 'reject') {
    setError(null);
    setBusy(review.review_id);
    try {
      await decideHumanReview(requestId, review.review_id, { decision, rationale }, review.reviewer_role);
      setRationale('');
      onUpdated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Human sign-off</CardTitle>
        <CardDescription>
          Parallel reviews required before the gateway activates this policy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {reviews.map((r) => (
            <li key={r.review_id} className="flex items-start gap-2 text-sm">
              {r.status === 'approved' && <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />}
              {r.status === 'pending' && <Circle className="mt-0.5 h-4 w-4 text-amber-500" />}
              {r.status === 'rejected' && <XCircle className="mt-0.5 h-4 w-4 text-destructive" />}
              <div>
                <p className="font-medium">{ROLE_LABELS[r.reviewer_role] ?? r.reviewer_role}</p>
                <p className="text-muted-foreground">{r.reviewer_display_name}</p>
                {r.rationale && (
                  <p className="mt-1 text-xs text-muted-foreground">&ldquo;{r.rationale}&rdquo;</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {activation && !activation.can_activate && activation.blocking_reasons.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Blocking: {activation.blocking_reasons.map((b) => b.replace(/_/g, ' ')).join(' · ')}
          </p>
        )}

        {pendingForViewer && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">
              Your review ({ROLE_LABELS[pendingForViewer.reviewer_role]})
            </p>
            <Textarea
              placeholder="Rationale (min 20 characters) — visible in audit trail"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={busy !== null || rationale.trim().length < 20}
                onClick={() => void decide(pendingForViewer, 'approve')}
              >
                {busy === pendingForViewer.review_id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Sign off'
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null || rationale.trim().length < 20}
                onClick={() => void decide(pendingForViewer, 'reject')}
              >
                Reject
              </Button>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Action failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
