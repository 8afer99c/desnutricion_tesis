import React, { useEffect, useState } from 'react';
import { fetchDashboard } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import Tooltip from '../components/Tooltip';
import { Users, Activity, ShieldCheck, PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#ef4444', '#10b981'];

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchDashboard().then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="p-8 flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  const chartData = [
    { name: 'Con Riesgo (Desnutrición)', value: data.casos_desnutricion || 0 },
    { name: 'Sin Riesgo', value: data.casos_sin_desnutricion || 0 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-800 p-8 rounded-3xl shadow-xl border border-blue-900/50 text-white">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Activity className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-100 font-medium text-xs tracking-wider uppercase mb-4 shadow-sm backdrop-blur-sm">
            <Activity className="w-3 h-3" />
            Visión Global
          </div>
          <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Dashboard Clínico Poblacional</h2>
          <p className="text-blue-100/80 max-w-2xl text-lg">
            Monitoreo en tiempo real del riesgo nutricional infantil, procesado a través de nuestro motor XGBoost con un alto grado de confianza clínica.
          </p>
        </div>
      </div>

      {data.error ? (
        <div className="bg-red-50 p-6 rounded-2xl text-red-700 border border-red-200 shadow-sm flex items-start gap-4">
          <div className="bg-red-100 p-2 rounded-full"><Activity className="w-6 h-6 text-red-600"/></div>
          <div>
            <h4 className="font-bold text-red-800">No se pudieron cargar las métricas globales</h4>
            <p className="mt-1">{data.error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* KPI 1 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                <div className="absolute top-0 right-0 p-4 opacity-5 transition-transform group-hover:scale-110"><Users className="w-24 h-24" /></div>
              </div>
              <div className="flex items-center justify-between mb-4 relative z-20">
                <Tooltip content="Número total de infantes analizados en este conjunto de datos." position="bottom">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-help">Población Total</h5>
                </Tooltip>
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-5 h-5" /></div>
              </div>
              <h3 className="text-4xl font-black text-slate-800 relative z-10">{data.total_registros || 0}</h3>
              <p className="text-sm font-medium text-slate-400 mt-2 relative z-10">Pacientes analizados</p>
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                <div className="absolute top-0 right-0 p-4 opacity-5 transition-transform group-hover:scale-110"><Activity className="w-24 h-24 text-red-500" /></div>
              </div>
              <div className="flex items-center justify-between mb-4 relative z-20">
                <Tooltip content="Niños que el modelo ha clasificado con alto riesgo de presentar desnutrición crónica." position="bottom">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-help">Casos en Riesgo</h5>
                </Tooltip>
                <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><Activity className="w-5 h-5" /></div>
              </div>
              <h3 className="text-4xl font-black text-red-600 relative z-10">{data.casos_desnutricion || 0}</h3>
              <p className="text-sm font-medium text-slate-400 mt-2 relative z-10">Requieren atención</p>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                <div className="absolute top-0 right-0 p-4 opacity-5 transition-transform group-hover:scale-110"><ShieldCheck className="w-24 h-24 text-emerald-500" /></div>
              </div>
              <div className="flex items-center justify-between mb-4 relative z-20">
                <Tooltip content="Niños clasificados sin riesgo inminente de desnutrición." position="bottom">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-help">Casos Sanos</h5>
                </Tooltip>
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><ShieldCheck className="w-5 h-5" /></div>
              </div>
              <h3 className="text-4xl font-black text-emerald-600 relative z-10">{data.casos_sin_desnutricion || 0}</h3>
              <p className="text-sm font-medium text-slate-400 mt-2 relative z-10">Fuera de peligro</p>
            </div>

            {/* KPI 4 */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                <div className="absolute top-0 right-0 p-4 opacity-5 transition-transform group-hover:scale-110"><PieChartIcon className="w-24 h-24 text-purple-500" /></div>
              </div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <Tooltip content="Porcentaje de la población evaluada que presenta riesgo de desnutrición." position="bottom">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-help">Prevalencia</h5>
                </Tooltip>
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><PieChartIcon className="w-5 h-5" /></div>
              </div>
              <h3 className="text-4xl font-black text-slate-800 relative z-10">{data.porcentaje_desnutricion || 0} <span className="text-2xl text-slate-400">%</span></h3>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden relative z-10">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min(data.porcentaje_desnutricion || 0, 100)}%` }}></div>
              </div>
            </div>
            
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide w-full text-center mb-6">Distribución de Casos</h4>
              <div className="w-full h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={10}
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-slate-800">{data.total_registros}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
                </div>
              </div>
              <div className="w-full flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-slate-600">Riesgo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-slate-600">Sanos</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
               <div className="p-4 bg-slate-50 rounded-2xl mb-4">
                 <Activity className="w-12 h-12 text-slate-400" />
               </div>
               <h4 className="text-lg font-bold text-slate-800 mb-2">Módulo Analítico en Desarrollo</h4>
               <p className="text-slate-500 max-w-md">
                 Próximamente se integrarán gráficas de distribución territorial y tendencias por grupos de edad basadas en el motor XGBoost.
               </p>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
