import { useState } from 'react';
import type { AppealRecord } from '@trustflow/shared';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { decideGovernanceAppeal } from '@/governance/api';

export function AppealReviewPanel({
  appeal,
  onUpdated,
}: {
  appeal: AppealRecord;
  onUpdated: () => void;
}) {
  const [rationale, setRationale] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (appeal.status !== 'pending') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appeal {appeal.status}</CardTitle>
          <CardDescription>{appeal.decision_rationale}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  async function decide(decision: 'grant' | 'deny') {
    setBusy(true);
    setError(null);
    try {
      await decideGovernanceAppeal(appeal.appeal_id, {
        decision,
        rationale,
        registry_patch:
          appeal.appeal_type === 'procedural' ? { betriebsvereinbarung_status: 'signed' } : undefined,
      });
      setRationale('');
      onUpdated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <CardTitle className="text-base">Employee appeal</CardTitle>
        <CardDescription>
          Type: <strong>{appeal.appeal_type.replace(/_/g, ' ')}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <blockquote className="border-l-4 border-muted-foreground/30 pl-4 text-sm italic">
          {appeal.statement}
        </blockquote>
        <Textarea
          placeholder="Decision rationale (min 20 characters)…"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={3}
        />
        <div className="flex gap-2">
          <Button
            disabled={busy || rationale.trim().length < 20}
            onClick={() => void decide('grant')}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Grant appeal'}
          </Button>
          <Button
            variant="outline"
            disabled={busy || rationale.trim().length < 20}
            onClick={() => void decide('deny')}
          >
            Deny appeal
          </Button>
        </div>
        {appeal.appeal_type === 'procedural' && (
          <p className="text-xs text-muted-foreground">
            Grant will refresh Betriebsvereinbarung status and route to human parallel reviews.
          </p>
        )}
        {(appeal.appeal_type === 'factual' || appeal.appeal_type === 'alternative_scope') && (
          <p className="text-xs text-muted-foreground">
            Grant will re-open stakeholder review with updated evidence.
          </p>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
