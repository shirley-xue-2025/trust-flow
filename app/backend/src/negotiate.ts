/**
 * Tuning CLI — runs a FULL live boardroom negotiation for one scenario and
 * prints the transcript, so we can iterate on agent prompts without clicking the
 * UI. Requires DASHSCOPE_API_KEY (loaded from .env via env.ts). This is a dev
 * harness, separate from the keyless test suite.
 *
 *   npm run negotiate            # defaults to S04
 *   npm run negotiate -- S02     # any scenario id S01–S05
 */
import './env.js'; // load .env before anything reads process.env
import type { BoardroomEnvelope } from '@trustflow/shared';
import { runRounds } from './boardroom/round.js';
import { compile } from './compiler/compile.js';
import { ORG, getScenario } from './fixtures/index.js';
import { hasApiKey, QWEN_MODEL } from './qwen/client.js';

async function main() {
  if (!hasApiKey()) {
    console.error('DASHSCOPE_API_KEY not set. Add it to a .env at the repo root, then re-run.');
    process.exit(1);
  }
  const id = process.argv[2] ?? 'S04';
  const scenario = getScenario(id);
  if (!scenario) {
    console.error(`Unknown scenario "${id}". Try S01–S05.`);
    process.exit(1);
  }

  console.log(`\nLive negotiation · ${QWEN_MODEL} · scenario ${id} — ${scenario.name}\n`);
  const transcript: BoardroomEnvelope[] = [];
  for await (const env of runRounds({
    session_id: `cli_${id}`,
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
  const result = compile(transcript, scenario.request, ORG, { session_id: `cli_${id}` });
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
}

main().catch((err) => {
  console.error('Negotiation failed:', err);
  process.exit(1);
});
