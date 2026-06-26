import { useState } from 'react';
import type { PolicyArtifact, RequestPacket } from '@trustflow/shared';
import { runInference, type InferenceResponse } from '../api.js';

const SAMPLES = [
  { label: 'Clean prompt', text: 'Refactor this internal helper to use async/await.' },
  { label: 'IBAN (PII)', text: 'Process the refund to IBAN DE89370400440532013000 for the customer.' },
  { label: 'Email (PII)', text: 'Email the receipt to katrin.brenner@nordpay.example.' },
  { label: 'Payment schema', text: 'Generate a TypeScript type for this payment API schema field set.' },
];

export default function Playground({
  policy,
  request,
}: {
  policy?: PolicyArtifact;
  request?: RequestPacket;
}) {
  const [prompt, setPrompt] = useState(SAMPLES[1].text);
  const [resp, setResp] = useState<InferenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!policy) {
    return (
      <div className="panel">
        <h2>Playground</h2>
        <p className="muted">Compile a policy first, then send a prompt through the gateway.</p>
      </div>
    );
  }

  const send = async () => {
    setError(null);
    setResp(null);
    try {
      setResp(await runInference({ policy_id: policy.policy_id, prompt, request }));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="panel">
      <h2>Governed inference — Layer A gateway</h2>
      <p className="muted">
        Enforcing <span className="mono">{policy.policy_id}</span>. Deterministic: PII scan →
        routing → audit. No LLM in this path.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {SAMPLES.map((s) => (
          <button key={s.label} className="ghost" onClick={() => setPrompt(s.text)}>
            {s.label}
          </button>
        ))}
      </div>

      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button className="primary" onClick={send} style={{ marginTop: 8 }}>
        Send through gateway
      </button>

      {error && <div className="banner warn">{error}</div>}

      {resp && (
        <>
          <div style={{ margin: '14px 0 8px' }}>
            outcome:{' '}
            <span className={`outcome ${resp.outcome === 'denied' ? 'DENIED' : 'APPROVED'}`}>
              {resp.outcome.toUpperCase()}
            </span>
            {resp.deny_reason_code && <span className="muted"> · {resp.deny_reason_code}</span>}
            <span className="muted"> · route {resp.routing_decision}</span>
          </div>

          <div className="side">
            <div className="box">
              <strong>Raw prompt</strong>
              <pre className="json">{prompt}</pre>
            </div>
            <div className="box">
              <strong>What the model saw (masked)</strong>
              <pre className="json">{resp.redacted_prompt ?? '— blocked at edge —'}</pre>
            </div>
          </div>

          {resp.response_body && (
            <div className="box" style={{ marginTop: 10 }}>
              <strong>Response</strong>
              <pre className="json">{resp.response_body}</pre>
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            <strong>Audit event</strong>
            <pre className="json">{JSON.stringify(resp.audit_event, null, 2)}</pre>
          </div>
        </>
      )}
    </div>
  );
}
