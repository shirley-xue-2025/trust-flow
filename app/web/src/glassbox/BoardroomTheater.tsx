import type { BoardroomEnvelope } from '@trustflow/shared';
import type { BoardroomResult } from '../api.js';
import { STANCE_LABELS } from '../lib/agentLabels.js';
import { BoardroomStageTranscript } from './BoardroomStageTranscript.js';
import {
  BOARDROOM_AGENT_ORDER,
  BOARDROOM_AGENT_SHORT,
  latestStancesByAgent,
} from './boardroomRoster.js';

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

  return (
    <section className="glassbox-theater" aria-labelledby="boardroom-theater-title">
      <header className="glassbox-theater__head">
        <div>
          <p className="glassbox-theater__eyebrow">Track 3 · Agent Society</p>
          <h2 id="boardroom-theater-title" className="glassbox-theater__title">
            Agent boardroom
          </h2>
          <p className="glassbox-theater__lead">
            Five Qwen specialists negotiate in structured rounds — proposals only; compiler signs.
          </p>
          <p className="glassbox-theater__mode-hint muted">
            Replay = recorded qwen-max transcript (no API key) · Live = real negotiation (API key)
          </p>
        </div>
        <div className="glassbox-theater__status">
          {running && <span className="glassbox-theater__live">● Live</span>}
          {!running && replay && <span className="glassbox-theater__pill">Replay {replay}</span>}
          {!running && !replay && turns.length === 0 && (
            <span className="glassbox-theater__pill glassbox-theater__pill--idle">Awaiting run</span>
          )}
          {result && !running && (
            <span className={`glassbox-theater__outcome glassbox-theater__outcome--${result.outcome}`}>
              {result.outcome}
              {result.routing_decision ? ` · ${result.routing_decision}` : ''}
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
