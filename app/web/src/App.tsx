import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import DemoApp from './DemoApp.js';
import EmployeeApp from './employee/EmployeeApp.js';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/employee" replace />} />
        <Route path="/employee/*" element={<EmployeeApp />} />
        <Route path="/demo/*" element={<DemoApp />} />
      </Routes>
    </BrowserRouter>
  );
}
