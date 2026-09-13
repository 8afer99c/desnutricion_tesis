import React, { useState } from 'react';
import { predictMasiva } from '../services/api';
import { Upload } from 'lucide-react';

const BatchPrediction: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const response = await predictMasiva(file);
      // Create a link to download the blob
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'resultado_prediccion.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError('Ocurrió un error al procesar el archivo. Verifique el formato.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Predicción masiva</h2>
        <p className="text-gray-600 mb-8">
          Cargue un archivo (.csv, .xlsx) con los registros infantiles para que el sistema realice la predicción automática del riesgo de desnutrición crónica.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
            <Upload className="w-10 h-10 text-gray-400 mb-4" />
            <label htmlFor="file-upload" className="cursor-pointer text-blue-600 font-medium hover:text-blue-800">
              Seleccione un archivo
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".csv,.xlsx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">
              {file ? file.name : 'CSV o Excel soportados'}
            </p>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analizando archivo...' : 'Analizar archivo'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BatchPrediction;
