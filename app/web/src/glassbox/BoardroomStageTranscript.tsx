import { useEffect, useRef } from 'react';
import type { BoardroomEnvelope } from '@trustflow/shared';
import { AGENT_LABELS, STANCE_LABELS } from '../lib/agentLabels.js';

export function BoardroomStageTranscript({
  turns,
  running,
  variant = 'embedded',
}: {
  turns: BoardroomEnvelope[];
  running: boolean;
  variant?: 'embedded' | 'theater';
}) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns.length, running]);

  if (turns.length === 0 && !running) {
    return (
      <div
        className={[
          'boardroom-stage-transcript',
          'boardroom-stage-transcript--empty',
          variant === 'theater' ? 'boardroom-stage-transcript--theater' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        Negotiation transcript appears here — pick S04 or click Run boardroom.
      </div>
    );
  }

  return (
    <div
      className={[
        'boardroom-stage-transcript',
        variant === 'theater' ? 'boardroom-stage-transcript--theater' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-live="polite"
    >
      {variant !== 'theater' && <div className="boardroom-stage-transcript__label">Live negotiation</div>}
      <ol className="boardroom-stage-transcript__list" ref={listRef}>
        {turns.map((t, i) => (
          <li
            key={`${t.round}-${t.agent}-${i}`}
            className={`boardroom-stage-transcript__turn boardroom-stage-transcript__turn--${t.stance}`}
          >
            <div className="boardroom-stage-transcript__meta">
              <span className="boardroom-stage-transcript__round">Round {t.round}</span>
              <span className="boardroom-stage-transcript__agent">{AGENT_LABELS[t.agent] ?? t.agent}</span>
              <span className="boardroom-stage-transcript__stance">{STANCE_LABELS[t.stance] ?? t.stance}</span>
            </div>
            <p className="boardroom-stage-transcript__text">{t.natural_language}</p>
          </li>
        ))}
        {running && (
          <li className="boardroom-stage-transcript__turn boardroom-stage-transcript__turn--waiting">
            <span className="boardroom-stage-transcript__meta">Next specialist…</span>
          </li>
        )}
      </ol>
    </div>
  );
}
