import React from 'react';
import { ShieldCheck, Activity, Users } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Activity className="w-64 h-64 text-blue-600" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-medium text-sm mb-6 shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            Modelo XGBoost Clínico v2.0
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Plataforma de Predicción de Riesgo Nutricional
          </h1>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Una herramienta avanzada de soporte a la decisión clínica para la detección temprana de la desnutrición crónica infantil mediante algoritmos de Machine Learning.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Detección Temprana</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Identifica indicadores de riesgo antes de que se presenten síntomas clínicos severos de retraso en el crecimiento.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Vigilancia Epidemiológica</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Permite la carga masiva de registros infantiles para mapear y enfocar los esfuerzos de salud pública en zonas de alto riesgo.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Respaldo Científico</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Modelo entrenado con múltiples variables socio-demográficas, antropométricas y de historial clínico para máxima precisión.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
