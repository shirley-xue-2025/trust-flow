import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AppealType, EmployeeRequestRecord } from '@trustflow/shared';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  acceptEmployeeDeny,
  proposeAlternativeRequest,
  submitEmployeeAppeal,
} from '@/employee/api';

const APPEAL_TYPES: { value: AppealType; label: string }[] = [
  { value: 'procedural', label: 'Procedural — process or registry error' },
  { value: 'factual', label: 'Factual — new evidence changes substance' },
  { value: 'alternative_scope', label: 'Alternative scope — narrower use case' },
  { value: 'wrong_tool', label: 'Wrong tool — I want a different product' },
];

export function EmployeeResolutionPanel({
  record,
  onUpdated,
}: {
  record: EmployeeRequestRecord;
  onUpdated: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealType, setAppealType] = useState<AppealType>('factual');
  const [statement, setStatement] = useState('');

  const show =
    record.status === 'denied_pending_employee' ||
    record.status === 'agent_recommended_deny' ||
    record.status === 'denied';

  if (!show) return null;

  async function run(action: string, fn: () => Promise<unknown>) {
    setBusy(action);
    setError(null);
    try {
      await fn();
      onUpdated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">What would you like to do?</CardTitle>
        <CardDescription>Accept the decision, appeal to your DPO, or propose an alternative.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!!busy}
            onClick={() => run('accept', () => acceptEmployeeDeny(record.request_id))}
          >
            {busy === 'accept' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept decision'}
          </Button>
          <Button
            variant="secondary"
            disabled={!!busy}
            onClick={() => setAppealOpen((v) => !v)}
          >
            Appeal
          </Button>
          <Button
            variant="secondary"
            disabled={!!busy}
            onClick={() =>
              run('alt', () =>
                proposeAlternativeRequest(record.request_id, {
                  tool_id: 'microsoft-copilot-365',
                  use_case_category: record.use_case_category,
                  replay: 'S01',
                }),
              )
            }
          >
            {busy === 'alt' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Propose alternative'}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/employee/requests/new?parent=${record.request_id}`}>Customize alternative…</Link>
          </Button>
        </div>

        {appealOpen && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="space-y-2">
              <Label>Appeal type</Label>
              <Select value={appealType} onValueChange={(v) => setAppealType(v as AppealType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPEAL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {appealType === 'wrong_tool' && (
              <p className="text-sm text-amber-800">
                Use <strong>Propose alternative</strong> to link a new request for a different tool.
              </p>
            )}
            <div className="space-y-2">
              <Label>Your statement</Label>
              <Textarea
                rows={3}
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Explain why stakeholders should reconsider (min 20 characters)…"
              />
            </div>
            <Button
              disabled={!!busy || appealType === 'wrong_tool' || statement.trim().length < 20}
              onClick={() =>
                run('appeal', () =>
                  submitEmployeeAppeal(record.request_id, {
                    appeal_type: appealType,
                    statement,
                  }),
                )
              }
            >
              {busy === 'appeal' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit appeal'}
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Action failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
