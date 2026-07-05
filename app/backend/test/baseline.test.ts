import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Committed Track 3 baseline evidence — no network. */
describe('S05 single-agent vs boardroom baseline artifact', () => {
  const path = join(__dirname, '..', '..', '..', 'docs', 'hackathon', 'baseline', 'S05_comparison.json');
  const artifact = JSON.parse(readFileSync(path, 'utf8')) as {
    scenario_id: string;
    track3_verdict: {
      single_would_clear_vendor_gate: boolean;
      boardroom_blocks_unsigned_dpa: boolean;
      measurable_improvement: boolean;
    };
    multi_agent_boardroom: { outcome: string; deny_code: string | null };
    single_agent: { stance: string };
  };

  it('artifact is S05 with boardroom DENIED on unsigned DPA', () => {
    expect(artifact.scenario_id).toBe('S05');
    expect(artifact.multi_agent_boardroom.outcome).toBe('DENIED');
    expect(artifact.multi_agent_boardroom.deny_code).toBe('VENDOR_DPA_PENDING');
  });

  it('shows measurable improvement vs monolith (quality axis)', () => {
    expect(artifact.track3_verdict.boardroom_blocks_unsigned_dpa).toBe(true);
    expect(artifact.track3_verdict.single_would_clear_vendor_gate).toBe(true);
    expect(artifact.track3_verdict.measurable_improvement).toBe(true);
    expect(['approve', 'conditional_approve']).toContain(artifact.single_agent.stance);
  });
});
