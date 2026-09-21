import React, { useEffect, useState } from 'react';
import { fetchDashboard } from '../services/api';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import Tooltip from '../components/Tooltip';
import { Users, Activity, Target, ClipboardCheck, AlertTriangle, Info } from 'lucide-react';

// Nombres tal como los espera la API (GET /dashboard?provincia=...)
const PROVINCIAS = [
  'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Cotopaxi', 'Chimborazo', 'El Oro', 'Esmeraldas', 'Guayas', 'Imbabura',
  'Loja', 'Los Ríos', 'Manabí', 'Morona Santiago', 'Napo', 'Pastaza', 'Pichincha', 'Tungurahua', 'Zamora Chinchipe',
  'Galápagos', 'Sucumbíos', 'Orellana', 'Santo Domingo de los Tsáchilas', 'Santa Elena',
];

// Por debajo de este número de registros de prueba, las cifras por provincia son poco estables.
const POCOS_REGISTROS = 150;

const pct = (v: number | null | undefined) => (v === null || v === undefined ? '—' : (v * 100).toFixed(1));

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
    { name: 'Casos observados', value: data?.casos_observados ?? 0, color: '#6366f1' },
    { name: 'Clasificados por el modelo', value: data?.casos_desnutricion ?? 0, color: '#ef4444' },
    { name: 'Coinciden (observado y clasificado)', value: data?.verdaderos_positivos ?? 0, color: '#10b981' },
  ];

  const pocos = data && data.total_registros > 0 && data.total_registros < POCOS_REGISTROS;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-800 p-8 rounded-3xl shadow-xl border border-blue-900/50 text-white">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Activity className="w-48 h-48" /></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-100 font-medium text-xs tracking-wider uppercase mb-4">
            <Activity className="w-3 h-3" /> Indicadores del modelo
          </div>
          <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Casos observados y clasificados por provincia</h2>
          <p className="text-blue-100/80 max-w-2xl text-lg">
            Comparación, en el conjunto de prueba, entre los casos de desnutrición crónica que registra la encuesta y los que clasifica el modelo.
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

      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 flex gap-3 text-sky-900 text-sm">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          Las cifras se calculan con el <strong>conjunto de prueba</strong>: registros de la ENSANUT 2018 que el modelo <strong>no usó para
          entrenarse</strong> (20 % de la base). No son la prevalencia poblacional: la muestra no está ponderada por el diseño de la encuesta.
        </p>
      </div>

      {pocos && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3 text-amber-900 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            Este ámbito tiene solo <strong>{data.total_registros} registros de prueba</strong>. Con tan pocos casos, la sensibilidad y la
            precisión son inestables y no permiten sacar conclusiones por provincia.
          </p>
        </div>
      )}

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
            <Kpi titulo="Registros de prueba" ayuda="Número de registros del conjunto de prueba en el ámbito elegido." valor={data.total_registros ?? 0}
                 nota="No usados para entrenar" icono={<Users className="w-5 h-5" />} color="bg-blue-50 text-blue-600" />
            <Kpi titulo="Casos observados" ayuda="Registros con desnutrición crónica según la encuesta (variable objetivo)."
                 valor={<span className="text-indigo-600">{data.casos_observados ?? 0}</span>}
                 nota={`${data.porcentaje_observado ?? 0} % de los registros de prueba`} icono={<ClipboardCheck className="w-5 h-5" />} color="bg-indigo-50 text-indigo-600" />
            <Kpi titulo="Clasificados con desnutrición" ayuda="Registros para los que el modelo estima desnutrición crónica (puntuación mayor o igual al umbral)."
                 valor={<span className="text-red-600">{data.casos_desnutricion ?? 0}</span>}
                 nota={`${data.porcentaje_desnutricion ?? 0} % (el umbral favorece la sensibilidad)`} icono={<Activity className="w-5 h-5" />} color="bg-red-50 text-red-600" />
            <Kpi titulo="Sensibilidad en el ámbito" ayuda="De los casos observados, proporción que el modelo identifica."
                 valor={<>{pct(data.sensibilidad)}<span className="text-2xl text-slate-400"> %</span></>}
                 nota={`Precisión: ${pct(data.precision)} %`} icono={<Target className="w-5 h-5" />} color="bg-emerald-50 text-emerald-600" />
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">Observados frente a clasificados</h4>
            <p className="text-sm text-slate-500 mb-4">
              El modelo clasifica más registros de los que tienen la condición: prioriza detectar casos (sensibilidad) a costa de la precisión.
            </p>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }}
                                   formatter={(value) => [String(value), 'Registros']} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={56}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
