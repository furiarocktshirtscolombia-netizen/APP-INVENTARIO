
import React from 'react';
import { SedeMetrics, ProcessedItem } from '../types';
import { getTrafficLightColor } from '../utils/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardProps {
  metrics: SedeMetrics[];
  data: ProcessedItem[];
  onSelectCC: (cc: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ metrics, data, onSelectCC }) => {
  const sortedMetrics = [...metrics].sort((a, b) => b.globalReliability - a.globalReliability);
  
  const totalCobro = data.reduce((acc, item) => acc + (Number(item.Cobro) || 0), 0);
  const totalCostoAjuste = data.reduce((acc, item) => acc + (Number(item["Costo Ajuste"]) || 0), 0);

  // Confiabilidad Global (Fórmula solicitada: ítems sin variación / total)
  const itemsSinVariacion = data.filter(item => Number(item["Variación Stock"]) === 0).length;
  const totalItems = data.length;
  const avgReliability = totalItems > 0 ? (itemsSinVariacion / totalItems) * 100 : 100;

  // Cálculo de métricas por Centro de Costo para el Gráfico
  const ccGroups = data.reduce((acc, item) => {
    const cc = item["Centro de Costos"] || 'General';
    if (!acc[cc]) acc[cc] = { name: cc, total: 0, perfect: 0 };
    acc[cc].total++;
    if (Number(item["Variación Stock"]) === 0) acc[cc].perfect++;
    return acc;
  }, {} as Record<string, { name: string, total: number, perfect: number }>);

  const chartData = Object.values(ccGroups).map(g => ({
    name: g.name,
    value: (g.perfect / g.total) * 100,
    itemCount: g.total,
    perfectCount: g.perfect
  })).sort((a, b) => b.value - a.value);

  const COLORS = {
    'BAR': '#10b981', // Emerald 500
    'COCINA': '#0ea5e9', // Sky 500
    'BARRA': '#10b981',
    'DEFAULT': '#94a3b8' // Slate 400
  };

  const getCCColor = (name: string) => {
    const upper = name.toUpperCase();
    if (upper.includes('BAR')) return COLORS.BAR;
    if (upper.includes('COCINA')) return COLORS.COCINA;
    return COLORS.DEFAULT;
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* TARJETAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden group">
          <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-${getTrafficLightColor(avgReliability)}-500 opacity-10 group-hover:scale-125 transition-transform duration-500`}></div>
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Confiabilidad Operativa (%)</p>
          <p className={`text-6xl font-black text-${getTrafficLightColor(avgReliability)}-600 tracking-tighter`}>
            {avgReliability.toFixed(2)}%
          </p>
          <div className="mt-6 flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full bg-${getTrafficLightColor(avgReliability)}-500 animate-pulse`}></span>
            <p className="text-[10px] font-black text-slate-500 uppercase italic">Basado en {totalItems} ítems auditados</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl">
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Total a Cobrar</p>
          <p className="text-5xl font-black text-rose-600 tracking-tighter">
            {formatCurrency(totalCobro)}
          </p>
          <div className="mt-6 flex items-center gap-2 text-rose-400">
            <i className="fa-solid fa-hand-holding-dollar"></i>
            <p className="text-[10px] font-black text-slate-500 uppercase">Impacto Financiero Directo</p>
          </div>
        </div>

        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl">
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Balance de Ajuste</p>
          <p className={`text-5xl font-black ${totalCostoAjuste < 0 ? 'text-rose-600' : 'text-emerald-600'} tracking-tighter`}>
            {formatCurrency(totalCostoAjuste)}
          </p>
          <div className="mt-6 flex items-center gap-2">
            <i className="fa-solid fa-scale-balanced text-slate-400"></i>
            <p className="text-[10px] font-black text-slate-500 uppercase">Estado Neto del Inventario</p>
          </div>
        </div>
      </div>

      {/* SECCIÓN VISUAL: CONFIABILIDAD POR CENTRO DE COSTO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-2xl flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                Confiabilidad por Centro de Costo (%)
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Identifique fallas en Bar o Cocina</p>
            </div>
            <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">
              Análisis Visual
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  onClick={(data) => onSelectCC(data.name)}
                  className="cursor-pointer"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCCColor(entry.name)} className="hover:opacity-80 transition-opacity" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: '900', fontSize: '12px' }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Confiabilidad']}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {chartData.slice(0, 2).map(item => (
              <div 
                key={item.name} 
                className="bg-slate-50 p-6 rounded-[28px] border border-slate-100 group cursor-pointer hover:border-emerald-500 transition-all"
                onClick={() => onSelectCC(item.name)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCCColor(item.name) }}></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</p>
                </div>
                <p className="text-3xl font-black text-slate-800 tracking-tighter">{item.value.toFixed(1)}%</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">
                  {item.perfectCount} de {item.itemCount} ítems sin novedad
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* TABLA RESUMEN POR SEDE */}
        <div className="bg-white rounded-[40px] shadow-2xl border-2 border-slate-100 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <i className="fa-solid fa-list-check text-emerald-600"></i>
              Desempeño por Almacén
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
              Sedes: {sortedMetrics.length}
            </span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-8 py-5">Almacén (Sede)</th>
                  <th className="px-8 py-5 text-right">Confiabilidad</th>
                  <th className="px-8 py-5 text-right">Total Cobro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedMetrics.map(m => (
                  <tr key={m.almacen} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6 font-black text-slate-700 uppercase tracking-tight text-sm">
                      {m.almacen}
                      <p className="text-[9px] text-slate-400 mt-0.5 font-bold italic">{m.itemCount} registros</p>
                    </td>
                    <td className={`px-8 py-6 text-right font-black text-lg text-${getTrafficLightColor(m.globalReliability)}-600`}>
                      {m.globalReliability.toFixed(2)}%
                    </td>
                    <td className="px-8 py-6 text-right font-black text-rose-600">
                      {formatCurrency(m.totalCobro)}
                    </td>
                  </tr>
                ))}
                {sortedMetrics.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-sm italic">
                      No se encontraron registros para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
