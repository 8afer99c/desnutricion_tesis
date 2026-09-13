import React, { useState, useEffect } from 'react';
import { predictIndividual, fetchFeatures } from '../services/api';
import { ShieldAlert, CheckCircle, Activity } from 'lucide-react';
import Tooltip from '../components/Tooltip';
import clsx from 'clsx';

const FIXED_VALUES: Record<string, number> = {
  area: 1, provincia: 18, region_madre: 1, etnia_madre: 1, factor_expansion: 1, estrato: 1,
};

const PredictionForm: React.FC = () => {
  const [features, setFeatures] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    edad_meses: 24,
    sexo: 1,
    peso_nacer_gramos: 3000,
    talla_nacer_cm: 50,
    prematuro: 0,
    lactancia_meses: 6,
    diarrea_ultimas_2_semanas: 0,
    infeccion_respiratoria_2_semanas: 0,
  });

  useEffect(() => {
    fetchFeatures().then(res => setFeatures(res.variables)).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const payload: Record<string, number> = {};
    features.forEach(f => payload[f] = 0);
    Object.keys(FIXED_VALUES).forEach(k => { if (features.includes(k)) payload[k] = FIXED_VALUES[k]; });
    Object.keys(formData).forEach(k => { if (features.includes(k)) payload[k] = (formData as any)[k]; });
    if (features.includes('grupo_edad_meses')) payload['grupo_edad_meses'] = formData.edad_meses;

    try {
      const res = await predictIndividual(payload);
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.detail?.mensaje || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {result && (
        <div className={clsx("p-8 rounded-2xl shadow-lg border relative overflow-hidden transition-all", result.prediccion === 1 ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200")}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            {result.prediccion === 1 ? <ShieldAlert className="w-48 h-48 text-red-600" /> : <CheckCircle className="w-48 h-48 text-emerald-600" />}
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className={clsx("p-4 rounded-full", result.prediccion === 1 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600")}>
              {result.prediccion === 1 ? <ShieldAlert className="w-12 h-12" /> : <CheckCircle className="w-12 h-12" />}
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wider uppercase mb-1 text-slate-500">Resultado Clínico</h3>
              <p className={clsx("text-4xl font-black mb-2", result.prediccion === 1 ? "text-red-700" : "text-emerald-700")}>
                {result.descripcion}
              </p>
              <div className="flex gap-6 mt-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Probabilidad</p>
                  <p className="text-xl font-bold text-slate-800">{(result.probabilidad * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Nivel de Riesgo</p>
                  <p className="text-xl font-bold text-slate-800">{result.riesgo}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-center gap-3 rounded-t-2xl">
          <Activity className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-800">Parámetros Clínicos del Paciente</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Edad del paciente (meses)</label>
              <input type="number" name="edad_meses" value={formData.edad_meses} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Sexo asignado al nacer</label>
              <select name="sexo" value={formData.sexo} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none">
                <option value={1}>Masculino</option>
                <option value={0}>Femenino</option>
              </select>
            </div>
            <div className="space-y-1">
              <Tooltip content="Peso registrado al momento del nacimiento en el centro de salud." position="top">
                <label className="text-sm font-semibold text-slate-700 cursor-help border-b border-dashed border-slate-400">Peso al nacer (gramos)</label>
              </Tooltip>
              <input type="number" name="peso_nacer_gramos" value={formData.peso_nacer_gramos} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none mt-1" />
            </div>
            <div className="space-y-1">
              <Tooltip content="Talla o longitud al momento del nacimiento." position="top">
                <label className="text-sm font-semibold text-slate-700 cursor-help border-b border-dashed border-slate-400">Talla al nacer (cm)</label>
              </Tooltip>
              <input type="number" name="talla_nacer_cm" value={formData.talla_nacer_cm} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none mt-1" />
            </div>
            <div className="space-y-1">
              <Tooltip content="Nacimiento ocurrido antes de las 37 semanas de gestación." position="top">
                <label className="text-sm font-semibold text-slate-700 cursor-help border-b border-dashed border-slate-400">Antecedente de Prematuridad</label>
              </Tooltip>
              <select name="prematuro" value={formData.prematuro} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none mt-1">
                <option value={0}>No</option>
                <option value={1}>Sí</option>
              </select>
            </div>
            <div className="space-y-1">
              <Tooltip content="Tiempo de lactancia materna exclusiva o mixta en meses." position="top">
                <label className="text-sm font-semibold text-slate-700 cursor-help border-b border-dashed border-slate-400">Duración de Lactancia (meses)</label>
              </Tooltip>
              <input type="number" name="lactancia_meses" value={formData.lactancia_meses} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none mt-1" />
            </div>
            <div className="space-y-1">
              <Tooltip content="Presencia de episodios diarreicos clínicamente significativos." position="top">
                <label className="text-sm font-semibold text-slate-700 cursor-help border-b border-dashed border-slate-400">Episodios de diarrea (últimas 2 sem.)</label>
              </Tooltip>
              <select name="diarrea_ultimas_2_semanas" value={formData.diarrea_ultimas_2_semanas} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none mt-1">
                <option value={0}>No</option>
                <option value={1}>Sí</option>
              </select>
            </div>
            <div className="space-y-1">
              <Tooltip content="Infecciones del tracto respiratorio inferior o superior reciente." position="top">
                <label className="text-sm font-semibold text-slate-700 cursor-help border-b border-dashed border-slate-400">Infección respiratoria (últimas 2 sem.)</label>
              </Tooltip>
              <select name="infeccion_respiratoria_2_semanas" value={formData.infeccion_respiratoria_2_semanas} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none mt-1">
                <option value={0}>No</option>
                <option value={1}>Sí</option>
              </select>
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-600/40 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 flex items-center gap-2">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Procesando...</>
              ) : 'Generar Predicción Clínica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PredictionForm;
