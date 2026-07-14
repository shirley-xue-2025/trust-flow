/**
 * Judge-facing labels for eval scenarios — plain English first, internal IDs de-emphasized.
 * IDs (S01–S05) stay in data/API; UI shows what the scenario *means*.
 */
export interface ScenarioPresentation {
  /** Primary label — no scenario ID */
  title: string;
  /** One-line outcome or teaching point */
  subtitle: string;
  /** Short badge when space is tight */
  shortTitle: string;
}

export const SCENARIO_PRESENTATION: Record<string, ScenarioPresentation> = {
  S01: {
    title: 'Happy path — Microsoft Copilot summarization',
    subtitle: 'All gates signed · approves cleanly',
    shortTitle: 'Copilot happy path',
  },
  S02: {
    title: 'Works council agreement pending',
    subtitle: 'Wide rollout blocked until formal agreement is signed',
    shortTitle: 'Works council gate',
  },
  S03: {
    title: 'HR screening — high risk denied',
    subtitle: 'EU AI Act Annex III · cannot approve',
    shortTitle: 'HR screening denied',
  },
  S04: {
    title: 'Payment data — sovereign routing',
    subtitle: 'Approved · sensitive traffic redacted locally, completed in cloud',
    shortTitle: 'Payment data routing',
  },
  S05: {
    title: 'Unsigned vendor DPA — denied',
    subtitle: 'Procurement veto · vendor data-processing agreement missing',
    shortTitle: 'Unsigned DPA veto',
  },
};

export function scenarioPresentation(scenarioId: string, fallbackName?: string): ScenarioPresentation {
  const known = SCENARIO_PRESENTATION[scenarioId];
  if (known) return known;
  return {
    title: fallbackName ?? 'Custom scenario',
    subtitle: 'Live negotiation',
    shortTitle: fallbackName ?? 'Custom',
  };
}

/** Demo reseed requests — human names only (no S04 in UI). */
export const DEMO_REQUEST_LABELS: Record<string, string> = {
  'demo-s04-pending-signoff': 'Claude Code — pending human sign-off',
  'demo-s05-denied': 'ChatGPT Enterprise — denied (unsigned DPA)',
  'demo-s02-external': 'Claude Code — blocked on works council agreement',
};

export function demoRequestLabel(requestId: string): string {
  return DEMO_REQUEST_LABELS[requestId] ?? requestId;
}

/** Map eval scenario → pre-seeded employee demo request */
export const SCENARIO_EMPLOYEE_REQUEST: Record<string, { path: string; label: string }> = {
  S04: {
    path: '/employee/requests/demo-s04-pending-signoff?tab=negotiation',
    label: 'the full negotiation',
  },
  S05: {
    path: '/employee/requests/demo-s05-denied?tab=negotiation',
    label: 'the denied request + advocate',
  },
  S02: {
    path: '/employee/requests/demo-s02-external?tab=negotiation',
    label: 'the works council gate',
  },
};

export function employeeLinkForScenario(scenarioId?: string): { path: string; label: string } | null {
  if (!scenarioId) return null;
  return SCENARIO_EMPLOYEE_REQUEST[scenarioId] ?? null;
}
