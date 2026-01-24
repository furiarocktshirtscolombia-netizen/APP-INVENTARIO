
import React from 'react';
import { SedeMetrics, ProcessedItem } from '../types';
import { getTrafficLightColor, getStatusLabel } from '../utils/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  metrics: SedeMetrics[];
  data: ProcessedItem[];
  onSelectCC: (cc: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ metrics, data, onSelectCC }) => {
  const totalCobro = data.reduce((acc, item) => {
    const val = item.Estado_Normalizado === 'Faltantes' ? -item.Cobro : item.Cobro;
    return acc + val;
  }, 0);
  
  const totalCostoAjuste = data.reduce((acc, item) => acc + (item["Costo Ajuste"] || 0), 0);
  const perfectItems = data.filter(item => item.reliability === 1).length;
  const totalItems = data.length;
  const avgReliability = totalItems > 0 ? (perfectItems / totalItems) * 100 : 0;

  const sortedMetrics = [...metrics].sort((a,b) => a.globalReliability - b.globalReliability);
  const mostCriticalSede = sortedMetrics[0];
  
  const ccGroups = data.reduce((acc, item) => {
    const cc = item["Centro de Costos"] || 'General';
    if (!acc[cc]) acc[cc] = { name: cc, total: 0, perfect: 0 };
    acc[cc].total++;
    if (item.reliability === 1) acc[cc].perfect++;
    return acc;
  }, {} as Record<string, { name: string, total: number, perfect: number }>);

  const chartData = Object.values(ccGroups).map((g: any) => ({
    name: g.name,
    value: g.total,
    reliability: (g.perfect / g.total) * 100,
    itemCount: g.total
  })).sort((a, b) => b.value - a.value);

  const getCCColor = (name: string) => {
    const n = name.toUpperCase();
    if (n.includes('BAR')) return '#10b981';
    if (n.includes('COCINA')) return '#f43f5e';
    return '#94a3b8';
  };

  const formatCurrency = (val: number) => {
    const formatted = new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(Math.abs(val));
    return val < 0 ? `-${formatted}` : formatted;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-slate-900 rounded-[40px] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 border-b-[10px] border-rose-600 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5"><i className="fa-solid fa-triangle-exclamation text-9xl"></i></div>
        <div className="flex items-center gap-8 relative z-10">
          <div className="bg-rose-600 w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg shadow-rose-900/40 animate-pulse"><i className="fa-solid fa-fire-flame-curved text-4xl"></i></div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-rose-400 mb-2">⚠️ Acción Crítica Requerida</h3>
            <p className="text-3xl font-black uppercase tracking-tight leading-none">Punto Crítico: <span className="text-rose-500">{mostCriticalSede?.almacen || '---'}</span></p>
            <div className="flex gap-6 mt-4">
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-[10px] font-bold text-slate-400 uppercase">Salud Operativa: {mostCriticalSede?.globalReliability.toFixed(1)}%</span></div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-[10px] font-bold text-slate-400 uppercase">Costo General: {formatCurrency(totalCobro)}</span></div>
            </div>
          </div>
        </div>
        <button onClick={() => onSelectCC('Cocina')} className="relative z-10 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 transition-all shadow-xl active:scale-95">Verificar Centro de Riesgo</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl relative overflow-hidden group">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Confiabilidad Operativa</p>
          <p className={`text-6xl font-black text-${getTrafficLightColor(avgReliability)}-600 tracking-tighter`}>{avgReliability.toFixed(1)}%</p>
          <div className="mt-6 flex flex-col gap-1">
             <p className="text-[11px] font-black text-slate-800 uppercase">Estado: {getStatusLabel(avgReliability)}</p>
             <p className="text-[9px] font-medium text-slate-400 uppercase italic">Refleja la precisión física vs sistema.</p>
          </div>
          <div className={`absolute bottom-0 left-0 h-2 bg-${getTrafficLightColor(avgReliability)}-600`} style={{ width: `${avgReliability}%` }}></div>
        </div>
        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl border-b-8 border-b-rose-500 group">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Liquidación por Cobro</p>
          <p className="text-5xl font-black text-rose-600 tracking-tighter">{formatCurrency(totalCobro)}</p>
          <div className="mt-6">
             <p className="text-[11px] font-black text-slate-800 uppercase">Monto Recuperable</p>
             <p className="text-[9px] font-medium text-slate-400 uppercase italic">Valor a descontar por pérdidas injustificadas.</p>
          </div>
        </div>
        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl border-b-8 border-b-emerald-500">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Balance Neto (Ajustes)</p>
          <p className={`text-5xl font-black tracking-tighter ${totalCostoAjuste < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(totalCostoAjuste)}</p>
          <div className="mt-6">
             <p className="text-[11px] font-black text-slate-800 uppercase">Impacto en Resultados</p>
             <p className="text-[9px] font-medium text-slate-400 uppercase italic">Diferencia neta entre faltantes y sobrantes.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl flex flex-col">
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Confiabilidad por Centro de Costo</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-8 tracking-widest">Distribución del riesgo operativo</p>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none" animationDuration={1500} label={(entry: any) => `${entry.name}: ${entry.reliability.toFixed(1)}%`} labelLine={true}>
                    {chartData.map((e: any, i: number) => <Cell key={`c-${i}`} fill={getCCColor(e.name)} />)}
                  </Pie>
                  <Tooltip formatter={(value: any, name: any, props: any) => [`${props.payload.reliability.toFixed(1)}%`, 'Confiabilidad']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-3 w-full">
              {chartData.map((cd: any) => (
                <div key={cd.name} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:shadow-lg">
                  <div className="flex items-center gap-4">
                     <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getCCColor(cd.name) }}></div>
                     <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{cd.name}</p>
                        <p className={`text-xs font-black uppercase ${cd.reliability < 60 ? 'text-rose-600' : cd.reliability < 85 ? 'text-amber-500' : 'text-emerald-600'}`}>
                           {cd.reliability.toFixed(1)}% — {getStatusLabel(cd.reliability)}
                        </p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Impacto</p>
                     <p className="text-xs font-black text-slate-800 uppercase">{cd.itemCount} Ítems</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center"><h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3"><i className="fa-solid fa-ranking-star text-emerald-600"></i> Auditoría por Sede</h3></div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100"><th className="px-8 py-5">Almacén</th><th className="px-8 py-5">CONFIABILIDAD DE INVENTARIOS</th><th className="px-8 py-5 text-right">Monto Neto</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {metrics.map(m => {
                  const color = getTrafficLightColor(m.globalReliability);
                  const statusLabel = getStatusLabel(m.globalReliability);
                  return (
                    <React.Fragment key={m.almacen}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6"><p className="font-black text-slate-800 uppercase text-sm">{m.almacen}</p><p className="text-[9px] text-slate-400 font-bold uppercase">{m.itemCount} productos auditados</p></td>
                        <td className="px-8 py-6 min-w-[220px]">
                          <div className="flex flex-col gap-2">
                             <div className="flex justify-between items-end"><span className={`text-[10px] font-black uppercase text-${color}-600`}>{statusLabel}</span><span className="text-xs font-black text-slate-900">{m.globalReliability.toFixed(1)}%</span></div>
                             <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50"><div className={`h-full bg-${color}-600 transition-all duration-1000 ease-out`} style={{ width: `${m.globalReliability}%` }} /></div>
                          </div>
                        </td>
                        <td className={`px-8 py-6 text-right font-black text-sm ${m.totalCobro < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(m.totalCobro)}</td>
                      </tr>
                      <tr className="bg-slate-50/30">
                         <td colSpan={3} className="px-8 py-3">
                            <div className="flex gap-3">
                               {Object.entries(m.ccMetrics).map(([cc, data]: [string, any]) => (
                                  <div key={cc} className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-xl shadow-sm"><div className={`w-2.5 h-2.5 rounded-full bg-${getTrafficLightColor(data.reliability)}-600`}></div><span className="text-[9px] font-black text-slate-400 uppercase">{cc}</span></div>
                               ))}
                            </div>
                         </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
