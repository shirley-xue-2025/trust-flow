import { Route, Routes } from 'react-router-dom';
import GovernanceLayout from '@/governance/GovernanceLayout';
import GovernanceDashboard from '@/governance/pages/Dashboard';
import GovernanceRequestOversight from '@/governance/pages/RequestOversight';
import GovernanceAuditPage from '@/governance/pages/AuditPage';

export default function GovernanceApp() {
  return (
    <Routes>
      <Route element={<GovernanceLayout />}>
        <Route index element={<GovernanceDashboard />} />
        <Route path="requests/:id" element={<GovernanceRequestOversight />} />
        <Route path="audit" element={<GovernanceAuditPage />} />
      </Route>
    </Routes>
  );
}
