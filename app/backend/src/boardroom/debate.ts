/**
 * Debate orchestration (boardroom protocol v2).
 *
 * Replaces the fixed one-turn-per-lane schedule with:
 *   opening → lane turns → optional rebuttal beats → final positions (all agents)
 *
 * Rebuttal triggers are deterministic (not LLM-decided). The compiler still reads
 * only demands/concessions from the full transcript.
 */
import type { AgentId, BoardroomEnvelope, DebateBeat } from '@trustflow/shared';

export const MAX_TURNS = 15;
export const FINAL_ROUND = 5;

const BLOCKING_STANCES = new Set(['reject', 'conditional_reject']);

/** Lane order after the Runner opening. Works Council skipped for non-DE. */
export function laneAgents(entityCountry: string): AgentId[] {
  const lanes: AgentId[] = ['procurement', 'corporate_compliance'];
  if (entityCountry === 'DE') lanes.push('works_council');
  lanes.push('it_infra');
  return lanes;
}

/** Round 5 — every specialist states final position (Runner last). */
export function finalAgents(entityCountry: string): AgentId[] {
  return [...laneAgents(entityCountry), 'workflow_runner'];
}

export interface DebateSlot {
  round: number;
  agent: AgentId;
  beat: DebateBeat;
  /** Agent this turn primarily responds to (rebuttal beats). */
  addressing?: AgentId;
}

/** Map lane index 1–4 to protocol round numbers (works council uses round 3). */
export function laneRound(agent: AgentId, entityCountry: string): number {
  if (agent === 'procurement') return 1;
  if (agent === 'corporate_compliance') return 2;
  if (agent === 'works_council') return 3;
  if (agent === 'it_infra') return entityCountry === 'DE' ? 4 : 3;
  return FINAL_ROUND;
}

function demandValueMap(env: BoardroomEnvelope): Map<string, unknown> {
  const m = new Map<string, unknown>();
  for (const d of env.demands ?? []) m.set(d.field, d.value);
  return m;
}

/** True when two agents demanded the same field to different values. */
export function hasFieldConflict(latest: BoardroomEnvelope, prior: BoardroomEnvelope[]): boolean {
  const latestDemands = demandValueMap(latest);
  if (latestDemands.size === 0) return false;

  for (const env of prior) {
    if (env.agent === latest.agent) continue;
    for (const d of env.demands ?? []) {
      if (!latestDemands.has(d.field)) continue;
      const a = latestDemands.get(d.field);
      const b = d.value;
      if (JSON.stringify(a) !== JSON.stringify(b)) return true;
    }
  }
  return false;
}

/**
 * After a lane specialist speaks, should Runner + specialist get a rebuttal beat?
 * Skipped when the specialist passed with no demands.
 */
export function needsRebuttal(latest: BoardroomEnvelope, transcript: BoardroomEnvelope[]): boolean {
  if (latest.agent === 'workflow_runner') return false;
  if (latest.stance === 'pass' && (latest.demands ?? []).length === 0) return false;
  if (BLOCKING_STANCES.has(latest.stance)) return true;
  if ((latest.demands ?? []).some((d) => d.hard)) return true;
  if (hasFieldConflict(latest, transcript)) return true;
  return false;
}

/**
 * Build the static portion of the debate (opening + lanes + finals).
 * Rebuttal slots are inserted dynamically in round.ts after each lane turn.
 */
export function baseDebatePlan(entityCountry: string): DebateSlot[] {
  const plan: DebateSlot[] = [
    { round: 0, agent: 'workflow_runner', beat: 'opening' },
  ];

  for (const agent of laneAgents(entityCountry)) {
    plan.push({ round: laneRound(agent, entityCountry), agent, beat: 'lane' });
  }

  for (const agent of finalAgents(entityCountry)) {
    plan.push({ round: FINAL_ROUND, agent, beat: 'final' });
  }

  return plan;
}

/** Rebuttal beat: advocate responds, then lane specialist counters. */
export function rebuttalSlots(laneTurn: BoardroomEnvelope, entityCountry: string): DebateSlot[] {
  const round = laneRound(laneTurn.agent as AgentId, entityCountry);
  return [
    {
      round,
      agent: 'workflow_runner',
      beat: 'rebuttal',
      addressing: laneTurn.agent as AgentId,
    },
    {
      round,
      agent: laneTurn.agent as AgentId,
      beat: 'rebuttal',
      addressing: 'workflow_runner',
    },
  ];
}

/** True when live debate hit MAX_TURNS before every agent gave a final position. */
export function debateExhausted(transcript: BoardroomEnvelope[], entityCountry: string): boolean {
  if (transcript.length < MAX_TURNS) return false;

  const finals = finalAgents(entityCountry);
  const finalBeats = transcript.filter((t) => t.beat === 'final');
  if (finalBeats.length === 0) {
    // Legacy golden replay — no beat tags; compiler outcome stands.
    return false;
  }

  const spoken = new Set(finalBeats.map((t) => t.agent));
  return finals.some((agent) => !spoken.has(agent));
}
