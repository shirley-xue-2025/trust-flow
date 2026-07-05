/**
 * Tuning CLI — runs a FULL live boardroom negotiation for one scenario and
 * prints the transcript, so we can iterate on agent prompts without clicking the
 * UI. Requires DASHSCOPE_API_KEY (loaded from .env via env.ts). This is a dev
 * harness, separate from the keyless test suite.
 *
 *   npm run negotiate            # defaults to S04
 *   npm run negotiate -- S02     # any scenario id S01–S05
 *   npm run capture:golden -- S04   # live run → test/golden/S04.json
 */
import './env.js'; // load .env before anything reads process.env
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BoardroomEnvelope } from '@trustflow/shared';
import { runRounds } from './boardroom/round.js';
import { goldenDir } from './boardroom/golden.js';
import { compile } from './compiler/compile.js';
import { ORG, getScenario } from './fixtures/index.js';
import { hasApiKey, QWEN_MODEL } from './qwen/client.js';

function parseArgs(argv: string[]): { scenarioId: string; writeGolden: boolean } {
  const flags = argv.filter((a) => a.startsWith('--'));
  const positional = argv.filter((a) => !a.startsWith('--'));
  return {
    scenarioId: positional[0] ?? 'S04',
    writeGolden: flags.includes('--write-golden'),
  };
}

/** Strip volatile session ids so replay fixtures stay scenario-scoped. */
function toGoldenTranscript(scenarioId: string, transcript: BoardroomEnvelope[]): BoardroomEnvelope[] {
  return transcript.map((env) => ({ ...env, session_id: scenarioId }));
}

async function main() {
  if (!hasApiKey()) {
    console.error('DASHSCOPE_API_KEY not set. Add it to a .env at the repo root, then re-run.');
    process.exit(1);
  }
  const { scenarioId: id, writeGolden } = parseArgs(process.argv.slice(2));
  const scenario = getScenario(id);
  if (!scenario) {
    console.error(`Unknown scenario "${id}". Try S01–S05.`);
    process.exit(1);
  }

  console.log(`\nLive negotiation · ${QWEN_MODEL} · scenario ${id} — ${scenario.name}\n`);
  const transcript: BoardroomEnvelope[] = [];
  for await (const env of runRounds({
    session_id: id,
    request: scenario.request,
    org: ORG,
  })) {
    transcript.push(env);
    const demands = (env.demands ?? [])
      .map((d) => `${d.field}=${String(d.value)}${d.hard ? ' (hard)' : ''}`)
      .join(', ');
    const concessions = (env.concessions ?? [])
      .map((c) => `${c.field}=${String(c.value)}`)
      .join(', ');
    console.log(`R${env.round} · ${env.agent} · [${env.stance}]`);
    console.log(`  ${env.natural_language}`);
    if (demands) console.log(`  demands: ${demands}`);
    if (concessions) console.log(`  concessions: ${concessions}`);
    console.log();
  }

  // Run the deterministic compiler over the live transcript — the same gate the
  // server uses. Proves the hardened compiler stays schema-valid on live output.
  const result = compile(transcript, scenario.request, ORG, { session_id: id });
  console.log('─'.repeat(60));
  console.log(`OUTCOME: ${result.outcome}${result.deny_code ? ` (${result.deny_code})` : ''}`);
  console.log(`routing: ${result.routing_decision}`);
  console.log(`schema valid: ${result.schemaValid}${
    result.schemaValid ? '' : ` — ${(result.schemaErrors ?? []).join('; ')}`
  }`);
  console.log(`floor violations: ${result.floorViolations.length}`);
  console.log(`policy_version_hash: ${result.policy_version_hash}`);
  console.log(`expected: ${scenario.expected_session_outcome}${
    scenario.expected_deny_code ? ` (${scenario.expected_deny_code})` : ''
  }`);

  if (writeGolden) {
    if (result.outcome !== scenario.expected_session_outcome) {
      console.error(
        `\nRefusing to write golden: outcome ${result.outcome} ≠ expected ${scenario.expected_session_outcome}.`,
      );
      process.exit(1);
    }
    const golden = toGoldenTranscript(id, transcript);
    const path = join(goldenDir(), `${id}.json`);
    writeFileSync(path, `${JSON.stringify(golden, null, 2)}\n`, 'utf8');
    console.log(`\nWrote golden transcript (${golden.length} turns) → ${path}`);
    console.log(`Source: live ${QWEN_MODEL} run on ${new Date().toISOString().slice(0, 10)}`);
  }
}

main().catch((err) => {
  console.error('Negotiation failed:', err);
  process.exit(1);
});
