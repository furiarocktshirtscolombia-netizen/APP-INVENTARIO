
import React from 'react';
import { ProcessedItem } from '../types';

interface CriticalItemsProps {
  data: ProcessedItem[];
}

const CriticalItems: React.FC<CriticalItemsProps> = ({ data }) => {
  // Usamos los datos filtrados globalmente para garantizar consistencia total
  const displayItems = data;
  
  /**
   * REGLA DE PRIORIZACIÓN SOLICITADA:
   * 1. Ordenar por Valor de Cobro (Absoluto) - Descendente
   * 2. Orden secundario por Unidad de Ajuste / Variación (Absoluto) - Descendente
   */
  const prioritizedByEconomicImpact = [...displayItems].sort((a, b) => {
    // Criterio 1: Valor de Cobro (Impacto Financiero)
    const impactA = Math.abs(a.Cobro);
    const impactB = Math.abs(b.Cobro);
    
    if (impactB !== impactA) {
      return impactB - impactA;
    }
    
    // Criterio 2: Variación de Stock (Impacto Operativo)
    const varA = Math.abs(a["Variación Stock"]);
    const varB = Math.abs(b["Variación Stock"]);
    
    return varB - varA;
  });

  /**
   * Ranking de Variaciones Físicas:
   * Aunque el objetivo es económico, mantenemos un bloque para volumen físico
   * pero priorizamos por Variación absoluta y secundariamente por Cobro.
   */
  const prioritizedByVolume = [...displayItems].sort((a, b) => {
    const varA = Math.abs(a["Variación Stock"]);
    const varB = Math.abs(b["Variación Stock"]);
    
    if (varB !== varA) {
      return varB - varA;
    }
    
    return Math.abs(b.Cobro) - Math.abs(a.Cobro);
  });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ALERTA DINÁMICA: Refleja el estado real del filtro global y la priorización */}
      <div className="bg-slate-900 border-l-8 border-emerald-500 p-8 rounded-r-[32px] shadow-2xl flex items-center gap-8 group">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <i className="fa-solid fa-ranking-star text-4xl"></i>
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Priorización de Impacto Económico</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">
            Los ítems se presentan ordenados por <span className="text-emerald-400">Riesgo Financiero</span> y <span className="text-emerald-400">Desviación Operativa</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* BLOQUE: PRIORIDAD 1 - IMPACTO FINANCIERO ($) */}
        <div className="bg-white border-2 border-slate-100 shadow-xl rounded-[40px] overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 bg-rose-50/30 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                <i className="fa-solid fa-money-bill-trend-up text-rose-500 text-xl"></i>
                Top Impacto Económico ($)
              </h3>
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1">Prioridad de auditoría por valor de liquidación</p>
            </div>
            <div className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
              Nivel de Riesgo
            </div>
          </div>
          <div className="p-8 space-y-4 flex-1">
            {displayItems.length > 0 ? prioritizedByEconomicImpact.slice(0, 15).map((item, idx) => (
              <div key={item.id} className="flex items-center gap-5 p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                <div className="relative">
                  <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black shadow-lg transition-colors ${
                    idx < 3 ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white group-hover:bg-rose-400'
                  }`}>
                    {idx + 1}
                  </span>
                  {idx < 3 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[8px] text-white shadow-sm border border-white">
                      <i className="fa-solid fa-fire"></i>
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 uppercase truncate leading-none mb-2">{item.Artículo}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">{item.Almacén}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{item["Centro de Costos"]}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-base font-black tracking-tighter ${item.Cobro > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {formatCurrency(item.Cobro)}
                  </p>
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Valor Liquidado</p>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center space-y-4">
                <i className="fa-solid fa-circle-info text-5xl text-slate-100"></i>
                <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">Sin datos para priorizar</p>
              </div>
            )}
          </div>
        </div>

        {/* BLOQUE: PRIORIDAD 2 - IMPACTO OPERATIVO (CANTIDAD) */}
        <div className="bg-white border-2 border-slate-100 shadow-xl rounded-[40px] overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 bg-amber-50/30 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                <i className="fa-solid fa-arrow-up-right-dots text-amber-500 text-xl"></i>
                Top Desviación Operativa (Qty)
              </h3>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">Diferencias físicas críticas por volumen</p>
            </div>
            <div className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
              Nivel de Variación
            </div>
          </div>
          <div className="p-8 space-y-4 flex-1">
            {displayItems.length > 0 ? prioritizedByVolume.slice(0, 15).map((item, idx) => (
              <div key={item.id} className="flex items-center gap-5 p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black shadow-lg transition-colors ${
                  idx < 3 ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white group-hover:bg-amber-400'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 uppercase truncate leading-none mb-2">{item.Artículo}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">{item.Almacén}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{item.Unidad}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <p className={`text-base font-black tracking-tighter ${item["Variación Stock"] < 0 ? 'text-rose-600' : item["Variación Stock"] > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {item["Variación Stock"] > 0 ? `+${item["Variación Stock"]}` : item["Variación Stock"]}
                    </p>
                    <span className="text-[10px] font-black text-slate-300">/</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                       {item.Unidad}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Variación Física</p>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center space-y-4">
                <i className="fa-solid fa-circle-info text-5xl text-slate-100"></i>
                <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">Sin datos operativos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PIE DE PÁGINA DE ANÁLISIS CRÍTICO */}
      <div className="bg-slate-50 border-2 border-slate-100 p-8 rounded-[32px] flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-4">
          <i className="fa-solid fa-circle-exclamation text-xl text-emerald-500"></i>
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">
            Los datos presentados consideran el valor absoluto del cobro y la variación física para la priorización operativa.
          </p>
        </div>
        <p className="text-[9px] font-bold uppercase italic">Auditoría Inteligente v2.5 - Prompt Maestro</p>
      </div>
    </div>
  );
};

export default CriticalItems;
