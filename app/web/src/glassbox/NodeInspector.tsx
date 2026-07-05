import { useEffect, useState } from 'react';
import type { BoardroomEnvelope, EvalScenario, GatewayAuditEvent, PolicyArtifact, RequestPacket } from '@trustflow/shared';
import type { BoardroomResult, InferenceResponse } from '../api.js';
import PolicyPanel from '../views/PolicyPanel.js';
import Playground from '../views/Playground.js';
import AuditLog from '../views/AuditLog.js';
import { resultGrounding } from './processGraph.js';
import { DENY_LABELS } from '../lib/agentLabels.js';

const AGENT_NAME: Record<string, string> = {
  workflow_runner: 'Workflow Runner',
  procurement: 'Procurement',
  corporate_compliance: 'Compliance',
  works_council: 'Works Council',
  it_infra: 'IT & Infra',
};

export default function NodeInspector({
  nodeId,
  embedded = false,
  request,
  replay,
  turns,
  result,
  running,
  policy,
  policyHash,
  inference,
  auditEvents,
  onRequestChange,
  onInference,
  scenarios,
}: {
  nodeId: string;
  embedded?: boolean;
  request?: RequestPacket;
  replay?: string;
  turns: BoardroomEnvelope[];
  result: BoardroomResult | null;
  running: boolean;
  policy?: PolicyArtifact;
  policyHash?: string;
  inference: InferenceResponse | null;
  auditEvents: GatewayAuditEvent[];
  onRequestChange: (request: RequestPacket, replay?: string) => void;
  onInference: (resp: InferenceResponse | null) => void;
  scenarios: EvalScenario[];
}) {
  switch (nodeId) {
    case 'request':
      return (
        <div className="inspector-body">
          {!embedded && <h3>Employee request</h3>}
          <p className="inspector-lead">
            Configure inputs for a <strong>live</strong> Qwen run (needs API key), or pick a replay
            scenario below to play a recorded transcript.
          </p>
          <RequestInspectorForm request={request} scenarios={scenarios} onSubmit={onRequestChange} />
        </div>
      );

    case 'org-gates':
      return (
        <div className="inspector-body">
          {!embedded && <h3>Org gates read</h3>}
          <p className="inspector-lead">Connected reads — no judgment, just grounding for the boardroom.</p>
          {request ? (
            <dl className="inspector-kv">
              <dt>Entity</dt>
              <dd>{request.entity_country ?? 'DE'}</dd>
              <dt>Vendor DPA</dt>
              <dd>{request.vendor_dpa_status ?? 'from org defaults'}</dd>
              <dt>Betriebsvereinbarung</dt>
              <dd>{request.betriebsvereinbarung_status ?? 'from packet at compile'}</dd>
              <dt>Data classes</dt>
              <dd>{request.data_classes?.join(', ') || 'none declared'}</dd>
              <dt>Annex III</dt>
              <dd>{request.annex_iii_risk ? 'yes — high-risk path' : 'no'}</dd>
            </dl>
          ) : (
            <p className="muted">Submit a request first.</p>
          )}
        </div>
      );

    case 'boardroom':
      return null;

    case 'compiler':
      return (
        <div className="inspector-body">
          {!embedded && <h3>Policy compiler</h3>}
          <p className="inspector-lead">
            LLM <em>proposed</em> demands; deterministic compiler validated, floor-checked, and signed.
            The model never touches enforcement.
          </p>
          {!result && <p className="muted">Awaiting boardroom outcome…</p>}
          {result && (
            <>
              <div className={`outcome ${result.outcome}`}>{result.outcome}</div>
              {result.deny_code && (
                <p className="muted">
                  {DENY_LABELS[result.deny_code] ?? result.deny_code}
                </p>
              )}
              {result.routing_decision && <p className="muted">routing: {result.routing_decision}</p>}
              <div className="hash">hash: {result.policy_version_hash}</div>
            </>
          )}
        </div>
      );

    case 'policy':
      return (
        <div className="inspector-body">
          <PolicyPanel policy={policy} hash={policyHash} gotoPlayground={() => {}} />
        </div>
      );

    case 'gateway':
      return (
        <div className="inspector-body">
          <Playground
            policy={policy}
            request={request}
            onInference={onInference}
          />
        </div>
      );

    case 'audit':
      return (
        <div className="inspector-body inspector-body--wide">
          <AuditLog />
        </div>
      );

    case 'result': {
      const g = resultGrounding({
        request,
        replay,
        turns,
        running,
        result,
        policy,
        policyHash,
        inference,
        auditEvents,
      });
      return (
        <div className="inspector-body">
          {!embedded && <h3>Output · Result</h3>}
          <p className="inspector-result-headline">{g.detail}</p>
          <dl className="inspector-kv">
            <dt>Decision</dt>
            <dd>{g.decision}</dd>
            <dt>Routing</dt>
            <dd>{g.routing}</dd>
            <dt>Grounding</dt>
            <dd>{g.grounding}</dd>
            <dt>Enforcement from</dt>
            <dd>{g.numbersFrom}</dd>
          </dl>
          <p className="inspector-footnote muted">
            Production employee/governance flows require{' '}
            <a href="/governance/queues?queue=signoff&role=dpo">human sign-off</a> before gateway
            activation — this view shows live agent machinery only.
          </p>
          {turns.length > 0 && (
            <div className="inspector-mini-transcript">
              <strong>Last agent turn</strong>
              <p>
                {AGENT_NAME[turns[turns.length - 1]!.agent] ?? turns[turns.length - 1]!.agent}:{' '}
                {turns[turns.length - 1]!.natural_language}
              </p>
            </div>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

function RequestInspectorForm({
  request,
  scenarios,
  onSubmit,
}: {
  request?: RequestPacket;
  scenarios: EvalScenario[];
  onSubmit: (request: RequestPacket, replay?: string) => void;
}) {
  const [toolId, setToolId] = useState(request?.tool_id ?? 'claude-code');
  const [useCase, setUseCase] = useState(request?.use_case_category ?? 'code_completion');
  const [dept, setDept] = useState(request?.department ?? 'payments_engineering');
  const [payment, setPayment] = useState(Boolean(request?.data_classes?.length));
  const [vendorDpa, setVendorDpa] = useState<'signed' | 'pending'>(
    request?.vendor_dpa_status === 'pending' ? 'pending' : 'signed',
  );
  const [betriebsrat, setBetriebsrat] = useState<'signed' | 'pending'>(
    request?.betriebsvereinbarung_status === 'pending' ? 'pending' : 'signed',
  );

  useEffect(() => {
    if (!request) return;
    setToolId(request.tool_id);
    setUseCase(request.use_case_category);
    setDept(request.department ?? 'payments_engineering');
    setPayment(Boolean(request.data_classes?.length));
    setVendorDpa(request.vendor_dpa_status === 'pending' ? 'pending' : 'signed');
    setBetriebsrat(request.betriebsvereinbarung_status === 'pending' ? 'pending' : 'signed');
  }, [request]);

  const buildRequest = (): RequestPacket => ({
    request_id: crypto.randomUUID(),
    tool_id: toolId,
    use_case_category: useCase,
    department: dept,
    data_classes: payment ? ['payment_api_schemas'] : [],
    annex_iii_risk: useCase === 'hr_screening',
    entity_country: 'DE',
    vendor_dpa_status: vendorDpa,
    betriebsvereinbarung_status: betriebsrat,
  });

  return (
    <div className="inspector-form">
      <label>Tool</label>
      <select value={toolId} onChange={(e) => setToolId(e.target.value)}>
        <option value="claude-code">Claude Code (Anthropic)</option>
        <option value="microsoft-copilot-365">Microsoft 365 Copilot</option>
        <option value="chatgpt-enterprise">ChatGPT Enterprise</option>
      </select>

      <label>Use case</label>
      <select value={useCase} onChange={(e) => setUseCase(e.target.value)}>
        <option value="code_completion">Code completion</option>
        <option value="summarization">Summarization</option>
        <option value="hr_screening">HR screening (Annex III)</option>
      </select>

      <label>Department</label>
      <select value={dept} onChange={(e) => setDept(e.target.value)}>
        <option value="payments_engineering">Payments engineering</option>
        <option value="customer_support">Customer support</option>
      </select>

      <label className="inspector-check">
        <input
          type="checkbox"
          checked={payment}
          onChange={(e) => setPayment(e.target.checked)}
        />
        Prompts may touch payment API schemas
      </label>

      <label>Vendor DPA</label>
      <select value={vendorDpa} onChange={(e) => setVendorDpa(e.target.value as 'signed' | 'pending')}>
        <option value="signed">Signed</option>
        <option value="pending">Pending</option>
      </select>

      <label>Betriebsvereinbarung (§87)</label>
      <select
        value={betriebsrat}
        onChange={(e) => setBetriebsrat(e.target.value as 'signed' | 'pending')}
      >
        <option value="signed">Signed</option>
        <option value="pending">Pending</option>
      </select>

      <button type="button" className="primary" onClick={() => onSubmit(buildRequest())}>
        Use custom request (live)
      </button>

      <div className="inspector-scenarios">
        <strong>Replay scenarios</strong>
        <p className="inspector-hint muted">
          Recorded qwen-max transcripts — deterministic, no API key.
        </p>
        {scenarios.map((s) => (
          <button
            key={s.scenario_id}
            type="button"
            className="scenario-btn"
            onClick={() => onSubmit(s.request, s.scenario_id)}
          >
            <span>{s.scenario_id}</span> · {s.name}
            <small>
              {s.expected_session_outcome}
              {s.expected_deny_code ? ` (${s.expected_deny_code})` : ''}
            </small>
          </button>
        ))}
      </div>
    </div>
  );
}
