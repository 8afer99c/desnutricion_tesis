import React, { useEffect, useState } from 'react';
import { fetchMetricas, fetchImportancia } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { BrainCircuit, Target, CheckCircle2, AlertCircle, BarChart3, TrendingUp, Scale } from 'lucide-react';
import Tooltip from '../components/Tooltip';

const barColors = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];
const DISENO_MUESTRAL = ['factor_expansion', 'estrato'];

interface CardProps { titulo: string; ayuda: string; valor: number | undefined; icono: React.ReactNode; color: string }
const Card: React.FC<CardProps> = ({ titulo, ayuda, valor, icono, color }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <Tooltip content={ayuda} position="bottom">
        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-help">{titulo}</h5>
      </Tooltip>
      <div className={`p-2.5 rounded-xl ${color}`}>{icono}</div>
    </div>
    <h3 className="text-4xl font-black text-slate-800">{valor === undefined ? '—' : valor.toFixed(3)}</h3>
  </div>
);

const limpiar = (v: string) => v.replace(/^(num|cat)__/, '');

const Metrics: React.FC = () => {
  const [metricas, setMetricas] = useState<any>(null);
  const [importancia, setImportancia] = useState<any[] | null>(null);

  useEffect(() => {
    fetchMetricas().then(setMetricas).catch(console.error);
    fetchImportancia().then(setImportancia).catch(console.error);
  }, []);

  if (!metricas && !importancia) {
    return <div className="p-8 flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  const top = (importancia ?? []).slice(0, 10).map((d) => ({ ...d, nombre: limpiar(d.variable) }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl shadow-xl border border-slate-700 text-white">
        <div className="absolute top-0 right-0 p-8 opacity-10"><BrainCircuit className="w-48 h-48" /></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-slate-200 font-medium text-xs tracking-wider uppercase mb-4">
            <BrainCircuit className="w-3 h-3" /> Evaluación del modelo
          </div>
          <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Desempeño del modelo{metricas?.modelo ? `: ${metricas.modelo}` : ''}</h2>
          <p className="text-slate-300 max-w-2xl text-lg">
            Métricas de la clase «con desnutrición crónica» en el conjunto de prueba interno (sin validación externa).
          </p>
        </div>
      </div>

      {metricas && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card titulo="Sensibilidad" ayuda="De los niños con desnutrición crónica, proporción que el modelo identifica." valor={metricas.recall_clase_desnutricion}
                  icono={<AlertCircle className="w-5 h-5" />} color="bg-orange-50 text-orange-600" />
            <Card titulo="Precisión" ayuda="De los niños que el modelo clasifica con desnutrición crónica, proporción que realmente la tiene." valor={metricas.precision_clase_desnutricion}
                  icono={<CheckCircle2 className="w-5 h-5" />} color="bg-teal-50 text-teal-600" />
            <Card titulo="F1 (clase con desnutrición)" ayuda="Media armónica entre precisión y sensibilidad de la clase con desnutrición." valor={metricas.f1_clase_desnutricion}
                  icono={<BarChart3 className="w-5 h-5" />} color="bg-blue-50 text-blue-600" />
            <Card titulo="Exactitud balanceada" ayuda="Promedio de la sensibilidad y la especificidad." valor={metricas.accuracy_balanceada}
                  icono={<Scale className="w-5 h-5" />} color="bg-indigo-50 text-indigo-600" />
            <Card titulo="ROC-AUC" ayuda="Capacidad de discriminación independiente del umbral (0.5 equivale al azar)." valor={metricas.roc_auc}
                  icono={<TrendingUp className="w-5 h-5" />} color="bg-purple-50 text-purple-600" />
            <Card titulo="PR-AUC" ayuda="Área bajo la curva precisión–sensibilidad. La referencia sin información es la prevalencia (≈ 0.25)." valor={metricas.pr_auc}
                  icono={<Target className="w-5 h-5" />} color="bg-rose-50 text-rose-600" />
          </div>
          <p className="text-sm text-slate-500">
            Desempeño moderado: alrededor de una de cada tres alertas corresponde a un caso real. Valores leídos del archivo de métricas del modelo;
            no se calculan en el navegador.
          </p>
        </>
      )}

      {importancia && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[520px]">
          <div className="mb-6">
            <h4 className="text-lg font-bold text-slate-800">Importancia de variables (10 principales)</h4>
            <p className="text-sm text-slate-500">
              Cuánto usa el modelo cada variable codificada. No implica causalidad. <span className="text-red-600 font-medium">En rojo:</span> variables de
              diseño muestral, que no describen al niño.
            </p>
          </div>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top} layout="vertical" margin={{ left: 160, right: 30, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="nombre" type="category" width={150} tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }}
                                 formatter={(value) => [Number(value).toFixed(4), 'Importancia']} />
                <Bar dataKey="importancia" radius={[0, 6, 6, 0]} barSize={24}>
                  {top.map((d, i) => (
                    <Cell key={i} fill={DISENO_MUESTRAL.includes(d.nombre) ? '#dc2626' : barColors[i % barColors.length]} />
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
