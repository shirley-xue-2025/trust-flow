import { useEffect, useRef, useState } from 'react';
import type { BoardroomEnvelope, PolicyArtifact, RequestPacket } from '@trustflow/shared';
import { startSession, streamSession, type BoardroomResult } from '../api.js';

const AGENT_NAME: Record<string, string> = {
  workflow_runner: 'Workflow Runner',
  procurement: 'Procurement & Vendor Risk',
  corporate_compliance: 'Corporate Compliance',
  works_council: 'Works Council Liaison',
  it_infra: 'IT & Infra',
};

export default function Boardroom({
  request,
  replay,
  onCompiled,
  gotoPolicy,
}: {
  request?: RequestPacket;
  replay?: string;
  onCompiled: (policy: PolicyArtifact, hash: string) => void;
  gotoPolicy: () => void;
}) {
  const [turns, setTurns] = useState<BoardroomEnvelope[]>([]);
  const [result, setResult] = useState<BoardroomResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  // `signal` lets a torn-down run (React Strict Mode double-invokes effects in
  // dev) abort: it won't open a second stream or append turns. Without this the
  // transcript renders twice. Also closes any prior stream before starting.
  const run = (signal?: { cancelled: boolean }) => {
    if (!request) return;
    esRef.current?.close();
    esRef.current = null;
    setTurns([]);
    setResult(null);
    setError(null);
    setRunning(true);
    startSession(request, replay)
      .then(({ session_id }) => {
        if (signal?.cancelled) return;
        esRef.current = streamSession(session_id, {
          onTurn: (env) => {
            if (!signal?.cancelled) setTurns((t) => [...t, env]);
          },
          onResult: (r) => {
            if (signal?.cancelled) return;
            setResult(r);
            setRunning(false);
            onCompiled(r.policy, r.policy_version_hash);
          },
          onError: (msg) => {
            if (signal?.cancelled) return;
            setError(msg);
            setRunning(false);
          },
        });
      })
      .catch((e) => {
        if (signal?.cancelled) return;
        setError((e as Error).message);
        setRunning(false);
      });
  };

  useEffect(() => {
    const signal = { cancelled: false };
    if (request) run(signal);
    return () => {
      signal.cancelled = true;
      esRef.current?.close();
      esRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, replay]);

  if (!request) {
    return (
      <div className="panel">
        <h2>Boardroom</h2>
        <p className="muted">Submit a request first.</p>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col panel">
        <h2>
          Agent boardroom {replay ? <span className="pill pass">replay {replay}</span> : <span className="pill conditional_approve">live</span>}
        </h2>
        {error && <div className="banner warn">Live path error: {error}. Try a replay scenario.</div>}
        {turns.length === 0 && running && <p className="muted">Negotiating…</p>}
        {turns.map((t, i) => (
          <div key={i} className={`agent-card ${t.stance}`}>
            <div className="head">
              <span className="name">
                R{t.round} · {AGENT_NAME[t.agent] ?? t.agent}
              </span>
              <span className={`pill ${t.stance}`}>{t.stance}</span>
            </div>
            <div className="nl">{t.natural_language}</div>
            {(t.demands ?? []).length > 0 && (
              <div className="kv">
                demands:{' '}
                {t.demands!.map((d, j) => (
                  <span key={j} className={d.hard ? 'hard' : ''}>
                    {d.field}={String(d.value)}
                    {d.hard ? ' (hard)' : ''}
                    {j < t.demands!.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}
            {(t.concessions ?? []).length > 0 && (
              <div className="kv">
                concessions: {t.concessions!.map((c) => `${c.field}=${String(c.value)}`).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="col panel">
        <h2>Outcome</h2>
        {!result && <p className="muted">Compiling once the debate concludes…</p>}
        {result && (
          <>
            <div className={`outcome ${result.outcome}`}>{result.outcome}</div>
            {result.deny_code && <p className="muted">deny code: {result.deny_code}</p>}
            {result.routing_decision && <p className="muted">routing: {result.routing_decision}</p>}
            <div className="hash" style={{ margin: '10px 0' }}>
              policy_version_hash
              <br />
              {result.policy_version_hash}
            </div>
            <p className="muted" style={{ fontSize: 12 }}>
              An LLM <em>proposed</em> this; a deterministic compiler validated, floor-checked, and
              signed it. The model never touches enforcement.
            </p>
            <pre className="json">{JSON.stringify(result.policy, null, 2)}</pre>
            <button className="primary" onClick={gotoPolicy} style={{ marginTop: 10 }}>
              View compiled policy →
            </button>
          </>
        )}
        <button className="ghost" onClick={() => run()} disabled={running} style={{ marginTop: 10 }}>
          Re-run
        </button>
      </div>
    </div>
  );
}
