
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
  const totalCobro = data.reduce((acc, item) => acc + (item.Cobro || 0), 0);
  const totalCostoAjuste = data.reduce((acc, item) => acc + (item["Costo Ajuste"] || 0), 0);
  const perfectItems = data.filter(item => item.reliability === 1).length;
  const totalItems = data.length;
  const avgReliability = totalItems > 0 ? (perfectItems / totalItems) * 100 : null;

  // Datos para el Gráfico por CC
  const ccGroups = data.reduce((acc, item) => {
    const cc = item["Centro de Costos"] || 'General';
    if (!acc[cc]) acc[cc] = { name: cc, total: 0, perfect: 0 };
    acc[cc].total++;
    if (item.reliability === 1) acc[cc].perfect++;
    return acc;
  }, {} as Record<string, { name: string, total: number, perfect: number }>);

  const chartData = Object.values(ccGroups).map(g => ({
    name: g.name,
    value: (g.perfect / g.total) * 100,
    itemCount: g.total,
    perfectCount: g.perfect
  })).sort((a, b) => b.value - a.value);

  const getCCColor = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes('BAR')) return '#10b981'; // Verde
    if (n.includes('COCINA')) return '#0ea5e9'; // Azul
    return '#94a3b8'; // Gris
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* TARJETAS KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl relative overflow-hidden group">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Confiabilidad Operativa</p>
          {avgReliability !== null ? (
            <>
              <p className={`text-6xl font-black text-${getTrafficLightColor(avgReliability)}-600 tracking-tighter`}>{avgReliability.toFixed(2)}%</p>
              <p className="text-[10px] font-black text-slate-500 uppercase mt-4 italic">{perfectItems} de {totalItems} ítems sin variaciones</p>
            </>
          ) : (
            <p className="text-4xl font-black text-slate-300">SIN DATOS</p>
          )}
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl border-b-8 border-b-rose-500">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Liquidación por Cobro</p>
          <p className="text-5xl font-black text-rose-600 tracking-tighter">{formatCurrency(totalCobro)}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase mt-4">Valor total recuperable</p>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl border-b-8 border-b-emerald-500">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Costo de Ajuste Neto</p>
          <p className={`text-5xl font-black tracking-tighter ${totalCostoAjuste < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatCurrency(totalCostoAjuste)}
          </p>
          <p className="text-[10px] font-black text-slate-500 uppercase mt-4">Pérdida/Ganancia Inventario</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GRÁFICO POR CC */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl">
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-8">Confiabilidad por Centro de Costo (%)</h3>
          <div className="h-64 w-full print:h-40">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none" onClick={(d) => onSelectCC(d.name)} className="cursor-pointer">
                    {chartData.map((e, i) => <Cell key={`c-${i}`} fill={getCCColor(e.name)} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300 font-black">SIN DATOS</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {chartData.slice(0, 2).map(item => (
              <div key={item.name} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 group cursor-pointer hover:border-emerald-500 transition-all" onClick={() => onSelectCC(item.name)}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCCColor(item.name) }}></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</p>
                </div>
                <p className="text-3xl font-black text-slate-800 tracking-tighter">{item.value.toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* TABLA SEDES */}
        <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3"><i className="fa-solid fa-list-check text-emerald-600"></i> Desempeño por Almacén</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-8 py-5">Sede</th>
                  <th className="px-8 py-5 text-right">Confiabilidad</th>
                  <th className="px-8 py-5 text-right">Cobro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {metrics.map(m => (
                  <tr key={m.almacen} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6 font-black text-slate-700 uppercase text-sm">{m.almacen}</td>
                    <td className={`px-8 py-6 text-right font-black text-lg text-${getTrafficLightColor(m.globalReliability)}-600`}>{m.globalReliability.toFixed(2)}%</td>
                    <td className="px-8 py-6 text-right font-black text-rose-600">{formatCurrency(m.totalCobro)}</td>
                  </tr>
                ))}
                {metrics.length === 0 && <tr><td colSpan={3} className="p-20 text-center text-slate-300 font-black uppercase italic">Sin registros para el periodo</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
