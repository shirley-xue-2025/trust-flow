/**
 * S01–S05 end-to-end via golden transcripts (NO network, NO key).
 *
 * The locked outcomes in eval_scenarios.seed.json are a hard pass/fail. Each
 * scenario is replayed through the deterministic compiler; outcomes, deny codes,
 * routing, schema validity, and the policy hash are asserted.
 */
import { describe, expect, it } from 'vitest';
import { SCENARIOS, ORG } from '../src/fixtures/index.js';
import { loadGolden } from '../src/boardroom/golden.js';
import { compile } from '../src/compiler/compile.js';

describe('S01–S05 scenarios (golden transcript replay)', () => {
  for (const scenario of SCENARIOS) {
    it(`${scenario.scenario_id} → ${scenario.expected_session_outcome}`, () => {
      const transcript = loadGolden(scenario.scenario_id);
      const result = compile(transcript, scenario.request, ORG, {
        session_id: scenario.scenario_id,
      });

      // Session outcome is non-negotiable.
      expect(result.outcome).toBe(scenario.expected_session_outcome);

      // Deny code where the scenario specifies one.
      if (scenario.expected_deny_code) {
        expect(result.deny_code).toBe(scenario.expected_deny_code);
      }

      // Routing where the scenario specifies one (S04 → LOCAL_QWEN_72B).
      if (scenario.expected_routing) {
        expect(result.routing_decision).toBe(scenario.expected_routing);
      }

      // The compiled artifact must always be schema-valid.
      expect(result.schemaValid, result.schemaErrors?.join('; ')).toBe(true);

      // And it must carry a deterministic hash.
      expect(result.policy_version_hash).toMatch(/^[a-f0-9]{64}$/);
    });
  }

  it('S04 sets the sovereign sensitive route', () => {
    const s = SCENARIOS.find((x) => x.scenario_id === 'S04')!;
    const result = compile(loadGolden('S04'), s.request, ORG, { session_id: 'S04' });
    expect(result.policy.routing.sensitive).toBe('LOCAL_QWEN_72B');
    expect(result.routing_decision).toBe('LOCAL_QWEN_72B');
  });

  it('S02 carries a BETRIEBSVEREINBARUNG_PENDING deny override', () => {
    const s = SCENARIOS.find((x) => x.scenario_id === 'S02')!;
    const result = compile(loadGolden('S02'), s.request, ORG, { session_id: 'S02' });
    expect(result.policy.deny_overrides).toContain('BETRIEBSVEREINBARUNG_PENDING');
  });
});
