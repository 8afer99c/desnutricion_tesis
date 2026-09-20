import React, { useEffect, useState } from 'react';
import { fetchDashboard } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import Tooltip from '../components/Tooltip';
import { Users, Activity, ShieldCheck, PieChart as PieChartIcon, AlertTriangle } from 'lucide-react';

const COLORS = ['#ef4444', '#10b981'];

// Nombres tal como los espera la API (GET /dashboard?provincia=...)
const PROVINCIAS = [
  'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Cotopaxi', 'Chimborazo', 'El Oro', 'Esmeraldas', 'Guayas', 'Imbabura',
  'Loja', 'Los Ríos', 'Manabí', 'Morona Santiago', 'Napo', 'Pastaza', 'Pichincha', 'Tungurahua', 'Zamora Chinchipe',
  'Galápagos', 'Sucumbíos', 'Orellana', 'Santo Domingo de los Tsáchilas', 'Santa Elena',
];

interface KpiProps { titulo: string; ayuda: string; valor: React.ReactNode; nota: string; icono: React.ReactNode; color: string }
const Kpi: React.FC<KpiProps> = ({ titulo, ayuda, valor, nota, icono, color }) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative">
    <div className="flex items-center justify-between mb-4">
      <Tooltip content={ayuda} position="bottom">
        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider cursor-help">{titulo}</h5>
      </Tooltip>
      <div className={`p-2.5 rounded-xl ${color}`}>{icono}</div>
    </div>
    <h3 className="text-4xl font-black text-slate-800">{valor}</h3>
    <p className="text-sm font-medium text-slate-400 mt-2">{nota}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [provincia, setProvincia] = useState<string>('');

  useEffect(() => {
    setData(null);
    fetchDashboard(provincia || undefined).then(setData).catch(() => setData({ error: 'No se pudo consultar la API.' }));
  }, [provincia]);

  const chartData = [
    { name: 'Clasificados con desnutrición crónica', value: data?.casos_desnutricion || 0 },
    { name: 'Clasificados sin desnutrición crónica', value: data?.casos_sin_desnutricion || 0 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-800 p-8 rounded-3xl shadow-xl border border-blue-900/50 text-white">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Activity className="w-48 h-48" /></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-100 font-medium text-xs tracking-wider uppercase mb-4">
            <Activity className="w-3 h-3" /> Indicadores del modelo
          </div>
          <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Clasificaciones del modelo por provincia</h2>
          <p className="text-blue-100/80 max-w-2xl text-lg">
            Resumen de cuántos registros del archivo de datos clasifica el modelo con y sin desnutrición crónica.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <label htmlFor="provincia" className="text-sm text-blue-100">Ámbito</label>
            <select
              id="provincia" value={provincia} onChange={(e) => setProvincia(e.target.value)}
              className="bg-white/10 border border-white/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="" className="text-slate-900">Todo el país</option>
              {PROVINCIAS.map((p) => <option key={p} value={p} className="text-slate-900">{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3 text-amber-900 text-sm">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          Estos valores son <strong>clasificaciones del modelo</strong> sobre un archivo de datos que incluye registros usados para
          entrenarlo. <strong>No equivalen a la prevalencia observada</strong> de desnutrición crónica y no deben usarse como tal.
        </p>
      </div>

      {!data ? (
        <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : data.error || data.mensaje ? (
        <div className="bg-red-50 p-6 rounded-2xl text-red-700 border border-red-200 shadow-sm">
          <h4 className="font-bold text-red-800">No se pudieron cargar los indicadores</h4>
          <p className="mt-1">{data.error || data.mensaje}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Kpi titulo="Registros" ayuda="Número de registros del archivo de datos en el ámbito elegido." valor={data.total_registros ?? 0}
                 nota="Registros clasificados" icono={<Users className="w-5 h-5" />} color="bg-blue-50 text-blue-600" />
            <Kpi titulo="Clasificados con desnutrición" ayuda="Registros para los que el modelo estima desnutrición crónica (puntuación mayor o igual al umbral)."
                 valor={<span className="text-red-600">{data.casos_desnutricion ?? 0}</span>} nota="Estimación del modelo" icono={<Activity className="w-5 h-5" />} color="bg-red-50 text-red-600" />
            <Kpi titulo="Clasificados sin desnutrición" ayuda="Registros para los que el modelo no estima desnutrición crónica."
                 valor={<span className="text-emerald-600">{data.casos_sin_desnutricion ?? 0}</span>} nota="Estimación del modelo" icono={<ShieldCheck className="w-5 h-5" />} color="bg-emerald-50 text-emerald-600" />
            <Kpi titulo="% clasificado con desnutrición" ayuda="Porcentaje de registros que el modelo clasifica con desnutrición crónica. No es la prevalencia observada."
                 valor={<>{data.porcentaje_desnutricion ?? 0}<span className="text-2xl text-slate-400"> %</span></>} nota="No es la prevalencia" icono={<PieChartIcon className="w-5 h-5" />} color="bg-purple-50 text-purple-600" />
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Distribución de las clasificaciones</h4>
            <div className="w-full max-w-md h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={10}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none' }} itemStyle={{ fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-800">{data.total_registros}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Registros</span>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-sm text-slate-600">Con desnutrición (estimado)</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-sm text-slate-600">Sin desnutrición (estimado)</span></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
