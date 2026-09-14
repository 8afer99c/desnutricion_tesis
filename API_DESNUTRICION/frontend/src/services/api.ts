import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

export const fetchInfo = () => api.get('/info').then(res => res.data);
export const fetchHealth = () => api.get('/health').then(res => res.data);
export const fetchFeatures = () => api.get('/features').then(res => res.data);
export const fetchDashboard = (provincia?: string) => api.get('/dashboard', { params: { provincia } }).then(res => res.data);
export const fetchMetricas = () => api.get('/dashboard/metricas').then(res => res.data);
export const fetchImportancia = () => api.get('/dashboard/importancia').then(res => res.data);
export const fetchRiesgo = () => api.get('/dashboard/riesgo').then(res => res.data);

export const predictIndividual = (datos: Record<string, any>) => api.post('/predict', datos).then(res => res.data);
export const predictMasiva = (file: File) => {
  const formData = new FormData();
  formData.append('archivo', file);
  return api.post('/predict-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
  });
};
