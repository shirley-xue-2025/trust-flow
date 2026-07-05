import type { BoardroomEnvelope } from '@trustflow/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AGENT_LABELS, STANCE_LABELS } from '@/lib/agentLabels';

/** Latest stance per stakeholder agent — employee-facing summary (Epic A3). */
export function StakeholderSummaryCard({ turns }: { turns: BoardroomEnvelope[] }) {
  if (turns.length === 0) return null;

  const byAgent = new Map<string, BoardroomEnvelope>();
  for (const t of turns) {
    if (t.agent === 'workflow_runner') continue;
    byAgent.set(t.agent, t);
  }

  const stakeholders = [...byAgent.values()];
  if (stakeholders.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Agent negotiation trace</CardTitle>
        <CardDescription>
          5 Qwen agents — Compliance, Procurement, IT, Works Council, Runner
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-wrap gap-2">
          {stakeholders.map((t) => (
            <li key={t.agent}>
              <Badge variant="outline" className="gap-1 font-normal">
                <span className="font-medium">{AGENT_LABELS[t.agent] ?? t.agent}:</span>
                {STANCE_LABELS[t.stance] ?? t.stance}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
