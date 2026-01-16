
import React, { useMemo, useState } from 'react';
import { ProcessedItem } from '../types';
import { getTrafficLightColor } from '../utils/calculations';

interface SedeDetailProps {
  data: ProcessedItem[];
  selectedSede: string;
}

const SedeDetail: React.FC<SedeDetailProps> = ({ data, selectedSede }) => {
  // Mantenemos solo Subfamilia ya que no está en el encabezado global
  const [subfamilyFilter, setSubfamilyFilter] = useState('Todas');
  const subfamilies = useMemo(() => ['Todas', ...Array.from(new Set(data.map(i => i.Subfamilia))).filter(Boolean).sort()], [data]);

  const filtered = useMemo(() => {
    return data.filter(item => subfamilyFilter === 'Todas' || item.Subfamilia === subfamilyFilter);
  }, [data, subfamilyFilter]);

  const formatCurrency = (val: number | undefined) => 
    val !== undefined ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val) : 'N/A';

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            Detalle por Ítem
          </h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            Sede Actual: <span className="text-emerald-600">{selectedSede}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">Subfamilia (Filtro Interno)</span>
            <select 
              value={subfamilyFilter} 
              onChange={(e) => setSubfamilyFilter(e.target.value)}
              className="text-xs font-bold border-2 border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-sm transition-all"
            >
              {subfamilies.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1300px]">
          <thead>
            <tr className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
              <th className="px-4 py-4 sticky left-0 bg-slate-100 z-10">Almacén (Sede)</th>
              <th className="px-4 py-4">Artículo</th>
              <th className="px-4 py-4">Subartículo</th>
              <th className="px-4 py-4 text-center">Stock Sistema</th>
              <th className="px-4 py-4 text-center">Stock Físico</th>
              <th className="px-4 py-4 text-center">Variación</th>
              <th className="px-4 py-4 text-right">Costo Unitario</th>
              <th className="px-4 py-4 text-right">Costo Ajuste</th>
              <th className="px-4 py-4 text-right">Cobro</th>
              <th className="px-4 py-4 text-center">% Confiabilidad</th>
              <th className="px-4 py-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((item) => {
              const relPercent = item.reliability * 100;
              const color = getTrafficLightColor(relPercent);
              const costoUnitario = Number(item["Coste Línea"]) || 0;
              const costoAjuste = Number(item["Costo Ajuste"]);

              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors text-xs">
                  <td className="px-4 py-4 font-bold text-slate-400 uppercase sticky left-0 bg-white/90 backdrop-blur-sm z-10 border-r border-slate-100">{item.Almacén}</td>
                  <td className="px-4 py-4 font-black text-slate-800 uppercase">{item.Artículo}</td>
                  <td className="px-4 py-4 text-slate-500 font-medium">{item.Subartículo}</td>
                  <td className="px-4 py-4 text-center font-bold text-slate-600 bg-slate-50/50">{item["Stock a Fecha"]}</td>
                  <td className="px-4 py-4 text-center font-bold text-slate-600">{item["Stock Inventario"]}</td>
                  <td className={`px-4 py-4 text-center font-black ${item.Estado === 'Faltantes' ? 'text-rose-600' : item.Estado === 'Sobrantes' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {item["Variación Stock"]}
                  </td>
                  <td className="px-4 py-4 text-right text-slate-500 font-bold">
                    {formatCurrency(costoUnitario)}
                  </td>
                  <td className={`px-4 py-4 text-right font-black ${costoAjuste < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(costoAjuste)}
                  </td>
                  <td className="px-4 py-4 text-right font-black text-rose-700">
                    {item.Cobro > 0 ? formatCurrency(item.Cobro) : '-'}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className={`font-black text-sm text-${color}-600`}>
                      {relPercent.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border ${
                      item.Estado === 'Faltantes' ? 'bg-rose-50 text-rose-600 border-rose-200' : 
                      item.Estado === 'Sobrantes' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                      'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}>
                      {item.Estado}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-20 text-center">
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No se encontraron resultados con los filtros aplicados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SedeDetail;
