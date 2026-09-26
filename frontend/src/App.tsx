import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SatelliteMonitorPage } from './pages/SatelliteMonitorPage';
import { CollisionAnalysisPage } from './pages/CollisionAnalysisPage';
import { AnalysisResultPage } from './pages/AnalysisResultPage';
import { SpaceMapPage } from './pages/SpaceMapPage';
import { AlertsPage } from './pages/AlertsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SystemStatusPage } from './pages/SystemStatusPage';

// Simple lightweight route guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('orbitshield_token');
  // For hackathon accessibility, if token is absent, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Mission Control Layout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/monitor" element={<SatelliteMonitorPage />} />
          <Route path="/analysis" element={<CollisionAnalysisPage />} />
          <Route path="/analysis/:id" element={<AnalysisResultPage />} />
          <Route path="/map" element={<SpaceMapPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/system" element={<SystemStatusPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
