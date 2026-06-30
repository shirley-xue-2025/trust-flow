import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { EmployeeProfile } from '@trustflow/shared';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getApprovedTools, type ApprovedTool } from '@/employee/api';

export default function ToolsIndexPage({ profile }: { profile: EmployeeProfile }) {
  const [tools, setTools] = useState<ApprovedTool[]>([]);

  useEffect(() => {
    getApprovedTools(profile.user_id).then(setTools).catch(() => setTools([]));
  }, [profile.user_id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approved tools</h1>
        <p className="text-muted-foreground">Use AI tools through the governed gateway</p>
      </div>

      {tools.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Bot className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No approved tools yet. Submit a request and wait for boardroom approval.</p>
            <Button asChild>
              <Link to="/employee/requests/new">Request a tool</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((t) => (
            <Card key={t.request_id}>
              <CardHeader>
                <CardTitle className="text-lg">{t.tool_display_name}</CardTitle>
                <CardDescription className="capitalize">
                  {t.use_case_category.replace(/_/g, ' ')}
                  {t.routing_decision ? ` · ${t.routing_decision}` : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to={`/employee/tools/${t.request_id}`}>Open workspace</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
