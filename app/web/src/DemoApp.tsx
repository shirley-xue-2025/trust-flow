import { Routes, Route, Navigate } from 'react-router-dom';
import GlassBoxCanvas from './glassbox/GlassBoxCanvas.js';
import './styles.css';

/** Glassbox — transparent judge view of the negotiation engine. */
export default function DemoApp() {
  return (
    <Routes>
      <Route index element={<GlassBoxCanvas />} />
      <Route path="classic" element={<Navigate to="/glassbox" replace />} />
      <Route path="*" element={<Navigate to="/glassbox" replace />} />
    </Routes>
  );
}
