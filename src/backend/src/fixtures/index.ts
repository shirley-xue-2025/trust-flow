/**
 * Seed fixtures loaded at runtime (org config, tool registry, eval scenarios).
 * These are copies of docs/fixtures/*.seed.json; S01–S05 outcomes are
 * non-negotiable and asserted by the test suite.
 */
import orgConfig from './org_config.seed.json' with { type: 'json' };
import toolRegistry from './tool_registry.seed.json' with { type: 'json' };
import evalScenarios from './eval_scenarios.seed.json' with { type: 'json' };
import type { EvalScenario, OrgConfig, ToolRegistry } from '@trustflow/shared';

export const ORG: OrgConfig = orgConfig as OrgConfig;
export const REGISTRY: ToolRegistry = toolRegistry as ToolRegistry;
export const SCENARIOS: EvalScenario[] = evalScenarios as EvalScenario[];

export function getScenario(id: string): EvalScenario | undefined {
  return SCENARIOS.find((s) => s.scenario_id === id);
}

export function approvedTools(): ToolRegistry['tools'] {
  // "Approved" for the boardroom = registered tools (the boardroom decides DPA/BR).
  return REGISTRY.tools;
}
