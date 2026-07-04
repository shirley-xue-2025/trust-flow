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
 * If the transcript never reaches a terminal decision within MAX_ROUNDS, the
 * session is forced to PENDING_HUMAN.
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
import { MAX_ROUNDS, runRounds } from './round.js';

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
function highestRound(transcript: BoardroomEnvelope[]): number {
  return transcript.reduce((m, e) => Math.max(m, e.round), 0);
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

  // Force PENDING_HUMAN if the debate ran past the cap without a clean terminal
  // decision (i.e. compiler returned APPROVED but rounds exceeded the limit
  // without consensus). Here the compiler's outcome is authoritative unless the
  // transcript blew past MAX_ROUNDS.
  if (highestRound(session.transcript) >= MAX_ROUNDS) {
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

  // Persist the compiled artifact (always — see module doc).
  writePolicy(result.policy, result.policy_version_hash, {
    activation_status: 'draft',
    request_id: opts.requestId ?? session.request.request_id,
  });
  session.state = 'COMPILED';

  return session;
}
