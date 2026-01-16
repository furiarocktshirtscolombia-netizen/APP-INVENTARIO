
import React from 'react';
import { SedeMetrics, ProcessedItem } from '../types';
import { getTrafficLightColor, getRiskLevelText } from '../utils/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardProps {
  metrics: SedeMetrics[];
  data: ProcessedItem[];
  onSelectCC: (cc: string) => void;
  isDownloadingPDF?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ metrics, data, onSelectCC, isDownloadingPDF = false }) => {
  if (isDownloadingPDF) return null;

  const totalCobro = data.reduce((acc, item) => {
    const val = item.Estado_Normalizado === 'Faltantes' ? -item.Cobro : item.Cobro;
    return acc + val;
  }, 0);
  
  const totalCostoAjuste = data.reduce((acc, item) => acc + (item["Costo Ajuste"] || 0), 0);
  const perfectItems = data.filter(item => item.reliability === 1).length;
  const totalItems = data.length;
  const avgReliability = totalItems > 0 ? (perfectItems / totalItems) * 100 : null;

  // Calculamos Foco de Atención
  const mostCriticalSede = [...metrics].sort((a,b) => a.globalReliability - b.globalReliability)[0];
  
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

  const formatCurrency = (val: number) => {
    const formatted = new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(Math.abs(val));
    return val < 0 ? `-${formatted}` : formatted;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* TARJETA DE FOCO DE ATENCIÓN (Prioridad de acción) */}
      <div className="bg-slate-900 rounded-[40px] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 border-b-8 border-rose-600">
        <div className="flex items-center gap-6">
          <div className="bg-rose-600 p-4 rounded-3xl animate-pulse">
            <i className="fa-solid fa-bullseye text-3xl"></i>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-rose-400 mb-1">Foco de Atención Hoy</h3>
            <p className="text-xl font-black uppercase">Sede más crítica: <span className="text-rose-500">{mostCriticalSede?.almacen || 'N/A'}</span></p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-2 border-l border-white/10 pl-8">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase">Impacto Estimado</p>
            <p className="text-lg font-black text-rose-500">{formatCurrency(totalCobro)}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase">Centro de Riesgo</p>
            <p className="text-lg font-black text-emerald-400">Cocina</p>
          </div>
        </div>
      </div>

      {/* TARJETAS KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl transition-transform hover:scale-[1.02]">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Confiabilidad Operativa</p>
          {avgReliability !== null ? (
            <>
              <p className={`text-6xl font-black text-${getTrafficLightColor(avgReliability)}-600 tracking-tighter`}>{avgReliability.toFixed(1)}%</p>
              <p className="text-[10px] font-black text-slate-500 uppercase mt-4 italic">Entre más alto, menor riesgo de pérdidas</p>
            </>
          ) : (
            <p className="text-4xl font-black text-slate-300">SIN DATOS</p>
          )}
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl border-b-8 border-b-rose-500 transition-transform hover:scale-[1.02]">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Liquidación por Cobro</p>
          <p className="text-5xl font-black text-rose-600 tracking-tighter">{formatCurrency(totalCobro)}</p>
          <p className="text-[10px] font-black text-slate-500 uppercase mt-4">Valor recuperable por diferencias</p>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-xl border-b-8 border-b-emerald-500 transition-transform hover:scale-[1.02]">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Balance de Inventario</p>
          <p className={`text-5xl font-black tracking-tighter ${totalCostoAjuste < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatCurrency(totalCostoAjuste)}
          </p>
          <p className="text-[10px] font-black text-slate-500 uppercase mt-4">Impacto neto del ajuste de stock</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GRÁFICO CIRCULAR REFORZADO */}
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-2xl flex flex-col">
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Confiabilidad por Centro de Costo</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-8 tracking-widest">Distribución del riesgo operativo</p>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none" onClick={(d) => onSelectCC(d.name)} className="cursor-pointer">
                    {chartData.map((e, i) => <Cell key={`c-${i}`} fill={getCCColor(e.name)} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* LEYENDAS EXPLICATIVAS (Risk Guide) */}
            <div className="mt-8 grid grid-cols-2 gap-4 w-full">
              {chartData.map(cd => (
                <div key={cd.name} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400">{cd.name}</p>
                    <p className={`text-xs font-black text-${getTrafficLightColor(cd.value)}-600 uppercase`}>{getRiskLevelText(cd.value).split(' ')[1]}</p>
                  </div>
                  <p className="text-xl font-black text-slate-800">{cd.value.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TABLA DE RESUMEN CON BARRA DE PROGRESO */}
        <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <i className="fa-solid fa-list-check text-emerald-600"></i> Estado de Auditoría por Sede
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                  <th className="px-8 py-5">Sede / Almacén</th>
                  <th className="px-8 py-5">Visualización de Salud</th>
                  <th className="px-8 py-5 text-right">Monto Neto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {metrics.map(m => {
                  const color = getTrafficLightColor(m.globalReliability);
                  return (
                    <React.Fragment key={m.almacen}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <p className="font-black text-slate-800 uppercase text-sm">{m.almacen}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{m.itemCount} ítems auditados</p>
                        </td>
                        <td className="px-8 py-6 min-w-[200px]">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                              <div 
                                className={`h-full bg-${color}-600 transition-all duration-1000 ease-out`}
                                style={{ width: `${m.globalReliability}%` }}
                              />
                            </div>
                            <span className={`text-sm font-black text-${color}-600 w-12 text-right`}>
                              {m.globalReliability.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className={`px-8 py-6 text-right font-black ${m.totalCobro < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {formatCurrency(m.totalCobro)}
                        </td>
                      </tr>
                      {/* Semáforo por Centro de Costo (Mini Tabla) */}
                      <tr className="bg-slate-50/20">
                        <td colSpan={3} className="px-8 py-2">
                          <div className="flex gap-4">
                            {Object.entries(m.ccMetrics).map(([ccName, ccData]) => {
                               const ccColor = getTrafficLightColor(ccData.reliability);
                               return (
                                 <div key={ccName} className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-100 rounded-xl">
                                    <div className={`w-2 h-2 rounded-full bg-${ccColor}-600 shadow-[0_0_8px] shadow-${ccColor}-600/50`}></div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase">{ccName}</span>
                                 </div>
                               );
                            })}
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
      
      {/* GUÍA DE SEMAFORIZACIÓN (Pies de Dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="w-4 h-4 rounded-full bg-emerald-600"></div>
          <p className="text-[10px] font-black text-emerald-700 uppercase">≥ 85% Confiable (Meta operativa alcanzada)</p>
        </div>
        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <div className="w-4 h-4 rounded-full bg-amber-500"></div>
          <p className="text-[10px] font-black text-amber-700 uppercase">60% - 84% Atención (Requiere supervisión)</p>
        </div>
        <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100">
          <div className="w-4 h-4 rounded-full bg-rose-600"></div>
          <p className="text-[10px] font-black text-rose-700 uppercase">&lt; 60% Crítico (Acción inmediata requerida)</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
