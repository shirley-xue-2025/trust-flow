import { useEffect, useState } from 'react';
import type { GatewayAuditEvent } from '@trustflow/shared';
import { getAudit } from '../api.js';

export default function AuditLog() {
  const [events, setEvents] = useState<GatewayAuditEvent[]>([]);

  const refresh = () => getAudit(100).then((e) => setEvents([...e].reverse())).catch(() => {});

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="panel">
      <h2>
        Audit log — gateway-audit-event (JSONL) <button className="ghost" onClick={refresh}>refresh</button>
      </h2>
      <p className="muted" style={{ fontSize: 12 }}>
        Schema-validated trail — Art. 26-ready. Fingerprints only, never raw prompts.
      </p>
      <table className="audit">
        <thead>
          <tr>
            <th>time</th>
            <th>type</th>
            <th>outcome</th>
            <th>deny</th>
            <th>route</th>
            <th>tool</th>
            <th>input fp</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.event_id}>
              <td className="mono">{new Date(e.timestamp).toLocaleTimeString()}</td>
              <td>{e.event_type}</td>
              <td className={`tag-${e.outcome}`}>{e.outcome}</td>
              <td>{e.deny_reason_code ?? ''}</td>
              <td className="mono">{e.routing_decision}</td>
              <td>{e.tool_id}</td>
              <td className="mono">{e.input_fingerprint?.slice(0, 12)}…</td>
            </tr>
          ))}
          {events.length === 0 && (
            <tr>
              <td colSpan={7} className="muted">
                No events yet — run a prompt in the Playground.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
