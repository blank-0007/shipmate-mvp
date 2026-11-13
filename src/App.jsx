import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CreateRoom from './pages/CreateRoom';
import RoomDashboard from './pages/RoomDashboard';
import RoomManifest from './pages/RoomManifest';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreateRoom />} />
        <Route path="/room/:id" element={<RoomDashboard />} />
        <Route path="/room/:id/manifest" element={<RoomManifest />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
