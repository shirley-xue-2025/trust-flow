/**
 * Round engine (LAYER B). Drives rounds 0–5 per boardroom_protocol.md:
 *
 *   0 Runner · 1 Procurement · 2 Compliance · 3 Works Council (skip if !DE)
 *   4 IT Infra · 5 All (final sign-off / deadlock)
 *
 * Agents may "pass". Max 6 rounds; if still unresolved, the session forces
 * PENDING_HUMAN (handled in session.ts). Yields one envelope per agent turn so
 * the server can stream them over SSE.
 *
 * Two sources, same envelope shape:
 *   - REPLAY: yield validated envelopes from a golden transcript.
 *   - LIVE:   call qwen-max per agent turn (only when DASHSCOPE_API_KEY is set).
 */
import type { AgentId, BoardroomEnvelope, OrgConfig, RequestPacket } from '@trustflow/shared';
import {
  AgentPromptContext,
  buildSystemPrompt,
  buildUserPrompt,
} from './agents/index.js';
import { loadGolden } from './golden.js';
import { hasApiKey, qwenAgentTurn } from '../qwen/client.js';
import { approvedTools } from '../fixtures/index.js';

/** Round → agents that speak (Works Council skipped for non-DE entities). */
function roundSchedule(entityCountry: string): { round: number; agents: AgentId[] }[] {
  const isDe = entityCountry === 'DE';
  return [
    { round: 0, agents: ['workflow_runner'] },
    { round: 1, agents: ['procurement'] },
    { round: 2, agents: ['corporate_compliance'] },
    ...(isDe ? [{ round: 3, agents: ['works_council' as AgentId] }] : []),
    { round: 4, agents: ['it_infra'] },
    { round: 5, agents: ['workflow_runner'] },
  ];
}

export interface RoundEngineOpts {
  session_id: string;
  request: RequestPacket;
  org: OrgConfig;
  /** When set, replay this golden transcript instead of calling Qwen. */
  replayScenarioId?: string;
}

/** Async generator of envelopes — one per agent turn. */
export async function* runRounds(opts: RoundEngineOpts): AsyncGenerator<BoardroomEnvelope> {
  const { session_id, request, org, replayScenarioId } = opts;

  // --- Replay path (default for tests/demo fallback) ------------------------
  if (replayScenarioId) {
    const transcript = loadGolden(replayScenarioId);
    for (const env of transcript) {
      yield { ...env, session_id };
    }
    return;
  }

  // --- Live path (only with an API key) -------------------------------------
  if (!hasApiKey()) {
    throw new Error(
      'Live boardroom requires DASHSCOPE_API_KEY. Use replay mode (?replay=S0X) for the keyless path.',
    );
  }

  const ctx: AgentPromptContext = {
    org,
    request,
    tool: approvedTools().find((t) => t.tool_id === request.tool_id),
    approvedTools: approvedTools(),
  };

  // Accumulate the transcript so each agent negotiates against prior turns
  // instead of emitting an isolated monologue (see buildUserPrompt threading).
  const transcript: BoardroomEnvelope[] = [];
  for (const { round, agents } of roundSchedule(request.entity_country ?? org.entity_country)) {
    for (const agent of agents) {
      const env = await qwenAgentTurn({
        systemPrompt: buildSystemPrompt(agent, ctx),
        userPrompt: buildUserPrompt(agent, round, transcript),
        session_id,
        round,
        agent,
      });
      transcript.push(env);
      yield env;
    }
  }
}

export const MAX_ROUNDS = 6;
