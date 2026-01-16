
import React from 'react';
import { ProcessedItem } from '../types';

interface CriticalItemsProps {
  data: ProcessedItem[];
}

const CriticalItems: React.FC<CriticalItemsProps> = ({ data }) => {
  const deviations = data.filter(item => item.Estado !== 'Sin Novedad');
  
  const sortedCriticalItems = [...deviations].sort((a, b) => {
    const absCobroA = Math.abs(a.Cobro || 0);
    const absCobroB = Math.abs(b.Cobro || 0);
    if (absCobroB !== absCobroA) return absCobroB - absCobroA;
    return Math.abs(b["Variación Stock"] || 0) - Math.abs(a["Variación Stock"] || 0);
  });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 print:space-y-0">
      {/* CABECERA (NO-PRINT: Ya tenemos cabecera global en App.tsx para PDF) */}
      <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-8 rounded-[40px] shadow-2xl flex items-center gap-8 text-white relative overflow-hidden no-print">
        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center flex-shrink-0">
          <i className="fa-solid fa-triangle-exclamation text-4xl"></i>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Priorización Crítica</h2>
          <p className="text-rose-100 font-medium text-lg mt-1">Identificados {deviations.length} ítems con impacto financiero directo.</p>
        </div>
      </div>

      <div className="print:block print:w-full">
        <div className="bg-white border-2 border-slate-100 shadow-2xl rounded-[40px] overflow-hidden print:shadow-none print:border-none print:rounded-none">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between no-print">
            <h3 className="font-black text-slate-800 uppercase tracking-tighter text-xl flex items-center gap-3">
              <i className="fa-solid fa-sack-dollar text-rose-600"></i> Ranking de Auditoría Económica
            </h3>
          </div>
          
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left print:text-[10px]">
              <thead className="print:table-header-group">
                <tr className="bg-slate-900 text-white font-black uppercase tracking-widest text-[9px]">
                  <th className="px-6 py-4 print:bg-slate-900 print:text-white">#</th>
                  <th className="px-6 py-4 print:bg-slate-900 print:text-white">Artículo / Descripción</th>
                  <th className="px-6 py-4 print:bg-slate-900 print:text-white">Sede / Centro Costo</th>
                  <th className="px-6 py-4 text-center print:bg-slate-900 print:text-white">Unidad</th>
                  <th className="px-6 py-4 text-center print:bg-slate-900 print:text-white">Variación</th>
                  <th className="px-6 py-4 text-right print:bg-rose-700 print:text-white">Valor Cobro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedCriticalItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-rose-50/30 transition-colors print:break-inside-avoid">
                    <td className="px-6 py-4 font-black text-slate-400 print:text-slate-900">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-800 uppercase leading-none">{item.Artículo}</p>
                      <p className={`text-[8px] font-black uppercase mt-1 ${item.Estado === 'Faltantes' ? 'text-rose-600' : 'text-amber-600'}`}>
                        {item.Estado}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{item.Almacén}</p>
                      <p className="text-[8px] text-slate-400 uppercase">{item["Centro de Costos"]}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-black text-slate-400">{item.Unidad}</td>
                    <td className={`px-6 py-4 text-center font-black text-lg ${item["Variación Stock"] < 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                      {item["Variación Stock"]}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-rose-600 text-lg print:text-rose-700">
                      {formatCurrency(item.Cobro)}
                    </td>
                  </tr>
                ))}
                {sortedCriticalItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-slate-300 font-black uppercase italic">Sin ítems críticos detectados.</td>
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

export default CriticalItems;
