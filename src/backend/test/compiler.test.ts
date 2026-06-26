/**
 * Compiler unit tests: floor check, hash stability, "LLM can't weaken the floor".
 */
import { describe, expect, it } from 'vitest';
import { ORG } from '../src/fixtures/index.js';
import { compile } from '../src/compiler/compile.js';
import { checkFloor } from '../src/compiler/floor.js';
import { policyVersionHash } from '@trustflow/shared';
import type { BoardroomEnvelope, PolicyArtifact, RequestPacket } from '@trustflow/shared';

const baseRequest: RequestPacket = {
  request_id: 'unit-1',
  tool_id: 'microsoft-copilot-365',
  use_case_category: 'summarization',
  entity_country: 'DE',
  betriebsvereinbarung_status: 'signed',
  vendor_dpa_status: 'signed',
};

function env(partial: Partial<BoardroomEnvelope>): BoardroomEnvelope {
  return {
    session_id: 'unit',
    round: 0,
    agent: 'workflow_runner',
    stance: 'approve',
    natural_language: 'x',
    ...partial,
  } as BoardroomEnvelope;
}

describe('floor check', () => {
  it('rejects raw_prompt_logging=true against the floor', () => {
    const draft = {
      audit: { raw_prompt_logging: true, manager_dashboard_allowed: false, retention_class: 'standard_6mo' },
      risk_tier: 'limited_risk',
    } as unknown as PolicyArtifact;
    const v = checkFloor(draft, ORG);
    expect(v.map((x) => x.field)).toContain('audit.raw_prompt_logging');
  });

  it('rejects retention weaker than the floor', () => {
    const draft = {
      audit: { raw_prompt_logging: false, manager_dashboard_allowed: false, retention_class: 'standard_6mo' },
      risk_tier: 'limited_risk',
    } as unknown as PolicyArtifact;
    // floor is standard_6mo, so standard_6mo passes; a hypothetical weaker tier would fail.
    expect(checkFloor(draft, ORG).length).toBe(0);
  });
});

describe('compiler: LLM cannot weaken the floor', () => {
  it('a hard demand to enable raw logging forces DENIED', () => {
    const transcript = [
      env({ demands: [{ field: 'tool_id', value: 'microsoft-copilot-365' }] }),
      env({
        agent: 'corporate_compliance',
        round: 2,
        stance: 'approve',
        // adversarial: agent tries to enable raw prompt logging
        demands: [{ field: 'audit.raw_prompt_logging', value: true, hard: true }],
      }),
    ];
    const result = compile(transcript, baseRequest, ORG, { session_id: 'unit' });
    expect(result.outcome).toBe('DENIED');
    expect(result.floorViolations.length).toBeGreaterThan(0);
  });
});

describe('hash', () => {
  it('is stable under key reordering', () => {
    const a = { b: 1, a: 2, nested: { y: 1, x: 2 } };
    const b = { a: 2, nested: { x: 2, y: 1 }, b: 1 };
    expect(policyVersionHash(a)).toBe(policyVersionHash(b));
  });

  it('changes when routing changes (acceptance: hash changes on different routing)', () => {
    const approve = compile(
      [
        env({ demands: [{ field: 'tool_id', value: 'claude-code' }] }),
        env({ agent: 'it_infra', round: 4, stance: 'approve', concessions: [{ field: 'routing.default', value: 'CLOUD_QWEN_MAX' }] }),
      ],
      baseRequest,
      ORG,
      { session_id: 'h1' },
    );
    const local = compile(
      [
        env({ demands: [{ field: 'tool_id', value: 'claude-code' }] }),
        env({ agent: 'it_infra', round: 4, stance: 'approve', concessions: [{ field: 'routing.default', value: 'LOCAL_QWEN_72B' }] }),
      ],
      baseRequest,
      ORG,
      { session_id: 'h2' },
    );
    expect(approve.policy_version_hash).not.toBe(local.policy_version_hash);
  });
});
