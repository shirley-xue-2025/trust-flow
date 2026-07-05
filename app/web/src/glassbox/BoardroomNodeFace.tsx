import type { BoardroomEnvelope } from '@trustflow/shared';
import type { BoardroomResult } from '../api.js';
import { STANCE_LABELS } from '../lib/agentLabels.js';
import {
  BOARDROOM_AGENT_ORDER,
  BOARDROOM_AGENT_SHORT,
  latestStancesByAgent,
} from './boardroomRoster.js';

export function BoardroomNodeFace({
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
    <div className="boardroom-node-face">
      <div className="boardroom-node-face__head">
        <div className="boardroom-node-face__titles">
          <span className="boardroom-node-face__eyebrow">Track 3 · Agent Society</span>
          <span className="boardroom-node-face__title">Agent boardroom</span>
          <span className="boardroom-node-face__subtitle">
            Five Qwen specialists negotiate in structured rounds — proposals only; compiler signs.
          </span>
        </div>
        <div className="boardroom-node-face__status">
          {running && <span className="boardroom-node-face__live">● Live</span>}
          {!running && replay && <span className="boardroom-node-face__pill">Replay {replay}</span>}
          {!running && !replay && turns.length === 0 && (
            <span className="boardroom-node-face__pill boardroom-node-face__pill--idle">Awaiting run</span>
          )}
          {result && !running && (
            <span className={`boardroom-node-face__outcome boardroom-node-face__outcome--${result.outcome}`}>
              {result.outcome}
            </span>
          )}
        </div>
      </div>

      <ul className="boardroom-node-face__roster" aria-label="Boardroom agents">
        {BOARDROOM_AGENT_ORDER.map((agentId) => {
          const turn = stances.get(agentId);
          const stance = turn?.stance;
          const label = BOARDROOM_AGENT_SHORT[agentId] ?? agentId;
          return (
            <li
              key={agentId}
              className={[
                'boardroom-node-face__agent',
                stance ? `boardroom-node-face__agent--${stance}` : '',
                running && !turn ? 'boardroom-node-face__agent--waiting' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="boardroom-node-face__agent-name">{label}</span>
              <span className="boardroom-node-face__agent-stance">
                {stance ? (STANCE_LABELS[stance] ?? stance) : hasActivity ? '…' : '—'}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="boardroom-node-face__foot">
        {running && <span>Streaming turn {turns.length || 1}…</span>}
        {!running && turns.length > 0 && (
          <span>
            {turns.length} rounds
            {result?.routing_decision ? ` · route ${result.routing_decision}` : ''}
          </span>
        )}
        {!running && turns.length === 0 && <span>Click Run or pick S04 to watch negotiation</span>}
      </div>
    </div>
  );
}
