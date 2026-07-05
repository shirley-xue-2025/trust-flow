import type { BoardroomEnvelope } from '@trustflow/shared';

/** Display order for the five boardroom specialists (left → right on stage). */
export const BOARDROOM_AGENT_ORDER = [
  'corporate_compliance',
  'procurement',
  'it_infra',
  'works_council',
  'workflow_runner',
] as const;

export const BOARDROOM_AGENT_SHORT: Record<string, string> = {
  corporate_compliance: 'Compliance',
  procurement: 'Procurement',
  it_infra: 'IT & Infra',
  works_council: 'Works Council (DE labor law)',
  workflow_runner: 'Runner',
};

export function latestStancesByAgent(turns: BoardroomEnvelope[]): Map<string, BoardroomEnvelope> {
  const map = new Map<string, BoardroomEnvelope>();
  for (const t of turns) {
    map.set(t.agent, t);
  }
  return map;
}
