import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import DemoApp from './DemoApp.js';
import EmployeeApp from './employee/EmployeeApp.js';
import GovernanceApp from './governance/GovernanceApp.js';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/employee" replace />} />
        <Route path="/employee/*" element={<EmployeeApp />} />
        <Route path="/governance/*" element={<GovernanceApp />} />
        <Route path="/glassbox/*" element={<DemoApp />} />
        <Route path="/demo/*" element={<Navigate to="/glassbox" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
