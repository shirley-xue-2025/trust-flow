/**
 * Policy store activation (demo-critical): a later draft compile — e.g. a
 * glassbox replay reload — overwrites the `<policyId>.json` latest pointer,
 * but the gateway must keep enforcing the version humans signed.
 */
import { describe, expect, it } from 'vitest';
import { ORG, getScenario } from '../src/fixtures/index.js';
import { loadGolden } from '../src/boardroom/golden.js';
import { compile } from '../src/compiler/compile.js';
import {
  activatePolicy,
  readActivePolicy,
  readPolicyById,
  writePolicy,
} from '../src/store/index.js';

function compiledS04() {
  const s = getScenario('S04')!;
  return compile(loadGolden('S04'), s.request, ORG, { session_id: 'S04' });
}

describe('readActivePolicy', () => {
  it('returns the signed version after a draft recompile clobbers the latest pointer', () => {
    const first = compiledS04();
    const policyId = first.policy.policy_id;
    writePolicy(first.policy, first.policy_version_hash);
    activatePolicy(policyId, ['dpo_1', 'it_1'], first.policy_version_hash);

    // Replay reload compiles again → same policy_id, new session → draft latest.
    const second = compiledS04();
    writePolicy(second.policy, `${second.policy_version_hash}-resim`);

    expect(readPolicyById(policyId)?.activation_status).toBe('draft');
    const active = readActivePolicy(policyId);
    expect(active?.activation_status).toBe('active');
    expect(active?.policy_version_hash).toBe(first.policy_version_hash);
  });

  it('returns null when no version was ever activated', () => {
    expect(readActivePolicy('pol_never_signed')).toBeNull();
  });
});
