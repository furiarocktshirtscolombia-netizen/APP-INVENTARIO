
import React, { useState, useMemo } from 'react';
import { ProcessedItem } from '../types';
import { getTrafficLightColor } from '../utils/calculations';

interface SedeDetailProps {
  data: ProcessedItem[];
  selectedSede: string;
}

const SedeDetail: React.FC<SedeDetailProps> = ({ data, selectedSede }) => {
  const [stateFilter, setStateFilter] = useState('Todos');
  const [subfamilyFilter, setSubfamilyFilter] = useState('Todas');
  const [costCenterFilter, setCostCenterFilter] = useState('Todos');

  const subfamilies = useMemo(() => ['Todas', ...Array.from(new Set(data.map(i => i.Subfamilia)))], [data]);
  const costCenters = useMemo(() => ['Todos', ...Array.from(new Set(data.map(i => i["Centro de Costos"])))], [data]);

  const filtered = useMemo(() => {
    return data.filter(item => {
      const matchState = stateFilter === 'Todos' || item.Estado === stateFilter;
      const matchSub = subfamilyFilter === 'Todas' || item.Subfamilia === subfamilyFilter;
      const matchCC = costCenterFilter === 'Todos' || item["Centro de Costos"] === costCenterFilter;
      return matchState && matchSub && matchCC;
    });
  }, [data, stateFilter, subfamilyFilter, costCenterFilter]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
          Sede: <span className="text-emerald-600">{selectedSede}</span>
        </h3>
        
        <div className="flex flex-wrap gap-4">
          <FilterSelect label="Estado" value={stateFilter} onChange={setStateFilter} options={['Todos', 'Sin novedad', 'Faltante', 'Sobrante']} />
          <FilterSelect label="Subfamilia" value={subfamilyFilter} onChange={setSubfamilyFilter} options={subfamilies} />
          <FilterSelect label="C. Costos" value={costCenterFilter} onChange={setCostCenterFilter} options={costCenters} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
              <th className="px-4 py-4">Sede / Almacén</th>
              <th className="px-4 py-4">Artículo</th>
              <th className="px-4 py-4">Subartículo</th>
              <th className="px-4 py-4 text-center">Stock Sistema</th>
              <th className="px-4 py-4 text-center">Stock Físico</th>
              <th className="px-4 py-4 text-center">Variación</th>
              <th className="px-4 py-4 text-right">Costo Unit.</th>
              <th className="px-4 py-4 text-right">Costo Ajuste</th>
              <th className="px-4 py-4 text-right">Cobro</th>
              <th className="px-4 py-4 text-center">Estado</th>
              <th className="px-4 py-4 text-right">% Confiabilidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((item) => {
              const relPercent = item.reliability * 100;
              const color = getTrafficLightColor(relPercent);
              
              const stockRef = Number(item["Stock a Fecha"]) || 1;
              const costoUnitario = Number(item["Coste Línea"]) / stockRef;

              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors text-xs">
                  <td className="px-4 py-4 font-bold text-slate-400 uppercase">{item.Almacén || 'N/A'}</td>
                  <td className="px-4 py-4 font-black text-slate-800 uppercase">{item.Artículo || 'N/A'}</td>
                  <td className="px-4 py-4 text-slate-500">{item.Subartículo || 'N/A'}</td>
                  <td className="px-4 py-4 text-center font-bold text-slate-700 bg-slate-50/30">{item["Stock a Fecha"] ?? 'N/A'}</td>
                  <td className="px-4 py-4 text-center font-bold text-slate-700">{item["Stock Inventario"] ?? 'N/A'}</td>
                  <td className={`px-4 py-4 text-center font-black ${item["Variación Stock"] < 0 ? 'text-rose-600' : item["Variación Stock"] > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {item["Variación Stock"] ?? 'N/A'}
                  </td>
                  <td className="px-4 py-4 text-right text-slate-500 italic">
                    {formatCurrency(costoUnitario || 0)}
                  </td>
                  <td className={`px-4 py-4 text-right font-bold ${item["Costo Ajuste"] < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {formatCurrency(item["Costo Ajuste"] || 0)}
                  </td>
                  <td className="px-4 py-4 text-right font-black text-rose-700">
                    {item.Cobro > 0 ? formatCurrency(item.Cobro) : '-'}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border ${
                      item.Estado === 'Faltante' ? 'bg-rose-50 text-rose-600 border-rose-200' : 
                      item.Estado === 'Sobrante' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                      'bg-emerald-50 text-emerald-600 border-emerald-200'
                    }`}>
                      {item.Estado || 'Sin novedad'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className={`font-black text-sm text-${color}-600`}>
                      {relPercent.toFixed(1)}%
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-slate-400 font-bold uppercase text-xs">
            No se encontraron registros de inventario para esta consulta.
          </div>
        )}
      </div>
    </div>
  );
};

const FilterSelect = ({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: string[] }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">{label}</span>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export default SedeDetail;
