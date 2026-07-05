import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import type { EmployeeProfile } from '@trustflow/shared';
import { Loader2 } from 'lucide-react';
import EmployeeLayout from '@/employee/EmployeeLayout';
import { getEmployeeProfile } from '@/employee/api';
import EmployeeDashboard from '@/employee/pages/Dashboard';
import NewRequestPage from '@/employee/pages/NewRequest';
import RequestsListPage from '@/employee/pages/RequestsList';
import RequestDetailPage from '@/employee/pages/RequestDetail';

function ToolsRedirect() {
  const { requestId } = useParams<{ requestId: string }>();
  const dest = requestId
    ? `/employee/requests/${requestId}?tab=activity`
    : '/employee/requests/demo-s04-pending-signoff?tab=activity';
  return <Navigate to={dest} replace />;
}

function EmployeeRoutes({ profile }: { profile: EmployeeProfile }) {
  return (
    <Routes>
      <Route element={<EmployeeLayout profile={profile} />}>
        <Route index element={<EmployeeDashboard profile={profile} />} />
        <Route path="requests/new" element={<NewRequestPage profile={profile} />} />
        <Route path="requests" element={<RequestsListPage profile={profile} />} />
        <Route path="requests/:id" element={<RequestDetailPage />} />
        <Route path="tools" element={<ToolsRedirect />} />
        <Route path="tools/:requestId" element={<ToolsRedirect />} />
      </Route>
    </Routes>
  );
}

export default function EmployeeApp() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEmployeeProfile()
      .then(setProfile)
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-destructive">
        Failed to load profile: {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <EmployeeRoutes profile={profile} />;
}

export function EmployeeRootRedirect() {
  return <Navigate to="/employee" replace />;
}
