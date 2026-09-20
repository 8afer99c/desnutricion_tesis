import React, { useState } from 'react';
import { predictMasiva, fetchFeatures } from '../services/api';
import { Upload, Download, CheckCircle2 } from 'lucide-react';

const BatchPrediction: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faltantes, setFaltantes] = useState<string[]>([]);
  const [listo, setListo] = useState(false);

  // Genera un CSV con solo el encabezado (las columnas exactas que exige el modelo).
  const descargarPlantilla = async () => {
    const r = await fetchFeatures();
    const blob = new Blob([r.variables.join(',') + '\n'], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plantilla_columnas.csv'; a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true); setError(null); setFaltantes([]); setListo(false);
    try {
      const response = await predictMasiva(file);
      const blob: Blob = response.data;
      // La API responde JSON (no un archivo) cuando el CSV no cumple el formato.
      if (blob.type.includes('json')) {
        const info = JSON.parse(await blob.text());
        setError(info.mensaje || 'El archivo no cumple el formato esperado.');
        setFaltantes(info.faltantes || []);
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', 'resultado_clasificacion.xlsx');
      document.body.appendChild(link); link.click(); link.remove();
      setListo(true);
    } catch (err: any) {
      setError('Ocurrió un error al procesar el archivo. Verifique que sea un CSV con las columnas de la plantilla.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Clasificación por archivo</h2>
        <p className="text-gray-600 mb-4">
          Cargue un archivo <strong>CSV</strong> con un niño por fila y las 114 variables del modelo (nombres de columna exactos). El sistema
          devuelve una hoja de Excel con la clase estimada y la puntuación de cada registro.
        </p>
        <button type="button" onClick={descargarPlantilla}
                className="inline-flex items-center gap-2 text-sm text-blue-700 font-medium hover:text-blue-900 mb-8">
          <Download className="w-4 h-4" /> Descargar plantilla de columnas
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
            <Upload className="w-10 h-10 text-gray-400 mb-4" />
            <label htmlFor="file-upload" className="cursor-pointer text-blue-600 font-medium hover:text-blue-800">
              Seleccione un archivo CSV
              <input id="file-upload" type="file" className="hidden" accept=".csv"
                     onChange={(e) => { setFile(e.target.files?.[0] || null); setError(null); setListo(false); }} />
            </label>
            <p className="text-sm text-gray-500 mt-2">{file ? file.name : 'Solo formato CSV'}</p>
          </div>

          {error && (
            <div className="text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold">{error}</p>
              {faltantes.length > 0 && (
                <p className="mt-2">Columnas faltantes ({faltantes.length}): {faltantes.slice(0, 8).join(', ')}{faltantes.length > 8 ? '…' : ''}</p>
              )}
            </div>
          )}
          {listo && (
            <div className="text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Archivo procesado. Se descargó resultado_clasificacion.xlsx.
            </div>
          )}

          <button type="submit" disabled={!file || loading}
                  className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading ? 'Procesando archivo…' : 'Clasificar archivo'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BatchPrediction;
