import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { getSettings } from '../../services/api';

export const Layout: React.FC = () => {
  const [inferenceMode, setInferenceMode] = useState('demo');
  const [modelVersion, setModelVersion] = useState('v1.0.0-demo');

  useEffect(() => {
    getSettings()
      .then((data) => {
        setInferenceMode(data.inference_mode);
        setModelVersion(data.model_version);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar inferenceMode={inferenceMode} modelVersion={modelVersion} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
