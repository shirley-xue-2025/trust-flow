/**
 * Baseline capture CLI — single-agent vs multi-agent boardroom on eval fixtures.
 *
 *   npm run baseline -- S05              # print comparison (needs DASHSCOPE_API_KEY)
 *   npm run baseline -- S05 --write      # write docs/hackathon/baseline/S05_*.json
 */
import '../env.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGolden } from '../boardroom/golden.js';
import { compile } from '../compiler/compile.js';
import { ORG, getScenario, approvedTools } from '../fixtures/index.js';
import { hasApiKey, QWEN_MODEL } from '../qwen/client.js';
import {
  recommendationFromStance,
  runSingleAgentBaseline,
} from './singleAgent.js';

const REPO_BASELINE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  '..',
  'docs',
  'hackathon',
  'baseline',
);

function parseArgs(argv: string[]): { scenarioId: string; write: boolean } {
  const flags = argv.filter((a) => a.startsWith('--'));
  const positional = argv.filter((a) => !a.startsWith('--'));
  return { scenarioId: positional[0] ?? 'S05', write: flags.includes('--write') };
}

function boardroomStanceSummary(scenarioId: string): string {
  const transcript = loadGolden(scenarioId);
  const procurement = transcript.find((e) => e.agent === 'procurement');
  const runner = transcript[transcript.length - 1];
  return [
    procurement
      ? `R${procurement.round} Procurement [${procurement.stance}]: ${procurement.natural_language}`
      : '',
    runner ? `R${runner.round} Runner [${runner.stance}]: ${runner.natural_language}` : '',
  ]
    .filter(Boolean)
    .join(' | ');
}

async function main() {
  const { scenarioId, write } = parseArgs(process.argv.slice(2));
  const scenario = getScenario(scenarioId);
  if (!scenario) {
    console.error(`Unknown scenario "${scenarioId}". Try S01–S05.`);
    process.exit(1);
  }
  if (!hasApiKey()) {
    console.error('DASHSCOPE_API_KEY not set — baseline needs a live Qwen call.');
    process.exit(1);
  }

  const tool = approvedTools().find((t) => t.tool_id === scenario.request.tool_id);
  console.log(`\nBaseline capture · ${QWEN_MODEL} · ${scenarioId} — ${scenario.name}\n`);

  const single = await runSingleAgentBaseline({
    session_id: `baseline_${scenarioId}`,
    org: ORG,
    request: scenario.request,
    tool,
  });

  const boardroomTranscript = loadGolden(scenarioId);
  const boardroom = compile(boardroomTranscript, scenario.request, ORG, {
    session_id: scenarioId,
  });

  const singleRec = recommendationFromStance(single.stance);
  const artifact = {
    captured_at: new Date().toISOString().slice(0, 10),
    model: QWEN_MODEL,
    scenario_id: scenarioId,
    scenario_name: scenario.name,
    request: scenario.request,
    single_agent: {
      api_calls: 1,
      stance: single.stance,
      recommendation: singleRec,
      natural_language: single.natural_language,
      demands: single.demands ?? [],
      concessions: single.concessions ?? [],
      envelope: single,
    },
    multi_agent_boardroom: {
      api_calls: boardroomTranscript.length,
      transcript_rounds: boardroomTranscript.length,
      outcome: boardroom.outcome,
      deny_code: boardroom.deny_code ?? null,
      routing_decision: boardroom.routing_decision,
      procurement_round1_stance: boardroomTranscript.find((e) => e.agent === 'procurement')?.stance,
      summary: boardroomStanceSummary(scenarioId),
      golden_source: `app/backend/test/golden/${scenarioId}.json`,
    },
    track3_verdict: {
      single_would_clear_vendor_gate:
        singleRec === 'APPROVE' || (single.stance === 'conditional_approve' && !single.demands?.some(
          (d) => d.field === 'gates.vendor_dpa_status' && d.hard,
        )),
      boardroom_blocks_unsigned_dpa: boardroom.outcome === 'DENIED' && boardroom.deny_code === 'VENDOR_DPA_PENDING',
      measurable_improvement:
        (singleRec === 'APPROVE' || single.stance === 'conditional_approve') &&
        boardroom.outcome === 'DENIED',
    },
  };

  console.log('── Single agent (monolith) ──');
  console.log(`  API calls: 1`);
  console.log(`  Stance: ${single.stance} → recommendation: ${singleRec}`);
  console.log(`  "${single.natural_language}"`);
  console.log();
  console.log('── Multi-agent boardroom (golden) ──');
  console.log(`  API calls: ${boardroomTranscript.length}`);
  console.log(`  Outcome: ${boardroom.outcome}${boardroom.deny_code ? ` (${boardroom.deny_code})` : ''}`);
  console.log(`  ${boardroomStanceSummary(scenarioId)}`);
  console.log();
  console.log('── Track 3 baseline ──');
  console.log(
    `  Single agent would clear unsigned DPA: ${artifact.track3_verdict.single_would_clear_vendor_gate}`,
  );
  console.log(`  Boardroom denies unsigned DPA: ${artifact.track3_verdict.boardroom_blocks_unsigned_dpa}`);
  console.log(`  Measurable improvement shown: ${artifact.track3_verdict.measurable_improvement}`);

  if (write) {
    mkdirSync(REPO_BASELINE_DIR, { recursive: true });
    const jsonPath = join(REPO_BASELINE_DIR, `${scenarioId}_comparison.json`);
    writeFileSync(jsonPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
    const singlePath = join(REPO_BASELINE_DIR, `${scenarioId}_single_agent_envelope.json`);
    writeFileSync(singlePath, `${JSON.stringify(single, null, 2)}\n`, 'utf8');
    console.log(`\nWrote ${jsonPath}`);
    console.log(`Wrote ${singlePath}`);
  }
}

main().catch((err) => {
  console.error('Baseline failed:', err);
  process.exit(1);
});
