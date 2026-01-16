
import React, { useMemo, useState } from 'react';
import { ProcessedItem } from '../types';
import { getTrafficLightColor } from '../utils/calculations';

interface SedeDetailProps {
  data: ProcessedItem[];
  selectedSede: string;
}

const SedeDetail: React.FC<SedeDetailProps> = ({ data, selectedSede }) => {
  const [subfamilyFilter, setSubfamilyFilter] = useState('Todas');
  const subfamilies = useMemo(() => ['Todas', ...Array.from(new Set(data.map(i => i.Subfamilia))).filter(Boolean).sort()], [data]);

  const filtered = useMemo(() => {
    return data.filter(item => subfamilyFilter === 'Todas' || item.Subfamilia === subfamilyFilter);
  }, [data, subfamilyFilter]);

  const formatCurrency = (val: number | undefined) => 
    val !== undefined ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val) : 'N/A';

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden print:shadow-none print:border-slate-300">
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between no-print">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Detalle por Ítem</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sede Actual: <span className="text-emerald-600">{selectedSede}</span></p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Filtrar Subfamilia</span>
          <select value={subfamilyFilter} onChange={(e) => setSubfamilyFilter(e.target.value)} className="text-xs font-bold border-2 border-slate-200 rounded-lg px-3 py-1.5 bg-white shadow-sm transition-all">
            {subfamilies.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full text-left border-collapse min-w-[1200px] print:min-w-0">
          <thead>
            <tr className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
              <th className="px-4 py-4 print:px-2">Artículo</th>
              <th className="px-4 py-4 text-center print:px-1">Stock Sistema</th>
              <th className="px-4 py-4 text-center print:px-1">Stock Físico</th>
              <th className="px-4 py-4 text-center print:px-1">Variación</th>
              <th className="px-4 py-4 text-right print:px-1">Costo Ajuste</th>
              <th className="px-4 py-4 text-right print:px-1">Cobro</th>
              <th className="px-4 py-4 text-center print:px-1">Confiabilidad</th>
              <th className="px-4 py-4 text-center print:px-1">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((item) => {
              const relPercent = item.reliability * 100;
              const color = getTrafficLightColor(relPercent);
              const costoAjuste = Number(item["Costo Ajuste"]);

              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors text-xs print:break-inside-avoid">
                  <td className="px-4 py-4 print:px-2">
                    <p className="font-black text-slate-800 uppercase leading-none">{item.Artículo}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{item.Subartículo}</p>
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-slate-600 print:px-1">{item["Stock a Fecha"]}</td>
                  <td className="px-4 py-4 text-center font-bold text-slate-600 print:px-1">{item["Stock Inventario"]}</td>
                  <td className={`px-4 py-4 text-center font-black print:px-1 ${item.Estado_Normalizado === 'Faltantes' ? 'text-rose-600' : item.Estado_Normalizado === 'Sobrantes' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {item["Variación Stock"]}
                  </td>
                  <td className={`px-4 py-4 text-right font-black print:px-1 ${costoAjuste < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(costoAjuste)}
                  </td>
                  <td className="px-4 py-4 text-right font-black text-rose-700 print:px-1">
                    {item.Cobro > 0 ? formatCurrency(item.Cobro) : '-'}
                  </td>
                  <td className="px-4 py-4 text-center print:px-1 font-black">
                    <span className={`text-${color}-600`}>{relPercent.toFixed(0)}%</span>
                  </td>
                  <td className="px-4 py-4 text-center print:px-1">
                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${
                      item.Estado_Normalizado === 'Faltantes' ? 'bg-rose-50 text-rose-600' : 
                      item.Estado_Normalizado === 'Sobrantes' ? 'bg-amber-50 text-amber-600' : 
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {item.Estado_Normalizado.substring(0,4)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SedeDetail;
