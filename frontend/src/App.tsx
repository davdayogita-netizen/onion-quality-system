import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { InspectPage } from './pages/InspectPage';
import { InspectionResultPage } from './pages/InspectionResultPage';
import { HistoryPage } from './pages/HistoryPage';
import { ReportViewPage } from './pages/ReportViewPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="inspect" element={<InspectPage />} />
        <Route path="inspection/:id" element={<InspectionResultPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="reports/:id" element={<ReportViewPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
