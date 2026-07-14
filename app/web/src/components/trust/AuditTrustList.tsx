import type { GatewayAuditEvent } from '@trustflow/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DENY_LABELS, formatRoutingLabel } from '@/lib/agentLabels';

const OUTCOME_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success'> = {
  allowed: 'success',
  denied: 'destructive',
  redirected: 'secondary',
  error: 'destructive',
};

function formatEventType(type: string): string {
  return type
    .split('_')
    .map((part) => (part.length <= 4 && part === part.toUpperCase() ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
    .join(' ');
}

export function AuditTrustList({
  events,
  title = 'Gateway activity',
  emptyMessage = 'No gateway events yet for this request.',
}: {
  events: GatewayAuditEvent[];
  title?: string;
  emptyMessage?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          What the enforcement layer recorded — retention-class fields for auditor review.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.event_id} className="rounded-lg border p-3 text-sm">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{formatEventType(e.event_type)}</span>
                  <Badge variant={OUTCOME_VARIANT[e.outcome] ?? 'outline'}>{e.outcome}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.timestamp).toLocaleString()}
                  {formatRoutingLabel(e.routing_decision) && ` · ${formatRoutingLabel(e.routing_decision)}`}
                </p>
                {e.deny_reason_code && (
                  <p className="mt-1 text-xs text-destructive">
                    {DENY_LABELS[e.deny_reason_code] ?? e.deny_reason_code}
                  </p>
                )}
                {e.pii_actions && e.pii_actions.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    PII: {e.pii_actions.map((p) => `${p.entity_type} ${p.action}`).join(', ')}
                  </p>
                )}
                {(e.risk_tier || e.disclosure_shown !== undefined) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {e.risk_tier && <span>Risk tier: {e.risk_tier.replace(/_/g, ' ').toLowerCase()}</span>}
                    {e.risk_tier && e.disclosure_shown !== undefined && ' · '}
                    {e.disclosure_shown !== undefined && (
                      <span>Disclosure banner: {e.disclosure_shown ? 'shown' : 'not shown'}</span>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
