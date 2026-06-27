/**
 * Live smoke test — hits qwen-max ONCE to prove the OpenAI-compatible DashScope
 * path returns a valid boardroom envelope. Requires DASHSCOPE_API_KEY (loaded
 * from a git-ignored .env — see env.ts). This is intentionally SEPARATE from
 * `npm run test` (which is keyless + offline).
 *
 *   npm run smoke
 */
import '../env.js'; // auto-load .env before anything reads process.env
import { hasApiKey, qwenAgentTurn, QWEN_BASE_URL, QWEN_MODEL } from './client.js';
import { buildSystemPrompt, buildUserPrompt } from '../boardroom/agents/index.js';
import { ORG, REGISTRY } from '../fixtures/index.js';
import { getScenario } from '../fixtures/index.js';

async function main() {
  if (!hasApiKey()) {
    console.error('DASHSCOPE_API_KEY not set. Add it to a .env at the repo root, then re-run:');
    console.error('  npm run smoke');
    process.exit(1);
  }
  console.log(`Smoke: ${QWEN_MODEL} @ ${QWEN_BASE_URL}`);
  const scenario = getScenario('S04')!;
  const ctx = {
    org: ORG,
    request: scenario.request,
    tool: REGISTRY.tools.find((t) => t.tool_id === scenario.request.tool_id),
    approvedTools: REGISTRY.tools,
  };
  const env = await qwenAgentTurn({
    systemPrompt: buildSystemPrompt('corporate_compliance', ctx),
    userPrompt: buildUserPrompt('corporate_compliance', 2),
    session_id: 'smoke',
    round: 2,
    agent: 'corporate_compliance',
  });
  console.log('Valid envelope received:');
  console.log(JSON.stringify(env, null, 2));
}

main().catch((err) => {
  console.error('Smoke failed:', err);
  process.exit(1);
});
