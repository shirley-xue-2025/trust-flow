import type { PolicyArtifact } from '@trustflow/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DENY_LABELS } from '@/lib/agentLabels';
import { policyJsonLineHighlighted, policyNegotiatedHighlights } from '@/lib/policyHighlight';

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

  const highlights = policy ? policyNegotiatedHighlights(policy) : [];
  const jsonLines = policy ? JSON.stringify(policy, null, 2).split('\n') : [];

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

        {highlights.length > 0 && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-950">
            <p className="font-medium">What the boardroom negotiated</p>
            <p className="mt-1 text-xs text-emerald-900/80">
              These fields were set by agent demands and concessions — not by the LLM at inference time.
            </p>
            <dl className="mt-2 space-y-1.5 text-xs">
              {highlights.map((row) => (
                <div key={row.label} className="flex flex-wrap gap-x-2">
                  <dt className="font-medium">{row.label}</dt>
                  <dd className="text-emerald-900">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

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
              View rules.json (technical) — highlighted lines were negotiated
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 text-[11px]">
              {jsonLines.map((ln, i) => (
                <div
                  key={i}
                  className={policyJsonLineHighlighted(ln) ? 'rounded bg-emerald-100/80 text-emerald-950' : ''}
                >
                  {ln}
                </div>
              ))}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
