import { Link } from 'react-router-dom';
import type { BoardroomEnvelope } from '@trustflow/shared';
import { ExternalLink, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AGENT_LABELS, STANCE_LABELS } from '@/lib/agentLabels';

const DISPLAY_ORDER = [
  'corporate_compliance',
  'procurement',
  'it_infra',
  'works_council',
  'workflow_runner',
] as const;

/** Hero summary of the agent boardroom — the product centerpiece on employee/governance surfaces. */
export function StakeholderSummaryCard({
  turns,
  showGlassboxLink = true,
}: {
  turns: BoardroomEnvelope[];
  showGlassboxLink?: boolean;
}) {
  if (turns.length === 0) return null;

  const byAgent = new Map<string, BoardroomEnvelope>();
  for (const t of turns) {
    byAgent.set(t.agent, t);
  }

  const agents = DISPLAY_ORDER.map((id) => byAgent.get(id)).filter(Boolean) as BoardroomEnvelope[];
  if (agents.length === 0) return null;

  return (
    <Card className="overflow-hidden border-green-300/70 bg-gradient-to-br from-green-50/90 via-white to-white shadow-md dark:border-green-800/50 dark:from-green-950/30 dark:via-background dark:to-background">
      <CardHeader className="border-b border-green-100/80 pb-4 dark:border-green-900/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
                Track 3 · Agent Society
              </p>
              <CardTitle className="text-xl font-semibold text-foreground">Agent boardroom</CardTitle>
              <CardDescription className="mt-1 text-sm">
                {turns.length} negotiation rounds · five Qwen specialists debated before any human
                sign-off or gateway enforcement
              </CardDescription>
            </div>
          </div>
          {showGlassboxLink && (
            <Button variant="outline" size="sm" className="shrink-0 border-green-300 bg-white/80" asChild>
              <Link to="/glassbox">
                Live replay in glassbox
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {agents.map((t) => (
            <li
              key={t.agent}
              className="rounded-lg border border-green-100 bg-white/70 px-3 py-2.5 dark:border-green-900/30 dark:bg-green-950/20"
            >
              <p className="text-xs font-semibold text-foreground">{AGENT_LABELS[t.agent] ?? t.agent}</p>
              <Badge variant="outline" className="mt-1.5 border-green-200/80 bg-white/90 font-normal">
                {STANCE_LABELS[t.stance] ?? t.stance}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
