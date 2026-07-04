import { useEffect, useState } from 'react';
import { Bot, Loader2, Send } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getAdvocateExplanation, postAdvocateMessage, type AdvocatePayload } from '@/employee/api';

interface ChatLine {
  role: 'advocate' | 'user';
  text: string;
}

export function AdvocatePanel({ requestId }: { requestId: string }) {
  const [payload, setPayload] = useState<AdvocatePayload | null>(null);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdvocateExplanation(requestId)
      .then((p) => {
        setPayload(p);
        setLines([{ role: 'advocate', text: p.explanation.summary }]);
      })
      .catch((e) => setError((e as Error).message));
  }, [requestId]);

  async function send() {
    const msg = input.trim();
    if (!msg) return;
    setInput('');
    setLines((prev) => [...prev, { role: 'user', text: msg }]);
    setBusy(true);
    try {
      const res = await postAdvocateMessage(requestId, msg);
      setLines((prev) => [...prev, { role: 'advocate', text: res.reply ?? res.explanation.summary }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!payload) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="h-5 w-5" />
          Your Advocate
        </CardTitle>
        <CardDescription>{payload.explanation.disclosure}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="max-h-64 space-y-3 overflow-y-auto text-sm">
          {lines.map((line, i) => (
            <li
              key={i}
              className={
                line.role === 'advocate'
                  ? 'rounded-lg bg-muted/60 p-3'
                  : 'rounded-lg border bg-background p-3 text-right'
              }
            >
              {line.text}
            </li>
          ))}
        </ul>

        {payload.explanation.suggested_alternatives.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Suggested alternatives:{' '}
            {payload.explanation.suggested_alternatives.map((a) => a.display_name).join(', ')}
          </p>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Ask why, about alternatives, or appeals…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void send()}
          />
          <Button size="icon" disabled={busy || !input.trim()} onClick={() => void send()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
