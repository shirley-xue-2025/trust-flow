import { useEffect, useState } from 'react';
import type { EvalScenario, RequestPacket } from '@trustflow/shared';
import { getScenarios } from '../api.js';
import { scenarioPresentation } from '@/lib/scenarioPresentation';

export default function RequestForm({
  onSubmit,
}: {
  onSubmit: (request: RequestPacket, replay?: string) => void;
}) {
  const [scenarios, setScenarios] = useState<EvalScenario[]>([]);
  const [toolId, setToolId] = useState('claude-code');
  const [useCase, setUseCase] = useState('code_completion');
  const [dept, setDept] = useState('payments_engineering');
  const [payment, setPayment] = useState(true);

  useEffect(() => {
    getScenarios().then(setScenarios).catch(() => setScenarios([]));
  }, []);

  return (
    <div className="row">
      <div className="col panel">
        <h2>Employee request</h2>
        <p className="muted">A payments engineer asks to use an AI tool on internal code.</p>

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

        <label>
          <input
            type="checkbox"
            checked={payment}
            onChange={(e) => setPayment(e.target.checked)}
            style={{ width: 'auto', marginRight: 8 }}
          />
          Prompts may touch payment API schemas (sensitive)
        </label>

        <div style={{ marginTop: 14 }}>
          <button
            className="primary"
            onClick={() =>
              onSubmit({
                request_id: crypto.randomUUID(),
                tool_id: toolId,
                use_case_category: useCase,
                department: dept,
                data_classes: payment ? ['payment_api_schemas'] : [],
                annex_iii_risk: useCase === 'hr_screening',
                entity_country: 'DE',
              })
            }
          >
            Submit to boardroom (live)
          </button>
        </div>
        <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
          Live mode calls Qwen-Max (requires DASHSCOPE_API_KEY on the server). Use a replay scenario
          below for the keyless, deterministic demo.
        </p>
      </div>

      <div className="col panel">
        <h2>Recorded demo scenarios (no API key)</h2>
        <p className="muted">
          Each scenario replays a saved qwen-max negotiation through the same deterministic
          compiler — no API key needed.
        </p>
        {scenarios.map((s) => {
          const p = scenarioPresentation(s.scenario_id, s.name);
          return (
          <div key={s.scenario_id} style={{ marginBottom: 10 }}>
            <button
              className="ghost"
              style={{ width: '100%', textAlign: 'left' }}
              onClick={() => onSubmit(s.request, s.scenario_id)}
            >
              <strong>{p.title}</strong>
              <div className="muted" style={{ fontSize: 12 }}>
                Expected: {s.expected_session_outcome}
                {s.expected_deny_code ? ` · ${s.expected_deny_code.replace(/_/g, ' ').toLowerCase()}` : ''}
                {s.expected_routing ? ` → ${s.expected_routing}` : ''}
              </div>
            </button>
          </div>
          );
        })}
      </div>
    </div>
  );
}
