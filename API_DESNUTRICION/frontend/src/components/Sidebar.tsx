import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User, Upload, BarChart2, TrendingUp, Activity } from 'lucide-react';
import Tooltip from './Tooltip';
import clsx from 'clsx';
import { fetchInfo } from '../services/api';

const navItems = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/predict', label: 'Clasificación individual', icon: User },
  { to: '/batch-predict', label: 'Clasificación por archivo', icon: Upload },
  { to: '/dashboard', label: 'Indicadores', icon: BarChart2 },
  { to: '/metrics', label: 'Métricas del modelo', icon: TrendingUp },
];

const Sidebar: React.FC = () => {
  const [modelo, setModelo] = useState<string | null>(null);
  const [estado, setEstado] = useState<'cargando' | 'activa' | 'sin-conexion'>('cargando');

  useEffect(() => {
    fetchInfo()
      .then((r) => { setModelo(r.modelo ?? null); setEstado('activa'); })
      .catch(() => setEstado('sin-conexion'));
  }, []);

  return (
    <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-10">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="p-2 bg-blue-600 rounded-lg">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight leading-tight">Desnutrición crónica infantil</h2>
          <p className="text-xs text-slate-400 font-medium tracking-wider uppercase mt-1">Prototipo académico</p>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">Menú</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                  : 'hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5 opacity-90" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-6 border-t border-slate-800">
        <Tooltip content="Modelo que la API tiene cargado. Se consulta en tiempo real al servicio." position="top">
          <div className="bg-slate-800 rounded-xl p-4 cursor-help">
            <p className="text-xs text-slate-400 mb-2">Modelo activo</p>
            <div className="flex items-center gap-2">
              <span className={clsx('relative inline-flex rounded-full h-3 w-3',
                estado === 'activa' ? 'bg-green-500' : estado === 'cargando' ? 'bg-slate-500' : 'bg-red-500')}></span>
              <span className="text-sm font-medium text-white">
                {estado === 'activa' ? (modelo ?? 'Sin dato') : estado === 'cargando' ? 'Consultando…' : 'API sin conexión'}
              </span>
            </div>
          </div>
        </Tooltip>
      </div>
    </aside>
  );
};

export default Sidebar;
