import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ComplianceScoreResult } from '@/lib/complianceScore';

export function ComplianceScoreCard({ score }: { score: ComplianceScoreResult }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Compliance readiness</CardTitle>
        <CardDescription>{score.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-3">
          <span className="text-4xl font-bold tabular-nums">{score.percent}%</span>
          <Progress value={score.percent} className="mb-2 h-2 flex-1" />
        </div>
        <ul className="space-y-2">
          {score.checks.map((c) => (
            <li key={c.id} className="flex gap-2 text-sm">
              {c.status === 'done' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />}
              {c.status === 'pending' && <Circle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
              {c.status === 'blocked' && <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
              {c.status === 'na' && <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
              <div>
                <span className="font-medium">{c.label}</span>
                {c.detail && <p className="text-xs text-muted-foreground">{c.detail}</p>}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
