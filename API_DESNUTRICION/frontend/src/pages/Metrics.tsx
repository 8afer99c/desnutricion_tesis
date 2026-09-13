import React, { useEffect, useState } from 'react';
import { fetchMetricas, fetchImportancia } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { BrainCircuit, Target, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import Tooltip from '../components/Tooltip';

const Metrics: React.FC = () => {
  const [metricas, setMetricas] = useState<any>(null);
  const [importancia, setImportancia] = useState<any>(null);

  useEffect(() => {
    fetchMetricas().then(setMetricas).catch(console.error);
    fetchImportancia().then(setImportancia).catch(console.error);
  }, []);

  if (!metricas && !importancia) {
    return <div className="p-8 flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  const barColors = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl shadow-xl border border-slate-700 text-white">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <BrainCircuit className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200 font-medium text-xs tracking-wider uppercase mb-4 shadow-sm backdrop-blur-sm">
            <BrainCircuit className="w-3 h-3" />
            Ingeniería de Datos
          </div>
          <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Evaluación del Modelo XGBoost</h2>
          <p className="text-slate-300 max-w-2xl text-lg">
            Métricas de rendimiento técnico e importancia de variables del algoritmo de Machine Learning que respalda las predicciones clínicas.
          </p>
        </div>
      </div>

      {metricas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <div className="absolute top-0 right-0 p-4 opacity-5 transition-transform group-hover:scale-110"><Target className="w-24 h-24 text-indigo-500" /></div>
            </div>
            <div className="flex items-center justify-between mb-4 relative z-20">
              <Tooltip content="Porcentaje total de predicciones correctas sobre el total de casos." position="bottom">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-help">Exactitud (Accuracy)</h5>
              </Tooltip>
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Target className="w-5 h-5" /></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 relative z-10">{(metricas.accuracy * 100).toFixed(1)}<span className="text-2xl text-slate-400">%</span></h3>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <div className="absolute top-0 right-0 p-4 opacity-5 transition-transform group-hover:scale-110"><CheckCircle2 className="w-24 h-24 text-teal-500" /></div>
            </div>
            <div className="flex items-center justify-between mb-4 relative z-20">
              <Tooltip content="De todos los casos que el modelo predijo como 'En Riesgo', cuántos lo estaban realmente." position="bottom">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-help">Precisión (Precision)</h5>
              </Tooltip>
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 relative z-10">{(metricas.precision * 100).toFixed(1)}<span className="text-2xl text-slate-400">%</span></h3>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <div className="absolute top-0 right-0 p-4 opacity-5 transition-transform group-hover:scale-110"><AlertCircle className="w-24 h-24 text-orange-500" /></div>
            </div>
            <div className="flex items-center justify-between mb-4 relative z-20">
              <Tooltip content="De todos los casos que REALMENTE estaban en riesgo, cuántos logró identificar el modelo." position="bottom">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-help">Sensibilidad (Recall)</h5>
              </Tooltip>
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><AlertCircle className="w-5 h-5" /></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 relative z-10">{(metricas.recall * 100).toFixed(1)}<span className="text-2xl text-slate-400">%</span></h3>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <div className="absolute top-0 right-0 p-4 opacity-5 transition-transform group-hover:scale-110"><BarChart3 className="w-24 h-24 text-blue-500" /></div>
            </div>
            <div className="flex items-center justify-between mb-4 relative z-20">
              <Tooltip content="Media armónica entre Precisión y Sensibilidad. Métrica robusta para datos desbalanceados." position="bottom">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-help">F1 Score</h5>
              </Tooltip>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><BarChart3 className="w-5 h-5" /></div>
            </div>
            <h3 className="text-4xl font-black text-slate-800 relative z-10">{(metricas.f1_score * 100).toFixed(1)}<span className="text-2xl text-slate-400">%</span></h3>
          </div>

        </div>
      )}

      {importancia && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
          <div className="mb-6">
            <h4 className="text-lg font-bold text-slate-800">Impacto de Variables (Top 10)</h4>
            <p className="text-sm text-slate-500">Variables clínicas y demográficas que tienen mayor peso de decisión en el motor de inferencia XGBoost.</p>
          </div>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={importancia.slice(0, 10)} layout="vertical" margin={{ left: 160, right: 30, top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis dataKey="variable" type="category" width={150} tick={{fontSize: 12, fill: '#475569', fontWeight: 500}} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [value.toFixed(4), 'Importancia']}
                />
                <Bar dataKey="importancia" radius={[0, 6, 6, 0]} barSize={24}>
                  {importancia.slice(0, 10).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Metrics;
