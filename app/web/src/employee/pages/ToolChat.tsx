import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { EmployeeProfile, EmployeeRequestRecord } from '@trustflow/shared';
import { ArrowLeft, Loader2, Send, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { getEmployeeRequest, runEmployeeInference } from '@/employee/api';
import { DENY_LABELS } from '@/lib/agentLabels';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  meta?: {
    outcome?: string;
    deny_code?: string;
    route?: string;
  };
}

const STARTERS = [
  'Refactor this internal helper to use async/await.',
  'Generate a TypeScript type for a payment API schema field.',
  'Summarize the error handling pattern in our SDK.',
];

export default function ToolChatPage({ profile }: { profile: EmployeeProfile }) {
  const { requestId } = useParams<{ requestId: string }>();
  const [record, setRecord] = useState<EmployeeRequestRecord | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!requestId) return;
    getEmployeeRequest(requestId)
      .then((r) => {
        setRecord(r);
        if (r.status !== 'approved') setError('This tool is not approved for use yet.');
      })
      .catch((e) => setError((e as Error).message));
  }, [requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!record?.policy_id || !text.trim()) return;
    setSending(true);
    setError(null);

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages((m) => [...m, userMsg]);
    setInput('');

    try {
      const resp = await runEmployeeInference({
        policy_id: record.policy_id,
        prompt: text,
        request: record.packet,
        actor_id: profile.user_id,
      });

      const assistantContent =
        resp.outcome === 'denied'
          ? resp.deny_reason_code
            ? (DENY_LABELS[resp.deny_reason_code] ??
              `Request blocked at gateway: ${resp.deny_reason_code}`)
            : 'Request blocked at gateway.'
          : (resp.response_body ?? 'Response received.');

      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: resp.outcome === 'denied' ? 'system' : 'assistant',
          content: assistantContent,
          meta: {
            outcome: resp.outcome,
            deny_code: resp.deny_reason_code,
            route: resp.routing_decision,
          },
        },
      ]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (!record && !error) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to={record ? `/employee/requests/${record.request_id}` : '/employee'}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">{record?.tool_display_name ?? 'Tool workspace'}</h1>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Governed gateway · PII scan · audit logged
          </p>
        </div>
        {record?.routing_decision && (
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {record.routing_decision}
          </Badge>
        )}
      </div>

      {error && (
        <Alert variant={record?.status === 'approved' ? 'destructive' : 'warning'}>
          <AlertTitle>{record?.status === 'approved' ? 'Error' : 'Not available'}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {record?.status === 'approved' && (
        <>
          <Card className="flex min-h-0 flex-1 flex-col">
            <CardHeader className="border-b py-3">
              <CardTitle className="text-base">Chat</CardTitle>
              <CardDescription>
                Prompts pass through Layer A — sensitive data masked, routing enforced, no LLM in
                enforcement.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                {messages.length === 0 && (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <p className="mb-3 text-sm text-muted-foreground">Try a starter prompt:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {STARTERS.map((s) => (
                        <Button key={s} variant="outline" size="sm" onClick={() => send(s)}>
                          {s.slice(0, 40)}…
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      m.role === 'user'
                        ? 'ml-8 rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground'
                        : m.role === 'system'
                          ? 'rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'
                          : 'mr-8 rounded-lg bg-muted px-4 py-3 text-sm'
                    }
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    {m.meta?.route && (
                      <p className="mt-2 text-xs opacity-70">route: {m.meta.route}</p>
                    )}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask the approved tool… (IBANs and emails will be blocked at the edge)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={2}
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                />
                <Button size="icon" className="h-auto shrink-0" disabled={sending || !input.trim()} onClick={() => send(input)}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Test PII blocking: paste an IBAN like DE89370400440532013000
          </p>
        </>
      )}
    </div>
  );
}
