/**
 * Boardroom session (LAYER B orchestration).
 *
 * State machine (boardroom_protocol.md):
 *   OPEN → NEGOTIATING → { APPROVED | DENIED | PENDING_HUMAN | PENDING_EXTERNAL } → COMPILED
 *
 * The session collects validated envelopes from the round engine, then hands the
 * full transcript to the DETERMINISTIC compiler. The compiler — not the LLM —
 * decides the outcome and produces the hashed policy artifact. The policy is
 * always compiled (even for DENIED/PENDING) so the UI can show what the gateway
 * would enforce once gates clear; deny_overrides keep it blocking meanwhile.
 *
 * If the debate exhausts the turn budget before all agents give final positions,
 * the session is forced to PENDING_HUMAN.
 */
import { randomUUID } from 'node:crypto';
import type {
  BoardroomEnvelope,
  OrgConfig,
  PolicyArtifact,
  RequestPacket,
  SessionOutcome,
  SessionState,
} from '@trustflow/shared';
import { compile, type CompileResult } from '../compiler/compile.js';
import { writePolicy } from '../store/index.js';
import { debateExhausted } from './debate.js';
import { runRounds } from './round.js';

export interface BoardroomSession {
  session_id: string;
  request: RequestPacket;
  state: SessionState;
  transcript: BoardroomEnvelope[];
  outcome?: SessionOutcome;
  policy?: PolicyArtifact;
  policy_version_hash?: string;
  deny_code?: string;
  routing_decision?: string;
  local_redaction?: boolean;
  compile?: CompileResult;
}

const sessions = new Map<string, BoardroomSession>();

export function getSession(id: string): BoardroomSession | undefined {
  return sessions.get(id);
}

export function createSession(request: RequestPacket): BoardroomSession {
  const session_id = request.request_id ?? randomUUID();
  const session: BoardroomSession = {
    session_id,
    request,
    state: 'OPEN',
    transcript: [],
  };
  sessions.set(session_id, session);
  return session;
}

/** True once the session reached one of the terminal states. */
function entityCountry(session: BoardroomSession, org: OrgConfig): string {
  return session.request.entity_country ?? org.entity_country;
}

/**
 * Run the full negotiation. `onTurn` is invoked per envelope (used by the SSE
 * endpoint to stream turns live). Returns the finalized, compiled session.
 */
export async function runSession(
  session: BoardroomSession,
  org: OrgConfig,
  opts: { replayScenarioId?: string; onTurn?: (env: BoardroomEnvelope) => void; requestId?: string } = {},
): Promise<BoardroomSession> {
  session.state = 'NEGOTIATING';

  for await (const env of runRounds({
    session_id: session.session_id,
    request: session.request,
    org,
    replayScenarioId: opts.replayScenarioId,
  })) {
    session.transcript.push(env);
    opts.onTurn?.(env);
  }

  // --- Deterministic compile (the gate) -------------------------------------
  const result = compile(session.transcript, session.request, org, {
    session_id: session.session_id,
  });
  session.compile = result;

  // Force PENDING_HUMAN when the live debate hit the turn cap before finals completed.
  // Legacy golden replays (no beat tags) never trigger this path.
  const exhausted = debateExhausted(session.transcript, entityCountry(session, org));
  if (exhausted) {
    session.outcome = 'PENDING_HUMAN';
    session.state = 'PENDING_HUMAN';
  } else {
    session.outcome = result.outcome;
    session.state = result.outcome;
  }

  session.policy = result.policy;
  session.policy_version_hash = result.policy_version_hash;
  session.deny_code = result.deny_code;
  session.routing_decision = result.routing_decision;
  session.local_redaction = result.local_redaction;

  // Persist the compiled artifact (always — see module doc).
  writePolicy(result.policy, result.policy_version_hash, {
    activation_status: 'draft',
    request_id: opts.requestId ?? session.request.request_id,
  });
  session.state = 'COMPILED';

  return session;
}
