import type { BoardroomEnvelope } from '@trustflow/shared';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AGENT_LABELS, STANCE_LABELS } from '@/lib/agentLabels';

/** Latest stance per stakeholder agent — hero summary of the boardroom outcome. */
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
    <Card className="border-green-200/80 bg-green-50/40 shadow-sm dark:border-green-900/40 dark:bg-green-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base text-foreground">Agent boardroom</CardTitle>
            <CardDescription>
              {turns.length} rounds · five Qwen agents — Compliance, Procurement, IT, Works Council,
              Runner
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-wrap gap-2">
          {stakeholders.map((t) => (
            <li key={t.agent}>
              <Badge variant="outline" className="gap-1 border-green-200/80 bg-white/80 font-normal">
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
