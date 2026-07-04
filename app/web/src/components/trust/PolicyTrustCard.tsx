import type { PolicyArtifact } from '@trustflow/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DENY_LABELS } from '@/lib/agentLabels';

export function PolicyTrustCard({
  policy,
  hash,
  policyId,
}: {
  policy?: PolicyArtifact | null;
  hash?: string | null;
  policyId?: string | null;
}) {
  if (!policy && !policyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compiled policy</CardTitle>
          <CardDescription>Appears after the boardroom compiles rules — enforced without LLM at runtime.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Compiled policy</CardTitle>
        <CardDescription>
          Agents proposed constraints; deterministic code validated, signed, and enforces them at the
          gateway.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">risk: {policy?.risk_tier ?? '—'}</Badge>
          {policy?.routing?.sensitive && (
            <Badge variant="secondary">sensitive → {policy.routing.sensitive}</Badge>
          )}
        </div>
        <p>
          <span className="text-muted-foreground">Policy ID:</span>{' '}
          <code className="rounded bg-muted px-1">{policyId ?? policy?.policy_id}</code>
        </p>
        {hash && (
          <p className="break-all text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Signature hash:</span> {hash}
          </p>
        )}
        {(policy?.deny_overrides ?? []).length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950">
            <p className="font-medium">Standing blocks until gates clear</p>
            <ul className="mt-1 list-inside list-disc text-xs">
              {policy!.deny_overrides!.map((code) => (
                <li key={code}>{DENY_LABELS[code] ?? code}</li>
              ))}
            </ul>
          </div>
        )}
        {policy && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              View rules.json (technical)
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 text-[11px]">
              {JSON.stringify(policy, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
