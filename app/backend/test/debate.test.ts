/**
 * Debate orchestration — rebuttal triggers and plan shape (no LLM).
 */
import { describe, expect, it } from 'vitest';
import type { BoardroomEnvelope } from '@trustflow/shared';
import {
  baseDebatePlan,
  debateExhausted,
  finalAgents,
  hasFieldConflict,
  laneAgents,
  needsRebuttal,
  rebuttalSlots,
} from '../src/boardroom/debate.js';

function env(partial: Partial<BoardroomEnvelope> & Pick<BoardroomEnvelope, 'agent' | 'stance'>): BoardroomEnvelope {
  return {
    session_id: 't',
    round: 1,
    natural_language: 'test',
    ...partial,
  };
}

describe('debate plan', () => {
  it('DE entity includes works council in lanes and finals', () => {
    expect(laneAgents('DE')).toEqual([
      'procurement',
      'corporate_compliance',
      'works_council',
      'it_infra',
    ]);
    expect(finalAgents('DE')).toHaveLength(5);
    expect(finalAgents('DE').at(-1)).toBe('workflow_runner');
  });

  it('non-DE skips works council', () => {
    expect(laneAgents('US')).not.toContain('works_council');
    expect(baseDebatePlan('US').filter((s) => s.beat === 'final')).toHaveLength(4);
  });

  it('base plan ends with all-agent finals after opening + lanes', () => {
    const plan = baseDebatePlan('DE');
    expect(plan[0]).toMatchObject({ round: 0, beat: 'opening', agent: 'workflow_runner' });
    const finals = plan.filter((s) => s.beat === 'final');
    expect(finals.map((s) => s.agent)).toEqual(finalAgents('DE'));
  });
});

describe('rebuttal triggers', () => {
  it('fires on hard demand', () => {
    const turn = env({
      agent: 'procurement',
      stance: 'conditional_reject',
      demands: [{ field: 'gates.vendor_dpa_status', value: 'signed', hard: true }],
    });
    expect(needsRebuttal(turn, [])).toBe(true);
    expect(rebuttalSlots(turn, 'DE')).toHaveLength(2);
  });

  it('fires on reject stance', () => {
    const turn = env({ agent: 'corporate_compliance', stance: 'reject' });
    expect(needsRebuttal(turn, [])).toBe(true);
  });

  it('skips pass with no demands', () => {
    const turn = env({ agent: 'works_council', stance: 'pass', demands: [] });
    expect(needsRebuttal(turn, [])).toBe(false);
  });

  it('fires on field conflict', () => {
    const prior = env({
      agent: 'it_infra',
      stance: 'conditional_approve',
      demands: [{ field: 'routing.sensitive', value: 'LOCAL_QWEN_72B' }],
    });
    const latest = env({
      agent: 'corporate_compliance',
      stance: 'conditional_approve',
      demands: [{ field: 'routing.sensitive', value: 'CLOUD_QWEN_MAX' }],
    });
    expect(hasFieldConflict(latest, [prior])).toBe(true);
    expect(needsRebuttal(latest, [prior])).toBe(true);
  });
});

describe('debateExhausted', () => {
  it('legacy transcripts without beat tags never exhaust', () => {
    const legacy = [env({ agent: 'workflow_runner', stance: 'approve' })];
    expect(debateExhausted(legacy, 'DE')).toBe(false);
  });

  it('flags incomplete finals when turn cap hit', () => {
    const partial = finalAgents('DE')
      .slice(0, 2)
      .map((agent) => env({ agent, stance: 'approve', beat: 'final', round: 5 }));
    // Pad to MAX_TURNS
    while (partial.length < 15) {
      partial.push(env({ agent: 'workflow_runner', stance: 'approve', beat: 'lane', round: 1 }));
    }
    expect(debateExhausted(partial, 'DE')).toBe(true);
  });
});
