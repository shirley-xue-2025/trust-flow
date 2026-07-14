/**
 * Round engine (LAYER B). Drives boardroom protocol v2:
 *
 *   opening → lane specialists → optional rebuttal beats → all-agent finals
 *
 * Rebuttal beats fire on hard vetoes, blocking stances, or field conflicts.
 * Max MAX_TURNS (15) envelopes; budget exhaustion → PENDING_HUMAN in session.ts.
 *
 * Two sources, same envelope shape:
 *   - REPLAY: yield validated envelopes from a golden transcript.
 *   - LIVE:   call qwen-max per slot (only when DASHSCOPE_API_KEY is set).
 */
import type { AgentId, BoardroomEnvelope, DebateBeat, OrgConfig, RequestPacket } from '@trustflow/shared';
import {
  AgentPromptContext,
  buildSystemPrompt,
  buildUserPrompt,
} from './agents/index.js';
import {
  baseDebatePlan,
  MAX_TURNS,
  needsRebuttal,
  rebuttalSlots,
  type DebateSlot,
} from './debate.js';
import { loadGolden } from './golden.js';
import { hasApiKey, qwenAgentTurn } from '../qwen/client.js';
import { approvedTools } from '../fixtures/index.js';

export interface RoundEngineOpts {
  session_id: string;
  request: RequestPacket;
  org: OrgConfig;
  /** When set, replay this golden transcript instead of calling Qwen. */
  replayScenarioId?: string;
}

interface LiveTurnOpts {
  session_id: string;
  round: number;
  agent: AgentId;
  beat: DebateBeat;
  addressing?: AgentId;
  transcript: BoardroomEnvelope[];
  ctx: AgentPromptContext;
}

async function liveTurn(opts: LiveTurnOpts): Promise<BoardroomEnvelope> {
  const env = await qwenAgentTurn({
    systemPrompt: buildSystemPrompt(opts.agent, opts.ctx),
    userPrompt: buildUserPrompt(opts.agent, opts.round, opts.transcript, {
      beat: opts.beat,
      addressing: opts.addressing,
    }),
    session_id: opts.session_id,
    round: opts.round,
    agent: opts.agent,
  });
  return {
    ...env,
    beat: opts.beat,
    addressing: opts.addressing,
  };
}

/** Async generator of envelopes — one per agent turn. */
export async function* runRounds(opts: RoundEngineOpts): AsyncGenerator<BoardroomEnvelope> {
  const { session_id, request, org, replayScenarioId } = opts;
  const entityCountry = request.entity_country ?? org.entity_country;

  // --- Replay path (default for tests/demo fallback) ------------------------
  if (replayScenarioId) {
    const transcript = loadGolden(replayScenarioId);
    for (const env of transcript) {
      await replayTurnDelay();
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

  const transcript: BoardroomEnvelope[] = [];
  let turnCount = 0;

  async function* speak(slot: DebateSlot): AsyncGenerator<BoardroomEnvelope> {
    if (turnCount >= MAX_TURNS) return;
    const env = await liveTurn({
      session_id,
      round: slot.round,
      agent: slot.agent,
      beat: slot.beat,
      addressing: slot.addressing,
      transcript,
      ctx,
    });
    transcript.push(env);
    turnCount += 1;
    yield env;
  }

  const plan = baseDebatePlan(entityCountry);
  let planIndex = 0;

  while (planIndex < plan.length && turnCount < MAX_TURNS) {
    const slot = plan[planIndex]!;
    planIndex += 1;

    let laneTurn: BoardroomEnvelope | undefined;
    for await (const env of speak(slot)) {
      laneTurn = env;
      yield env;
    }

    // After a lane specialist, optionally insert a rebuttal beat before continuing.
    if (slot.beat === 'lane' && laneTurn && needsRebuttal(laneTurn, transcript) && turnCount < MAX_TURNS) {
      for (const rebuttal of rebuttalSlots(laneTurn, entityCountry)) {
        if (turnCount >= MAX_TURNS) break;
        for await (const env of speak(rebuttal)) {
          yield env;
        }
      }
    }
  }
}

export { MAX_TURNS } from './debate.js';

// Replay is instant (reading a JSON fixture), which reads as fake on camera.
// REPLAY_TURN_DELAY_MS paces it like a real negotiation; unset/0 in tests.
function replayTurnDelay(): Promise<void> {
  const ms = Number(process.env.REPLAY_TURN_DELAY_MS ?? 0);
  if (!ms) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
