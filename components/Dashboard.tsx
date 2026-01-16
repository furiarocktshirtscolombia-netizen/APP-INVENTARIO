
import React from 'react';
import { SedeMetrics, ProcessedItem } from '../types';
import { getTrafficLightColor } from '../utils/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardProps {
  metrics: SedeMetrics[];
  data: ProcessedItem[];
  onSelectCC: (cc: string) => void;
  isDownloadingPDF?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ metrics, data, onSelectCC, isDownloadingPDF = false }) => {
  /** 
   * REGLA OBLIGATORIA:
   * Si exportMode (isDownloadingPDF) es true, NO renderizar el componente.
   * Esto asegura que Recharts se desmonte físicamente del DOM, evitando errores
   * de dimensiones width(-1)/height(-1) durante la captura de html2canvas.
   */
  if (isDownloadingPDF) {
    console.log("Dashboard UNMOUNTED for PDF export");
    return null;
  }

  const totalCobro = data.reduce((acc, item) => acc + (item.Cobro || 0), 0);
  const totalCostoAjuste = data.reduce((acc, item) => acc + (item["Costo Ajuste"] || 0), 0);
  const perfectItems = data.filter(item => item.reliability === 1).length;
  const totalItems = data.length;
  const avgReliability = totalItems > 0 ? (perfectItems / totalItems) * 100 : null;

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
    if (n.includes('BAR')) return '#10b981';
    if (n.includes('COCINA')) return '#0ea5e9';
    return '#94a3b8';
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* TARJETAS KPI (Visual solo en pantalla) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Confiabilidad Operativa</p>
          {avgReliability !== null ? (
            <>
              <p className={`text-6xl font-black text-${getTrafficLightColor(avgReliability)}-600 tracking-tighter`}>{avgReliability.toFixed(2)}%</p>
              <p className="text-[10px] font-black text-slate-500 uppercase mt-4 italic">{perfectItems} de {totalItems} ítems perfectos</p>
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
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Balance de Inventario</p>
          <p className={`text-5xl font-black tracking-tighter ${totalCostoAjuste < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatCurrency(totalCostoAjuste)}
          </p>
          <p className="text-[10px] font-black text-slate-500 uppercase mt-4">Costo de Ajuste Neto</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GRÁFICO CIRCULAR - Se desmonta en exportMode */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl">
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-8">Confiabilidad por Centro de Costo</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none" onClick={(d) => onSelectCC(d.name)} className="cursor-pointer">
                  {chartData.map((e, i) => <Cell key={`c-${i}`} fill={getCCColor(e.name)} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TABLA DE RESUMEN POR SEDE CON DESGLOSE CC */}
        <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <i className="fa-solid fa-list-check text-emerald-600"></i> Resumen de Auditoría por Sede
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-8 py-5">Almacén / Sede / Detalle CC</th>
                  <th className="px-8 py-5 text-right">Confiabilidad</th>
                  <th className="px-8 py-5 text-right">Monto Cobro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {metrics.map(m => (
                  <React.Fragment key={m.almacen}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-4 font-black text-slate-800 uppercase text-sm">{m.almacen}</td>
                      <td className={`px-8 py-4 text-right font-black text-lg text-${getTrafficLightColor(m.globalReliability)}-600`}>{m.globalReliability.toFixed(2)}%</td>
                      <td className="px-8 py-4 text-right font-black text-rose-600">{formatCurrency(m.totalCobro)}</td>
                    </tr>
                    {Object.entries(m.ccMetrics).map(([ccName, ccData]) => (
                      <tr key={`${m.almacen}-${ccName}`} className="bg-slate-50/30">
                        <td className="px-12 py-2 text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                          <span className="text-slate-300 font-normal">└</span> {ccName}
                        </td>
                        <td className={`px-8 py-2 text-right text-[10px] font-black text-${getTrafficLightColor(ccData.reliability)}-600/80`}>
                          {ccData.reliability.toFixed(2)}%
                        </td>
                        <td className="px-8 py-2"></td>
                      </tr>
                    ))}
                  </React.Fragment>
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
