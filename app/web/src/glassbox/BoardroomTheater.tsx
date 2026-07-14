import type { BoardroomEnvelope } from '@trustflow/shared';
import type { BoardroomResult } from '../api.js';
import { STANCE_LABELS, formatRoutingLabel } from '../lib/agentLabels.js';
import { BoardroomStageTranscript } from './BoardroomStageTranscript.js';
import {
  BOARDROOM_AGENT_ORDER,
  BOARDROOM_AGENT_SHORT,
  latestStancesByAgent,
} from './boardroomRoster.js';
import { Link } from 'react-router-dom';
import { employeeLinkForScenario, scenarioPresentation } from '@/lib/scenarioPresentation';

export function BoardroomTheater({
  turns,
  running,
  result,
  replay,
}: {
  turns: BoardroomEnvelope[];
  running: boolean;
  result: BoardroomResult | null;
  replay?: string;
}) {
  const stances = latestStancesByAgent(turns);
  const hasActivity = running || turns.length > 0;
  const employeeLink = employeeLinkForScenario(replay);
  const scenarioLabel = replay ? scenarioPresentation(replay) : null;

  return (
    <section className="glassbox-theater" aria-labelledby="boardroom-theater-title">
      <header className="glassbox-theater__head">
        <div>
          <p className="glassbox-theater__eyebrow">Multi-agent negotiation</p>
          <h2 id="boardroom-theater-title" className="glassbox-theater__title">
            Agent boardroom
          </h2>
          <p className="glassbox-theater__lead">
            Five Qwen specialists negotiate in structured rounds — proposals only; compiler signs.
          </p>
          <p className="glassbox-theater__mode-hint muted">
            Recorded demo = saved qwen-max negotiation replayed instantly (no API key) · Live =
            real-time negotiation (API key)
          </p>
          {employeeLink && (
            <p className="glassbox-theater__employee-link">
              <Link to={employeeLink.path}>View {employeeLink.label} in employee portal →</Link>
            </p>
          )}
        </div>
        <div className="glassbox-theater__status">
          {running && <span className="glassbox-theater__live">● Live</span>}
          {!running && replay && scenarioLabel && (
            <span className="glassbox-theater__pill" title={`Eval fixture ${replay}`}>
              Recorded demo · {scenarioLabel.shortTitle}
            </span>
          )}
          {!running && !replay && turns.length === 0 && (
            <span className="glassbox-theater__pill glassbox-theater__pill--idle">Awaiting run</span>
          )}
          {result && !running && (
            <span className={`glassbox-theater__outcome glassbox-theater__outcome--${result.outcome}`}>
              {result.outcome}
              {formatRoutingLabel(result.routing_decision, result.outcome)
                ? ` · ${formatRoutingLabel(result.routing_decision, result.outcome)}`
                : ''}
            </span>
          )}
        </div>
      </header>

      <div className="glassbox-theater__body">
        <aside className="glassbox-theater__roster" aria-label="Agent stances">
          <p className="glassbox-theater__roster-label">Specialists</p>
          <ul className="glassbox-theater__roster-list">
            {BOARDROOM_AGENT_ORDER.map((agentId) => {
              const turn = stances.get(agentId);
              const stance = turn?.stance;
              const label = BOARDROOM_AGENT_SHORT[agentId] ?? agentId;
              return (
                <li
                  key={agentId}
                  className={[
                    'glassbox-theater__agent',
                    stance ? `glassbox-theater__agent--${stance}` : '',
                    running && !turn ? 'glassbox-theater__agent--waiting' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className="glassbox-theater__agent-name">{label}</span>
                  <span className="glassbox-theater__agent-stance">
                    {stance ? (STANCE_LABELS[stance] ?? stance) : hasActivity ? '…' : '—'}
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="glassbox-theater__transcript">
          <BoardroomStageTranscript turns={turns} running={running} variant="theater" />
        </div>
      </div>
    </section>
  );
}
