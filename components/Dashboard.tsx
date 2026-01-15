
import React from 'react';
import { SedeMetrics, ProcessedItem } from '../types';
import { getTrafficLightColor } from '../utils/calculations';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface DashboardProps {
  metrics: SedeMetrics[];
  data: ProcessedItem[];
}

const Dashboard: React.FC<DashboardProps> = ({ metrics, data }) => {
  const sortedMetrics = [...metrics].sort((a, b) => b.globalReliability - a.globalReliability);
  
  const totalCobro = metrics.reduce((acc, m) => acc + m.totalCobro, 0);
  const totalCostoAjuste = metrics.reduce((acc, m) => acc + m.totalCostoAjuste, 0);

  // Confiabilidad Global Ponderada (Ponderada por el peso económico total de todas las sedes)
  const totalWeightedReliabilitySum = metrics.reduce((acc, m) => acc + (m.globalReliability * (Math.abs(m.totalCostoAjuste) || 1)), 0);
  const totalWeight = metrics.reduce((acc, m) => acc + (Math.abs(m.totalCostoAjuste) || 1), 0);
  const avgReliability = totalWeight > 0 ? totalWeightedReliabilitySum / totalWeight : 100;
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8">
      {/* 3 TARJETAS GRANDES SOLICITADAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full bg-${getTrafficLightColor(avgReliability)}-500 opacity-10 group-hover:scale-150 transition-transform`}></div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Confiabilidad General</p>
          <p className={`text-5xl font-black text-${getTrafficLightColor(avgReliability)}-600 tracking-tighter`}>
            {avgReliability.toFixed(2)}%
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full bg-${getTrafficLightColor(avgReliability)}-500 animate-pulse`}></span>
            <p className="text-xs font-bold text-slate-400 uppercase">Indicador Ponderado por Costo</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Total a Cobrar</p>
          <p className="text-4xl font-black text-rose-600 tracking-tighter">
            {formatCurrency(totalCobro)}
          </p>
          <p className="mt-4 text-xs font-bold text-slate-400 uppercase">Impacto en Pérdidas Operativas</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Total Ajuste</p>
          <p className={`text-4xl font-black ${totalCostoAjuste < 0 ? 'text-rose-600' : 'text-emerald-600'} tracking-tighter`}>
            {formatCurrency(totalCostoAjuste)}
          </p>
          <p className="mt-4 text-xs font-bold text-slate-400 uppercase">Variación Neta del Inventario</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ranking Visual */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold mb-6 text-slate-800">Ranking por Sede (Almacén)</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedMetrics} layout="vertical" margin={{ left: 40, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="almacen" type="category" width={100} tick={{ fontSize: 12, fontWeight: 500 }} stroke="#64748b" />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Confiabilidad']}
                />
                <Bar dataKey="globalReliability" radius={[0, 4, 4, 0]} barSize={24}>
                  {sortedMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.globalReliability >= 95 ? '#10b981' : entry.globalReliability >= 85 ? '#f59e0b' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla Resumen Solicitada */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-800 uppercase">Resumen por Sede</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase border-b border-slate-100">
                  <th className="px-4 py-3">Almacén</th>
                  <th className="px-4 py-3 text-right">Conf.</th>
                  <th className="px-4 py-3 text-right">Cobro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedMetrics.map(m => (
                  <tr key={m.almacen} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-700">{m.almacen}</td>
                    <td className={`px-4 py-3 text-right font-black text-${getTrafficLightColor(m.globalReliability)}-600`}>
                      {m.globalReliability.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-rose-600">
                      {formatCurrency(m.totalCobro)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
