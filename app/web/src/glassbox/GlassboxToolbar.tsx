import { Link } from 'react-router-dom';
import type { EvalScenario, RequestPacket } from '@trustflow/shared';
import { scenarioPresentation } from '@/lib/scenarioPresentation';

export function GlassboxToolbar({
  scenarios,
  replay,
  request,
  running,
  error,
  onScenarioChange,
  onRun,
}: {
  scenarios: EvalScenario[];
  replay?: string;
  request?: RequestPacket;
  running: boolean;
  error: string | null;
  onScenarioChange: (r: RequestPacket, replayId?: string) => void;
  onRun: () => void;
}) {
  return (
    <header className="glassbox-toolbar">
      <Link to="/employee" className="glassbox-toolbar__back">
        ← Product
      </Link>
      <div className="glassbox-toolbar__title">
        <h1>TrustFlow glassbox</h1>
        <p>
          Transparent judge view — agents propose, compiler signs, gateway enforces (no LLM at the
          edge).
        </p>
      </div>
      <div className="glassbox-toolbar__controls">
        <label className="glassbox-toolbar__scenario">
          Demo scenario
          <select
            value={replay ?? ''}
            onChange={(e) => {
              const id = e.target.value;
              if (!id) {
                if (request) onScenarioChange(request, undefined);
                return;
              }
              const s = scenarios.find((sc) => sc.scenario_id === id);
              if (s) onScenarioChange(s.request, s.scenario_id);
            }}
          >
            <option value="">Custom / none</option>
            {scenarios.map((s) => {
              const p = scenarioPresentation(s.scenario_id, s.name);
              return (
                <option key={s.scenario_id} value={s.scenario_id}>
                  {p.title}
                </option>
              );
            })}
          </select>
        </label>
        <button
          type="button"
          className="glassbox-toolbar__run"
          onClick={onRun}
          disabled={!request || running}
        >
          ▶ Run boardroom
        </button>
        {error ? (
          <p className="glassbox-toolbar__error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </header>
  );
}
