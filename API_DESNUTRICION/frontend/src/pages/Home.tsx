import React from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, Activity, AlertTriangle, MapPin } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Activity className="w-64 h-64 text-blue-600" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-medium text-sm mb-6 shadow-sm">
            <MapPin className="w-4 h-4" />
            Prototipo académico · ENSANUT 2018
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Clasificación de desnutrición crónica infantil
          </h1>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Herramienta exploratoria que estima, con un modelo de Machine Learning entrenado con microdatos de la ENSANUT 2018,
            la condición observada de niños de 0 a 59 meses. No anticipa casos futuros ni constituye un diagnóstico clínico.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/batch-predict" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">Clasificar un archivo</Link>
            <Link to="/metrics" className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">Ver métricas del modelo</Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Alcance</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Modelo entrenado con registros de todo el país y evaluado por separado para Tungurahua. Con pocos registros
            provinciales, las estimaciones locales son imprecisas.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Clasificación por archivo</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Cargue un archivo CSV con las 114 variables del modelo y descargue una hoja de Excel con la clase estimada y la
            puntuación de cada registro.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Límites</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            El desempeño es moderado y no se validó con datos externos. La puntuación no es una probabilidad calibrada.
            Consulte la sección de métricas antes de interpretar un resultado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
