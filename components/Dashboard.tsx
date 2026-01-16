
import React from 'react';
import { SedeMetrics, ProcessedItem } from '../types';
import { getTrafficLightColor } from '../utils/calculations';

interface DashboardProps {
  metrics: SedeMetrics[];
  data: ProcessedItem[];
}

const Dashboard: React.FC<DashboardProps> = ({ metrics, data }) => {
  const sortedMetrics = [...metrics].sort((a, b) => b.globalReliability - a.globalReliability);
  
  const totalCobro = metrics.reduce((acc, m) => acc + m.totalCobro, 0);
  const totalCostoAjuste = metrics.reduce((acc, m) => acc + m.totalCostoAjuste, 0);

  // Confiabilidad Global Ponderada (Ponderada por el peso económico ABS Costo Ajuste)
  const totalWeight = metrics.reduce((acc, m) => acc + (Math.abs(m.totalCostoAjuste) || 1), 0);
  const totalWeightedSum = metrics.reduce((acc, m) => acc + (m.globalReliability * (Math.abs(m.totalCostoAjuste) || 1)), 0);
  const avgReliability = totalWeight > 0 ? totalWeightedSum / totalWeight : 100;
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8">
      {/* VISTA: RESUMEN GENERAL (3 TARJETAS GRANDES) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden group">
          <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-${getTrafficLightColor(avgReliability)}-500 opacity-10 group-hover:scale-125 transition-transform duration-500`}></div>
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Confiabilidad General (%)</p>
          <p className={`text-6xl font-black text-${getTrafficLightColor(avgReliability)}-600 tracking-tighter`}>
            {avgReliability.toFixed(2)}%
          </p>
          <div className="mt-6 flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full bg-${getTrafficLightColor(avgReliability)}-500 animate-pulse`}></span>
            <p className="text-[10px] font-black text-slate-500 uppercase italic">Indicador de Calidad Ponderado</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl">
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Total a Cobrar</p>
          <p className="text-5xl font-black text-rose-600 tracking-tighter">
            {formatCurrency(totalCobro)}
          </p>
          <div className="mt-6 flex items-center gap-2">
            <i className="fa-solid fa-hand-holding-dollar text-rose-400"></i>
            <p className="text-[10px] font-black text-slate-500 uppercase">Impacto Operativo Total</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl">
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Total Ajuste</p>
          <p className={`text-5xl font-black ${totalCostoAjuste < 0 ? 'text-rose-600' : 'text-emerald-600'} tracking-tighter`}>
            {formatCurrency(totalCostoAjuste)}
          </p>
          <div className="mt-6 flex items-center gap-2">
            <i className="fa-solid fa-scale-balanced text-slate-400"></i>
            <p className="text-[10px] font-black text-slate-500 uppercase">Balance Neto de Inventario</p>
          </div>
        </div>
      </div>

      {/* TABLA RESUMEN POR SEDE */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <i className="fa-solid fa-list-check text-emerald-600"></i>
            Resumen General por Almacén
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
                <th className="px-8 py-4">Almacén (Sede)</th>
                <th className="px-8 py-4 text-right">Confiabilidad</th>
                <th className="px-8 py-4 text-right">Total a Cobrar</th>
                <th className="px-8 py-4 text-right">Total Ajuste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedMetrics.map(m => (
                <tr key={m.almacen} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 font-black text-slate-700 uppercase tracking-tight">{m.almacen}</td>
                  <td className={`px-8 py-6 text-right font-black text-lg text-${getTrafficLightColor(m.globalReliability)}-600`}>
                    {m.globalReliability.toFixed(2)}%
                  </td>
                  <td className="px-8 py-6 text-right font-black text-rose-600">
                    {formatCurrency(m.totalCobro)}
                  </td>
                  <td className={`px-8 py-6 text-right font-bold ${m.totalCostoAjuste < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatCurrency(m.totalCostoAjuste)}
                  </td>
                </tr>
              ))}
              {sortedMetrics.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-slate-300 font-black uppercase tracking-widest">No hay datos de sedes disponibles</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
