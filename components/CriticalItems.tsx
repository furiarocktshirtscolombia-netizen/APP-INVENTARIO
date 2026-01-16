
import React from 'react';
import { ProcessedItem } from '../types';

interface CriticalItemsProps {
  data: ProcessedItem[];
}

const CriticalItems: React.FC<CriticalItemsProps> = ({ data }) => {
  // Filtramos solo los ítems que tienen alguna desviación (Faltantes o Sobrantes)
  const deviations = data.filter(item => item.Estado !== 'Sin Novedad');
  
  // ALGORITMO DE PRIORIZACIÓN MAESTRO:
  // 1. Impacto Financiero (Cobro) Descendente
  // 2. Impacto Operativo (Variación) Descendente
  const sortedCriticalItems = [...deviations].sort((a, b) => {
    const absCobroA = Math.abs(a.Cobro || 0);
    const absCobroB = Math.abs(b.Cobro || 0);
    
    if (absCobroB !== absCobroA) {
      return absCobroB - absCobroA;
    }
    
    // Desempate por Variación Física
    return Math.abs(b["Variación Stock"] || 0) - Math.abs(a["Variación Stock"] || 0);
  });

  // Top 10 por Variación Física pura (para la segunda tarjeta)
  const topByQuantity = [...deviations].sort((a, b) => 
    Math.abs(b["Variación Stock"]) - Math.abs(a["Variación Stock"])
  );

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* CABECERA ESTRATÉGICA */}
      <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-8 rounded-[40px] shadow-2xl shadow-rose-200 flex items-center gap-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <i className="fa-solid fa-shield-halved text-9xl -rotate-12"></i>
        </div>
        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center flex-shrink-0 border border-white/30">
          <i className="fa-solid fa-triangle-exclamation text-4xl"></i>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Priorización de Auditoría</h2>
          <p className="text-rose-100 font-medium text-lg mt-1">
            Se han identificado <span className="font-black underline">{deviations.length} items</span> con desviaciones críticas ordenados por impacto financiero.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LISTADO DE PRIORIDAD ECONÓMICA (RANKING MAESTRO) */}
        <div className="bg-white border-2 border-slate-100 shadow-2xl rounded-[40px] overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-tighter text-xl flex items-center gap-3">
                <i className="fa-solid fa-sack-dollar text-rose-600"></i>
                Top Impacto de Cobro ($)
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ordenado por valor de recuperación de nómina</p>
            </div>
            <span className="bg-rose-100 text-rose-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Crítico</span>
          </div>
          <div className="p-4 space-y-4 flex-1">
            {sortedCriticalItems.slice(0, 10).map((item, idx) => (
              <div key={item.id} className="flex items-center gap-5 p-5 hover:bg-rose-50/50 rounded-[28px] border-2 border-transparent hover:border-rose-100 transition-all group">
                <div className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-2xl text-sm font-black text-slate-400 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.Artículo}</p>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${item.Estado === 'Faltantes' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                      {item.Estado}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {item.Almacén} • <span className="text-slate-500">{item["Centro de Costos"]}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-rose-600 tracking-tighter">
                    {formatCurrency(item.Cobro)}
                  </p>
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Valor Liquidación</p>
                </div>
              </div>
            ))}
            {sortedCriticalItems.length === 0 && (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <i className="fa-solid fa-circle-check text-6xl text-emerald-100"></i>
                <p className="text-slate-300 font-black uppercase tracking-widest text-sm italic">Sin desviaciones registradas</p>
              </div>
            )}
          </div>
        </div>

        {/* TOP POR VOLUMEN (UNIDADES) */}
        <div className="bg-white border-2 border-slate-100 shadow-2xl rounded-[40px] overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-tighter text-xl flex items-center gap-3">
                <i className="fa-solid fa-boxes-stacked text-emerald-600"></i>
                Mayores Desviaciones Físicas
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Priorizado por cantidad de unidades faltantes</p>
            </div>
          </div>
          <div className="p-4 space-y-4 flex-1">
            {topByQuantity.slice(0, 10).map((item, idx) => (
              <div key={item.id} className="flex items-center gap-5 p-5 hover:bg-emerald-50/50 rounded-[28px] border-2 border-transparent hover:border-emerald-100 transition-all group">
                <div className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-2xl text-sm font-black text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">{item.Artículo}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.Almacén} • {item.Subfamilia}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <p className={`text-xl font-black tracking-tighter ${item["Variación Stock"] < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {item["Variación Stock"]}
                    </p>
                    <span className="text-[10px] font-black text-slate-400 uppercase">{item.Unidad}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Diferencia Inventario</p>
                </div>
              </div>
            ))}
            {topByQuantity.length === 0 && (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <i className="fa-solid fa-circle-check text-6xl text-emerald-100"></i>
                <p className="text-slate-300 font-black uppercase tracking-widest text-sm italic">Inventario 100% Confiable</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriticalItems;
