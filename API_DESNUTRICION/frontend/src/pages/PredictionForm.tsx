import React, { useState, useEffect } from 'react';
import { predictIndividual, fetchFeatures } from '../services/api';
import { AlertTriangle, Info } from 'lucide-react';
import clsx from 'clsx';

// Categorías tal como aparecen en los datos de entrenamiento (ENSANUT 2018).
const OPC = {
  sexo: ['Hombre', 'Mujer'],
  area: ['Urbano', 'Rural'],
  prematuro: ['A Tiempo', 'Prematuro', 'Posmaduro', 'No sabe'],
  diarrea: ['No', 'Si', 'No Sabe / No Responde'],
  infeccion: ['No', 'Si'],
};

// El modelo usa la edad agrupada como categoría (mismos intervalos del entrenamiento).
const grupoEdad = (m: number): string =>
  m <= 11 ? '0-11' : m <= 18 ? '12-18' : m <= 23 ? '19-23' : m <= 30 ? '24-30' : m <= 35 ? '31-35' : m <= 42 ? '36-42' : m <= 47 ? '43-47' : '48-59';

const campo = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const etiqueta = 'text-sm font-semibold text-slate-700';

const PredictionForm: React.FC = () => {
  const [features, setFeatures] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [informadas, setInformadas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [f, setF] = useState({
    edad_meses: 24, sexo: 'Mujer', area: 'Urbano', provincia: '18',
    peso_nacer_gramos: 3200, talla_nacer_cm: 50, prematuro: 'A Tiempo', lactancia_meses: 6,
    diarrea: 'No', infeccion: 'No',
  });

  useEffect(() => {
    fetchFeatures().then((r) => setFeatures(r.variables)).catch(() => setError('No se pudo consultar la API.'));
  }, []);

  const set = (name: string, value: string | number) => setF((p) => ({ ...p, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);

    // Todas las variables del modelo se envían; las no informadas van como null y el
    // Pipeline las imputa con la mediana o la moda del entrenamiento.
    const payload: Record<string, any> = {};
    features.forEach((v) => { payload[v] = null; });
    const dados: Record<string, any> = {
      edad_meses: f.edad_meses, grupo_edad_meses: grupoEdad(f.edad_meses), sexo: f.sexo, area: f.area,
      peso_nacer_gramos: f.peso_nacer_gramos, talla_nacer_cm: f.talla_nacer_cm, prematuro: f.prematuro,
      lactancia_meses: f.lactancia_meses, diarrea_ultimas_2_semanas: f.diarrea, infeccion_respiratoria_2_semanas: f.infeccion,
    };
    if (f.provincia) dados.provincia = Number(f.provincia);
    let n = 0;
    Object.entries(dados).forEach(([k, v]) => { if (features.includes(k)) { payload[k] = v; n += 1; } });
    setInformadas(n);

    try {
      setResult(await predictIndividual(payload));
    } catch (err: any) {
      setError(err?.response?.data?.detail?.mensaje || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const positivo = result?.prediccion === 1;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3 text-amber-900 text-sm">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <p>
          <strong>Uso ilustrativo.</strong> El modelo necesita 114 variables y este formulario solo recoge {Object.keys(f).length}; el resto se completa
          automáticamente con la mediana o la moda del entrenamiento. Con tan pocos datos la puntuación varía poco y <strong>no es interpretable
          para un niño concreto</strong>. Para una clasificación con el modelo evaluado use la opción de clasificación por archivo.
        </p>
      </div>

      {result && (
        <div className={clsx('p-8 rounded-2xl shadow-lg border', positivo ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200')}>
          <h3 className="text-sm font-bold tracking-wider uppercase mb-1 text-slate-500">Clasificación estimada</h3>
          <p className={clsx('text-3xl font-black mb-3', positivo ? 'text-red-700' : 'text-emerald-700')}>
            {positivo ? 'Con desnutrición crónica (estimado)' : 'Sin desnutrición crónica (estimado)'}
          </p>
          <div className="flex flex-wrap gap-8 text-sm text-slate-700">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Puntuación del modelo</p>
              <p className="text-2xl font-black">{(result.probabilidad * 100).toFixed(1)} %</p>
              <p className="text-xs text-slate-500">No es una probabilidad calibrada</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Variables informadas</p>
              <p className="text-2xl font-black">{informadas} de {features.length}</p>
              <p className="text-xs text-slate-500">El resto se imputa</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="flex items-center gap-2 text-slate-800">
          <Info className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold">Datos del niño</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2"><label className={etiqueta}>Edad (meses, 0 a 59)</label>
            <input type="number" min={0} max={59} value={f.edad_meses} onChange={(e) => set('edad_meses', Number(e.target.value))} className={campo} /></div>
          <div className="space-y-2"><label className={etiqueta}>Sexo</label>
            <select value={f.sexo} onChange={(e) => set('sexo', e.target.value)} className={campo}>{OPC.sexo.map((o) => <option key={o}>{o}</option>)}</select></div>
          <div className="space-y-2"><label className={etiqueta}>Área de residencia</label>
            <select value={f.area} onChange={(e) => set('area', e.target.value)} className={campo}>{OPC.area.map((o) => <option key={o}>{o}</option>)}</select></div>
          <div className="space-y-2"><label className={etiqueta}>Provincia</label>
            <select value={f.provincia} onChange={(e) => set('provincia', e.target.value)} className={campo}>
              <option value="">No informada</option><option value="18">Tungurahua</option></select></div>
          <div className="space-y-2"><label className={etiqueta}>Peso al nacer (gramos)</label>
            <input type="number" min={500} max={6000} value={f.peso_nacer_gramos} onChange={(e) => set('peso_nacer_gramos', Number(e.target.value))} className={campo} /></div>
          <div className="space-y-2"><label className={etiqueta}>Talla al nacer (cm)</label>
            <input type="number" min={25} max={65} value={f.talla_nacer_cm} onChange={(e) => set('talla_nacer_cm', Number(e.target.value))} className={campo} /></div>
          <div className="space-y-2"><label className={etiqueta}>Edad gestacional al nacer</label>
            <select value={f.prematuro} onChange={(e) => set('prematuro', e.target.value)} className={campo}>{OPC.prematuro.map((o) => <option key={o}>{o}</option>)}</select></div>
          <div className="space-y-2"><label className={etiqueta}>Lactancia (meses)</label>
            <input type="number" min={0} max={59} value={f.lactancia_meses} onChange={(e) => set('lactancia_meses', Number(e.target.value))} className={campo} /></div>
          <div className="space-y-2"><label className={etiqueta}>Diarrea en las últimas 2 semanas</label>
            <select value={f.diarrea} onChange={(e) => set('diarrea', e.target.value)} className={campo}>{OPC.diarrea.map((o) => <option key={o}>{o}</option>)}</select></div>
          <div className="space-y-2"><label className={etiqueta}>Infección respiratoria en las últimas 2 semanas</label>
            <select value={f.infeccion} onChange={(e) => set('infeccion', e.target.value)} className={campo}>{OPC.infeccion.map((o) => <option key={o}>{o}</option>)}</select></div>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button type="submit" disabled={loading || features.length === 0}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? 'Calculando…' : 'Calcular clasificación estimada'}
        </button>
      </form>
    </div>
  );
};

export default PredictionForm;
