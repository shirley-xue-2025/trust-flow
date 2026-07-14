import { useState } from 'react';
import type { PolicyArtifact, RequestPacket } from '@trustflow/shared';
import { runInference, type InferenceResponse } from '../api.js';
import { DENY_LABELS, formatRoutingLabel } from '@/lib/agentLabels';

const SAMPLES = [
  { label: 'Email (masked)', text: 'Email the receipt to katrin.brenner@nordpay.example.' },
  { label: 'Clean prompt', text: 'Refactor this internal helper to use async/await.' },
  { label: 'IBAN (may block)', text: 'Process the refund to IBAN DE89370400440532013000 for the customer.' },
  { label: 'Payment schema', text: 'Generate a TypeScript type for this payment API schema field set.' },
];

export default function Playground({
  policy,
  request,
  onInference,
}: {
  policy?: PolicyArtifact;
  request?: RequestPacket;
  onInference?: (resp: InferenceResponse | null) => void;
}) {
  const [prompt, setPrompt] = useState(SAMPLES[0].text);
  const [resp, setResp] = useState<InferenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!policy) {
    return (
      <div className="panel">
        <h2>Playground</h2>
        <p className="muted">Compile a policy first, then send a prompt through the gateway.</p>
      </div>
    );
  }

  const send = async () => {
    if (loading) return;
    setError(null);
    setResp(null);
    onInference?.(null);
    setLoading(true);
    try {
      const next = await runInference({ policy_id: policy.policy_id, prompt, request });
      setResp(next);
      onInference?.(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <h2>Governed inference — gateway</h2>
      <p className="muted">
        Enforcing <span className="mono">{policy.policy_id}</span>. Per-entity PII: emails masked
        (business continues); IBANs may block on payment routes. Deterministic — no LLM in
        enforcement.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {SAMPLES.map((s) => (
          <button key={s.label} className="ghost" onClick={() => setPrompt(s.text)}>
            {s.label}
          </button>
        ))}
      </div>

      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button className="primary" onClick={send} disabled={loading} style={{ marginTop: 8 }}>
        {loading ? 'Sending…' : 'Send through gateway'}
      </button>

      {error && <div className="banner warn">{error}</div>}

      {resp && (
        <>
          <div style={{ margin: '14px 0 8px' }}>
            outcome:{' '}
            <span className={`outcome ${resp.outcome === 'denied' ? 'DENIED' : 'APPROVED'}`}>
              {resp.outcome.toUpperCase()}
            </span>
            {resp.deny_reason_code && (
              <span className="muted">
                {' '}
                · {DENY_LABELS[resp.deny_reason_code] ?? resp.deny_reason_code}
              </span>
            )}
            {formatRoutingLabel(resp.routing_decision, resp.outcome === 'denied' ? 'DENIED' : 'APPROVED') && (
              <span className="muted">
                {' '}
                · {formatRoutingLabel(resp.routing_decision, resp.outcome === 'denied' ? 'DENIED' : 'APPROVED')}
              </span>
            )}
            {resp.local_redaction && (
              <span className="muted"> · redacted on EU-local node first</span>
            )}
          </div>

          {resp.local_redaction && resp.redaction_audit_event && (
            <details className="box" style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                Local redaction hop (sovereign node)
              </summary>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                Sensitive/payment traffic is redacted on the EU-local safety gateway before the
                (already-redacted) prompt is relayed to the cloud model for completion — the
                local node never generates the answer.
              </p>
              <pre className="json">{JSON.stringify(resp.redaction_audit_event, null, 2)}</pre>
            </details>
          )}

          <div className="side">
            <details className="box">
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Raw prompt</summary>
              <pre className="json">{prompt}</pre>
            </details>
            <details className="box">
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                What the model saw (redacted)
              </summary>
              <pre className="json">{resp.redacted_prompt ?? '— blocked at edge —'}</pre>
              {resp.outcome === 'allowed' && resp.redacted_prompt && (
                <p className="muted" style={{ fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>
                  Sent to model (redacted)
                </p>
              )}
            </details>
          </div>

          {resp.response_body && (
            <details className="box" style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Response</summary>
              <pre className="json">{resp.response_body}</pre>
            </details>
          )}

          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Audit event</summary>
            <pre className="json">{JSON.stringify(resp.audit_event, null, 2)}</pre>
          </details>
        </>
      )}
    </div>
  );
}
