import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import type { EmployeeProfile } from '@trustflow/shared';
import type { ToolRecord } from '@trustflow/shared';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getToolsCatalog, submitEmployeeRequest } from '@/employee/api';

const USE_CASES = [
  { value: 'code_completion', label: 'Code completion' },
  { value: 'summarization', label: 'Document summarization' },
  { value: 'hr_screening', label: 'HR screening (high-risk)' },
];

export default function NewRequestPage({ profile }: { profile: EmployeeProfile }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const parentRequestId = searchParams.get('parent') ?? undefined;
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [toolId, setToolId] = useState('claude-code');
  const [useCase, setUseCase] = useState('code_completion');
  const [paymentData, setPaymentData] = useState(true);
  const [justification, setJustification] = useState(
    'Payments team needs AI-assisted refactoring for internal SDK code ahead of Q3 SEPA rollout.',
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getToolsCatalog()
      .then((t) => {
        setTools(t);
        if (t.length) setToolId(t[0].tool_id);
      })
      .catch(() => setTools([]));
  }, []);

  const submit = async (replay?: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const { request_id } = await submitEmployeeRequest({
        tool_id: toolId,
        use_case_category: useCase,
        department: profile.department,
        data_classes: paymentData ? ['payment_api_schemas'] : [],
        annex_iii_risk: useCase === 'hr_screening',
        business_justification: justification,
        parent_request_id: parentRequestId,
        replay,
      });
      navigate(`/employee/requests/${request_id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Request AI tool access</h1>
        <p className="text-muted-foreground">
          Submit through official channels. Agents negotiate policy; the gateway enforces it.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Submission failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {parentRequestId && (
        <Alert>
          <AlertTitle>Proposing an alternative</AlertTitle>
          <AlertDescription>
            This request will be linked to{' '}
            <Link to={`/employee/requests/${parentRequestId}`} className="underline">
              the denied request
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Request details</CardTitle>
          <CardDescription>
            Requesting as {profile.display_name} ({profile.department.replace(/_/g, ' ')})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="tool">Tool</Label>
            <Select value={toolId} onValueChange={setToolId}>
              <SelectTrigger id="tool">
                <SelectValue placeholder="Select a tool" />
              </SelectTrigger>
              <SelectContent>
                {tools.map((t) => (
                  <SelectItem key={t.tool_id} value={t.tool_id}>
                    {t.display_name} ({t.vendor})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="use-case">Use case</Label>
            <Select value={useCase} onValueChange={setUseCase}>
              <SelectTrigger id="use-case">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USE_CASES.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-start gap-3 rounded-md border p-4">
            <Checkbox
              id="payment"
              checked={paymentData}
              onCheckedChange={(v) => setPaymentData(v === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="payment" className="cursor-pointer">
                Prompts may include payment API schemas
              </Label>
              <p className="text-xs text-muted-foreground">
                Triggers sensitive-data routing and stricter compliance review.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">Business justification</Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
            />
          </div>

          <Button className="w-full" disabled={submitting} onClick={() => submit()}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting to boardroom…
              </>
            ) : (
              'Submit request'
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick test scenarios</CardTitle>
          <CardDescription>
            Deterministic replays (no API key) — same compiler and gateway as live mode.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {[
            {
              id: 'S04',
              label: 'S04 — Approved, local route',
              hint: 'Payment schemas → sovereign local route',
            },
            {
              id: 'S02',
              label: 'S02 — Works council pending',
              hint: 'Blocked until Betriebsvereinbarung signed',
            },
            {
              id: 'S05',
              label: 'S05 — DPA denied',
              hint: 'Procurement blocks unsigned vendor DPA',
            },
            { id: 'S01', label: 'S01 — Happy path', hint: 'Copilot summarization, all gates signed' },
          ].map((s) => (
            <Button
              key={s.id}
              variant="outline"
              size="sm"
              title={s.hint}
              disabled={submitting}
              onClick={() => submit(s.id)}
            >
              {s.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        <Link to="/employee/requests" className="underline hover:text-foreground">
          View my requests
        </Link>
      </p>
    </div>
  );
}
