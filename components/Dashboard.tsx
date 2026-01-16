
import React from 'react';
import { SedeMetrics, ProcessedItem } from '../types';
import { getTrafficLightColor } from '../utils/calculations';

interface DashboardProps {
  metrics: SedeMetrics[];
  data: ProcessedItem[];
}

const Dashboard: React.FC<DashboardProps> = ({ metrics, data }) => {
  const sortedMetrics = [...metrics].sort((a, b) => b.globalReliability - a.globalReliability);
  
  // Total a Cobrar: SUM(Cobro_Num)
  const totalCobro = data.reduce((acc, item) => acc + (Number(item.Cobro) || 0), 0);
  const totalCostoAjuste = data.reduce((acc, item) => acc + (Number(item["Costo Ajuste"]) || 0), 0);

  /**
   * CÁLCULO DE CONFIABILIDAD GENERAL (REGLA SOLICITADA)
   * (SUM(Item_Sin_Variacion) / SUM(Total_Item)) * 100
   */
  const itemsSinVariacion = data.filter(item => item.reliability === 1).length;
  const totalItems = data.length;
  const avgReliability = totalItems > 0 ? (itemsSinVariacion / totalItems) * 100 : 100;
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* VISTA: RESUMEN GENERAL (3 TARJETAS GRANDES) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-xl relative overflow-hidden group">
          <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-${getTrafficLightColor(avgReliability)}-500 opacity-10 group-hover:scale-125 transition-transform duration-500`}></div>
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Confiabilidad General (%)</p>
          <p className={`text-6xl font-black text-${getTrafficLightColor(avgReliability)}-600 tracking-tighter`}>
            {avgReliability.toFixed(2)}%
          </p>
          <div className="mt-6 flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full bg-${getTrafficLightColor(avgReliability)}-500 animate-pulse`}></span>
            <p className="text-[10px] font-black text-slate-500 uppercase italic">Basado en ítems sin variación ({itemsSinVariacion}/{totalItems})</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-xl border-b-rose-500 border-b-8 transition-transform hover:scale-[1.02]">
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Total a Cobrar</p>
          <p className="text-5xl font-black text-rose-600 tracking-tighter">
            {formatCurrency(totalCobro)}
          </p>
          <div className="mt-6 flex items-center gap-2">
            <i className="fa-solid fa-hand-holding-dollar text-rose-400"></i>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Liquidación Operativa Total</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-xl transition-transform hover:scale-[1.02]">
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Total Ajuste</p>
          <p className={`text-5xl font-black ${totalCostoAjuste < 0 ? 'text-rose-600' : 'text-emerald-600'} tracking-tighter`}>
            {formatCurrency(totalCostoAjuste)}
          </p>
          <div className="mt-6 flex items-center gap-2">
            <i className="fa-solid fa-scale-balanced text-slate-400"></i>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance Neto del Inventario</p>
          </div>
        </div>
      </div>

      {/* TABLA RESUMEN POR SEDE */}
      <div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2 rounded-lg text-sm">
              <i className="fa-solid fa-list-check"></i>
            </div>
            Resumen General por Almacén
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                <th className="px-10 py-5">Almacén (Sede)</th>
                <th className="px-10 py-5 text-right">Confiabilidad (Cant.)</th>
                <th className="px-10 py-5 text-right">Total Cobro</th>
                <th className="px-10 py-5 text-right">Total Ajuste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedMetrics.map(m => (
                <tr key={m.almacen} className="hover:bg-slate-50/80 transition-all duration-300">
                  <td className="px-10 py-7 font-black text-slate-700 uppercase tracking-tight text-sm">{m.almacen}</td>
                  <td className={`px-10 py-7 text-right font-black text-xl text-${getTrafficLightColor(m.globalReliability)}-600`}>
                    {m.globalReliability.toFixed(2)}%
                  </td>
                  <td className="px-10 py-7 text-right font-black text-rose-600 text-lg">
                    {formatCurrency(m.totalCobro)}
                  </td>
                  <td className={`px-10 py-7 text-right font-bold text-sm ${m.totalCostoAjuste < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatCurrency(m.totalCostoAjuste)}
                  </td>
                </tr>
              ))}
              {sortedMetrics.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <i className="fa-solid fa-folder-open text-5xl text-slate-100"></i>
                      <p className="text-slate-300 font-black uppercase tracking-widest text-xs">No hay datos de sedes disponibles</p>
                    </div>
                  </td>
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
