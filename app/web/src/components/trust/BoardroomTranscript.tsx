import type { BoardroomEnvelope } from '@trustflow/shared';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AGENT_LABELS, STANCE_LABELS } from '@/lib/agentLabels';
import { cn } from '@/lib/utils';

const stanceVariant = (stance: string) => {
  if (stance === 'approve') return 'success';
  if (stance === 'conditional_approve') return 'secondary';
  if (stance === 'reject' || stance === 'conditional_reject') return 'destructive';
  return 'outline';
};

export function BoardroomTranscript({
  turns,
  compact = false,
}: {
  turns: BoardroomEnvelope[];
  compact?: boolean;
}) {
  if (turns.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Stakeholder agents have not spoken yet. The boardroom runs Compliance, Procurement, IT,
        and Works Council in structured rounds.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {turns.map((t, i) => (
        <Card
          key={`${t.round}-${t.agent}-${i}`}
          className={cn(
            'border-l-4',
            t.stance === 'approve' && 'border-l-green-500',
            t.stance === 'conditional_approve' && 'border-l-amber-500',
            (t.stance === 'reject' || t.stance === 'conditional_reject') && 'border-l-red-500',
            t.stance === 'pass' && 'border-l-muted-foreground',
          )}
        >
          <CardContent className={cn('pt-4', compact && 'py-3')}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">
                Round {t.round} · {AGENT_LABELS[t.agent] ?? t.agent}
              </span>
              <Badge variant={stanceVariant(t.stance)}>{STANCE_LABELS[t.stance] ?? t.stance}</Badge>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{t.natural_language}</p>
            {!compact && (t.demands?.length ?? 0) > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Demands:{' '}
                {t.demands!.map((d, j) => (
                  <span key={j} className={d.hard ? 'font-semibold text-foreground' : ''}>
                    {d.field}={String(d.value)}
                    {d.hard ? ' (required)' : ''}
                    {j < t.demands!.length - 1 ? '; ' : ''}
                  </span>
                ))}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
