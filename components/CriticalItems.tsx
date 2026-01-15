
import React from 'react';
import { ProcessedItem } from '../types';

interface CriticalItemsProps {
  data: ProcessedItem[];
}

const CriticalItems: React.FC<CriticalItemsProps> = ({ data }) => {
  const faltantes = data.filter(item => item.Estado === 'Faltante');
  
  const topByValue = [...faltantes].sort((a, b) => Math.abs(a["Costo Ajuste"]) - Math.abs(b["Costo Ajuste"])); // Descending by abs cost adjustment
  const topByQuantity = [...faltantes].sort((a, b) => Math.abs(a["Variación Stock"]) - Math.abs(b["Variación Stock"]));

  return (
    <div className="space-y-8">
      <div className="bg-rose-50 border-l-4 border-rose-500 p-6 rounded-r-xl flex items-center gap-6">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
          <i className="fa-solid fa-triangle-exclamation text-3xl"></i>
        </div>
        <div>
          <h2 className="text-xl font-black text-rose-900 uppercase tracking-tight">Zona de Alerta Crítica</h2>
          <p className="text-rose-700 text-sm">Se han identificado {faltantes.length} items con faltantes que requieren atención inmediata de auditoría.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top by Value */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <i className="fa-solid fa-money-bill-transfer text-rose-500"></i>
              Mayores Pérdidas Financieras ($)
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {topByValue.slice(0, 10).map((item, idx) => (
              <div key={item.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded text-[10px] font-black text-slate-400">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800 uppercase leading-none mb-1">{item.Artículo}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{item.Almacén} • {item.Subfamilia}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-rose-600">-{new Intl.NumberFormat('es-CO').format(Math.abs(item["Costo Ajuste"]))}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Ajuste de Costo</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top by Quantity */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <i className="fa-solid fa-boxes-stacked text-amber-500"></i>
              Mayores Faltantes por Unidades (Qty)
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {topByQuantity.slice(0, 10).map((item, idx) => (
              <div key={item.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded text-[10px] font-black text-slate-400">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800 uppercase leading-none mb-1">{item.Artículo}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{item.Almacén} • {item.Subfamilia}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-amber-600">{item["Variación Stock"]}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Unidades</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriticalItems;
