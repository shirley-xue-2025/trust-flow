/**
 * Envelope + golden transcript validation: every golden envelope parses, and
 * malformed envelopes are rejected. This is the guard that lets the compiler
 * trust its input regardless of whether it came from Qwen or a transcript.
 */
import { describe, expect, it } from 'vitest';
import { envelopeSchema, parseEnvelope } from '../src/boardroom/envelope.js';
import { loadGolden } from '../src/boardroom/golden.js';
import { SCENARIOS } from '../src/fixtures/index.js';

describe('boardroom envelope schema', () => {
  it('accepts a minimal valid envelope', () => {
    const ok = envelopeSchema.safeParse({
      session_id: 's',
      round: 0,
      agent: 'workflow_runner',
      stance: 'approve',
      natural_language: 'hi',
    });
    expect(ok.success).toBe(true);
  });

  it('rejects an unknown agent', () => {
    const bad = envelopeSchema.safeParse({
      session_id: 's',
      round: 0,
      agent: 'ceo',
      stance: 'approve',
      natural_language: 'hi',
    });
    expect(bad.success).toBe(false);
  });

  it('patches session_id/round/agent', () => {
    const env = parseEnvelope(
      { stance: 'pass', natural_language: 'x', session_id: 'a', round: 0, agent: 'it_infra' },
      { session_id: 'b', round: 3 },
    );
    expect(env.session_id).toBe('b');
    expect(env.round).toBe(3);
  });

  it('all golden transcripts parse', () => {
    for (const s of SCENARIOS) {
      const t = loadGolden(s.scenario_id);
      expect(t.length).toBeGreaterThan(0);
      for (const e of t) expect(e.session_id).toBeTruthy();
    }
  });
});
