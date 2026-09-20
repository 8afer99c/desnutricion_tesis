import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Info } from 'lucide-react';

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="bg-amber-50 border-b border-amber-200 px-10 py-3 flex items-start gap-3 text-amber-900 text-sm sticky top-0 z-20">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            <strong>Herramienta académica exploratoria.</strong> Las salidas son estimaciones estadísticas obtenidas con
            datos de la ENSANUT 2018. No constituyen un diagnóstico clínico ni sustituyen la evaluación de un profesional de salud.
          </p>
        </div>
        <div className="p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
