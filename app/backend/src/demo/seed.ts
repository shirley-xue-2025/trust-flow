/**
 * Pre-seed demo requests for judge-ready cold start (Epic A + PRD demo script).
 */
import type { OrgConfig, ToolRegistry } from '@trustflow/shared';
import { getScenario } from '../fixtures/index.js';
import { createEmployeeRequest, listEmployeeRequests, toolDisplayName } from '../employee/requests.js';
import { runEmployeeBoardroom } from '../employee/runBoardroom.js';

const DEMO_REQUESTS = [
  {
    request_id: 'demo-s04-pending-signoff',
    scenario_id: 'S04',
    justification:
      'Payments team needs Claude Code for internal SDK refactoring — payment API schemas route to EU-local model.',
  },
  {
    request_id: 'demo-s05-denied',
    scenario_id: 'S05',
    justification:
      'Engineering wants ChatGPT Enterprise for Confluence summarization — blocked pending vendor DPA.',
  },
  {
    request_id: 'demo-s02-external',
    scenario_id: 'S02',
    justification:
      'Wide Claude Code rollout — works council annex pending (procedural appeal demo).',
  },
] as const;

export async function seedDemoIfEmpty(
  org: OrgConfig,
  registry: ToolRegistry,
  demoEmployee: {
    user_id: string;
    display_name: string;
    department: string;
    role: string;
  },
): Promise<{ seeded: boolean; count: number }> {
  if (listEmployeeRequests().length > 0) {
    return { seeded: false, count: 0 };
  }

  for (const demo of DEMO_REQUESTS) {
    const scenario = getScenario(demo.scenario_id);
    if (!scenario) continue;

    const packet = {
      ...scenario.request,
      request_id: demo.request_id,
    };

    createEmployeeRequest({
      actor_id: demoEmployee.user_id,
      actor_name: demoEmployee.display_name,
      department: demoEmployee.department,
      role: demoEmployee.role,
      tool_id: packet.tool_id,
      tool_display_name: toolDisplayName(registry, packet.tool_id),
      use_case_category: packet.use_case_category,
      business_justification: demo.justification,
      packet,
    });

    await runEmployeeBoardroom(demo.request_id, org, registry, {
      replayScenarioId: demo.scenario_id,
    });
  }

  return { seeded: true, count: DEMO_REQUESTS.length };
}

/** Force re-seed (dev only) — wipes employee store by overwriting with fresh demos. */
export async function forceReseedDemo(
  org: OrgConfig,
  registry: ToolRegistry,
  demoEmployee: {
    user_id: string;
    display_name: string;
    department: string;
    role: string;
  },
): Promise<number> {
  const { writeFileSync, mkdirSync, existsSync } = await import('node:fs');
  const { dataDir } = await import('../store/index.js');
  const { join } = await import('node:path');
  const dir = dataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'employee_requests.json'), '[]');
  writeFileSync(join(dir, 'human_reviews.json'), '[]');
  writeFileSync(join(dir, 'appeals.json'), '[]');

  const result = await seedDemoIfEmpty(org, registry, demoEmployee);
  return result.count;
}
