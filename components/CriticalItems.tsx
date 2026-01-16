
import React from 'react';
import { ProcessedItem } from '../types';

interface CriticalItemsProps {
  data: ProcessedItem[];
}

const CriticalItems: React.FC<CriticalItemsProps> = ({ data }) => {
  // Usamos los datos filtrados globalmente para garantizar consistencia total
  const displayItems = data;
  
  // Métrica 1: Mayores Liquidaciones de Cobro ($)
  // Ordenamos por valor de cobro. Si el filtro es "Sin Novedad", el orden será irrelevante ($0) pero se mostrarán los datos.
  const topByValue = [...displayItems].sort((a, b) => b.Cobro - a.Cobro);

  // Métrica 2: Mayores Variaciones de Stock (Cantidad Absoluta)
  const topByQuantity = [...displayItems].sort((a, b) => Math.abs(b["Variación Stock"]) - Math.abs(a["Variación Stock"]));

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ALERTA DINÁMICA: Refleja el estado real del filtro global */}
      <div className="bg-slate-900 border-l-8 border-emerald-500 p-8 rounded-r-[32px] shadow-2xl flex items-center gap-8 group">
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <i className="fa-solid fa-microscope text-4xl"></i>
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Análisis de Ítems Seleccionados</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">
            Visualizando <span className="text-emerald-400">{displayItems.length}</span> registros que coinciden con el filtro de estado actual.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* BLOQUE: MAYORES PÉRDIDAS FINANCIERAS (VALOR COBRO) */}
        <div className="bg-white border-2 border-slate-100 shadow-xl rounded-[40px] overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 bg-rose-50/30 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                <i className="fa-solid fa-hand-holding-dollar text-rose-500 text-xl"></i>
                Mayores Liquidaciones de Cobro ($)
              </h3>
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1">Impacto financiero directo según liquidación operativa</p>
            </div>
          </div>
          <div className="p-8 space-y-4 flex-1">
            {displayItems.length > 0 ? topByValue.slice(0, 10).map((item, idx) => (
              <div key={item.id} className="flex items-center gap-5 p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                <span className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg group-hover:bg-rose-600 transition-colors">
                  {idx + 1}
                </span>
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
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Valor Cobro</p>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center space-y-4">
                <i className="fa-solid fa-circle-info text-5xl text-slate-100"></i>
                <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">No hay ítems para el estado seleccionado</p>
              </div>
            )}
          </div>
        </div>

        {/* BLOQUE: MAYORES VARIACIONES POR CANTIDAD */}
        <div className="bg-white border-2 border-slate-100 shadow-xl rounded-[40px] overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-50 bg-amber-50/30 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                <i className="fa-solid fa-boxes-stacked text-amber-500 text-xl"></i>
                Mayores Variaciones de Stock (Qty)
              </h3>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">Diferencias físicas entre stock teórico y físico</p>
            </div>
          </div>
          <div className="p-8 space-y-4 flex-1">
            {displayItems.length > 0 ? topByQuantity.slice(0, 10).map((item, idx) => (
              <div key={item.id} className="flex items-center gap-5 p-4 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                <span className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg group-hover:bg-amber-500 transition-colors">
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
                <p className="text-slate-300 font-black uppercase tracking-widest text-[10px]">No hay ítems para el estado seleccionado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriticalItems;
