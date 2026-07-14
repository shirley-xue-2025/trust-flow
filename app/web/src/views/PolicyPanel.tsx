import type { PolicyArtifact } from '@trustflow/shared';
import { policyJsonLineHighlighted } from '@/lib/policyHighlight';

/**
 * Shows rules.json + version hash. Highlighted lines mark fields the
 * boardroom negotiated above the seed defaults.
 */

export default function PolicyPanel({
  policy,
  hash,
  gotoPlayground,
}: {
  policy?: PolicyArtifact;
  hash?: string;
  gotoPlayground: () => void;
}) {
  if (!policy) {
    return (
      <div className="panel">
        <h2>Compiled policy</h2>
        <p className="muted">Run a boardroom session to compile a policy.</p>
      </div>
    );
  }

  const lines = JSON.stringify(policy, null, 2).split('\n');

  return (
    <div className="panel">
      <h2>Compiled policy — rules.json</h2>
      <div className="hash" style={{ marginBottom: 12 }}>
        policy_id: <span className="mono">{policy.policy_id}</span> · v{policy.version}
        <br />
        hash: {hash}
      </div>
      <p className="muted" style={{ fontSize: 12 }}>
        Highlighted lines were negotiated by the boardroom above the org defaults.
      </p>
      <pre className="json">
        {lines.map((ln, i) => {
          const hit = policyJsonLineHighlighted(ln);
          return (
            <div key={i} className={hit ? 'added' : ''}>
              {ln}
            </div>
          );
        })}
      </pre>
      {(policy.deny_overrides ?? []).length > 0 && (
        <div className="banner warn">
          Standing deny overrides keep the gateway blocking until external gates clear:{' '}
          {policy.deny_overrides!.join(', ')}
        </div>
      )}
      <button className="primary" onClick={gotoPlayground} style={{ marginTop: 8 }}>
        Try governed inference →
      </button>
    </div>
  );
}
