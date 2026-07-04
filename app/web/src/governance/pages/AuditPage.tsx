import { useEffect, useState } from 'react';
import type { GatewayAuditEvent } from '@trustflow/shared';
import { Loader2 } from 'lucide-react';
import { AuditTrustList } from '@/components/trust/AuditTrustList';
import { getAuditForRequest } from '@/governance/api';

export default function GovernanceAuditPage() {
  const [events, setEvents] = useState<GatewayAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditForRequest(undefined, 100)
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit log</h1>
        <p className="text-muted-foreground">
          Immutable gateway events — policy hash, routing, PII actions, deny reasons.
        </p>
      </div>
      <AuditTrustList events={events} title="All recent events" emptyMessage="No audit events recorded yet." />
    </div>
  );
}
