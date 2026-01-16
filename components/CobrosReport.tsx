
import React, { useMemo } from 'react';
import { ProcessedItem } from '../types';
import { getTrafficLightColor, getStatusLabel } from '../utils/calculations';

interface CobrosReportProps {
  data: ProcessedItem[];
  selectedSede: string;
  selectedCentroCosto: string;
  selectedEstado: string;
  startDate: string;
  endDate: string;
  consecutive: string;
}

const CobrosReport: React.FC<CobrosReportProps> = ({ 
  data, 
  selectedSede, 
  selectedCentroCosto, 
  selectedEstado,
  startDate,
  endDate,
  consecutive
}) => {
  const itemsToCharge = data;
  
  // Cálculo de confiabilidad por Centro de Costo basado en los datos filtrados
  const ccMetrics = useMemo(() => {
    const groups: Record<string, { total: number; perfect: number }> = {};
    data.forEach(item => {
      const cc = item["Centro de Costos"] || "General";
      if (!groups[cc]) groups[cc] = { total: 0, perfect: 0 };
      groups[cc].total++;
      if (item.reliability === 1) groups[cc].perfect++;
    });
    return Object.entries(groups).map(([name, stats]) => ({
      name,
      reliability: (stats.perfect / stats.total) * 100,
      total: stats.total
    })).sort((a, b) => b.reliability - a.reliability);
  }, [data]);

  const totalCobro = itemsToCharge.reduce((acc, item) => {
    const val = item.Estado_Normalizado === 'Faltantes' ? -item.Cobro : item.Cobro;
    return acc + val;
  }, 0);

  const formatCurrency = (val: number) => {
    const formatted = new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(Math.abs(val));
    return val < 0 ? `-${formatted}` : formatted;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 print:m-0 print:p-0">
      <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden print:border-none print:shadow-none">
        <div className="p-10 border-b border-slate-100 bg-slate-50/30">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                <i className="fa-solid fa-brain text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Cobros de Inventarios</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Documento de Soporte Operativo</p>
              </div>
            </div>
            <div className="flex flex-row gap-8">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Consecutivo de Cobro:</p>
                <p className="font-black text-emerald-700 text-lg">{consecutive}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Generación:</p>
                <p className="font-black text-slate-800 text-lg">{new Date().toLocaleDateString('es-CO')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm mb-8">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Punto de Venta:</p>
              <p className="text-xs font-black text-emerald-600 uppercase truncate">{selectedSede}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Centro de Costos:</p>
              <p className="text-xs font-black text-slate-700 uppercase truncate">{selectedCentroCosto}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado Filtro:</p>
              <p className="text-xs font-black text-slate-700 uppercase truncate">{selectedEstado}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Periodo:</p>
              <p className="text-xs font-black text-slate-700 uppercase truncate">
                {startDate || 'Inicio'} / {endDate || 'Fin'}
              </p>
            </div>
          </div>

          {/* SECCIÓN NUEVA: CONFIABILIDAD POR CENTRO DE COSTO */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Confiabilidad de Inventarios por Centro de Costo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ccMetrics.map(cc => {
                const color = getTrafficLightColor(cc.reliability);
                const status = getStatusLabel(cc.reliability);
                return (
                  <div key={cc.name} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{cc.name}</p>
                      <p className="text-xl font-black text-slate-800 leading-none">{cc.reliability.toFixed(1)}%</p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg bg-${color}-50 text-${color}-600 border border-${color}-100 flex flex-col items-center min-w-[80px]`}>
                      <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-0.5">Estado</span>
                      <span className="text-[10px] font-black">{status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-10">
          <table className="w-full text-left mb-10 border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                <th className="px-6 py-4 rounded-tl-xl">Descripción del Artículo / Subartículo</th>
                <th className="px-6 py-4 text-center">Unidad</th>
                <th className="px-6 py-4 text-center">Variación</th>
                <th className="px-6 py-4 text-right rounded-tr-xl bg-slate-800">Valor Cobro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsToCharge.map((item) => {
                const isFaltante = item.Estado_Normalizado === 'Faltantes';
                const displayVal = isFaltante ? -item.Cobro : item.Cobro;
                
                return (
                  <tr key={item.id} className="text-sm group hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="font-black text-slate-800 uppercase leading-tight mb-1">{item.Artículo}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{item["Centro de Costos"]}</p>
                        <span className="text-slate-300 text-[10px]">•</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                          isFaltante ? 'bg-rose-50 text-rose-600' : 
                          item.Estado_Normalizado === 'Sobrantes' ? 'bg-emerald-50 text-emerald-600' : 
                          'bg-slate-50 text-slate-400'
                        }`}>
                          {item.Estado_Normalizado}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-block px-4 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        {item.Unidad || '-'}
                      </span>
                    </td>
                    <td className={`px-6 py-5 text-center font-black text-lg ${isFaltante ? 'text-rose-600' : item.Estado_Normalizado === 'Sobrantes' ? 'text-emerald-600' : 'text-slate-300'}`}>
                      {item["Variación Stock"]}
                    </td>
                    <td className={`px-6 py-5 text-right font-black text-lg border-r-4 ${
                      isFaltante ? 'text-rose-600 border-rose-600 bg-rose-50/20' : 
                      item.Estado_Normalizado === 'Sobrantes' ? 'text-emerald-600 border-emerald-600 bg-emerald-50/20' : 
                      'text-slate-300 border-slate-100'
                    }`}>
                      {item.Estado_Normalizado !== 'Sin Novedad' ? formatCurrency(displayVal) : '-'}
                    </td>
                  </tr>
                );
              })}
              {itemsToCharge.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase italic tracking-widest text-sm">
                    No hay ítems con los criterios seleccionados para este reporte.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="px-6 py-10 text-right font-black text-slate-400 uppercase text-xs tracking-widest pr-10">Balance Total Reportado:</td>
                <td className={`px-6 py-10 text-right font-black text-4xl tracking-tighter border-t-4 ${totalCobro < 0 ? 'text-rose-600 border-rose-600' : 'text-emerald-600 border-emerald-600'}`}>
                  {formatCurrency(totalCobro)}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-24 flex flex-wrap gap-20 print:gap-10">
            <div className="flex-1 min-w-[200px] border-t-2 border-slate-200 pt-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Firma Administrador Sede</p>
              <div className="border-b border-dashed border-slate-300 h-8"></div>
              <p className="text-[9px] text-slate-300 font-bold mt-2 uppercase tracking-tighter">Nombre y Cédula</p>
            </div>
            <div className="flex-1 min-w-[200px] border-t-2 border-slate-200 pt-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Firma Auditoría Central</p>
              <div className="border-b border-dashed border-slate-300 h-8"></div>
              <p className="text-[9px] text-slate-300 font-bold mt-2 uppercase tracking-tighter">Soporte Verificado</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-8 text-[10px] text-slate-400 uppercase font-black text-center tracking-[0.3em]">
          *** DOCUMENTO GENERADO AUTOMÁTICAMENTE POR PROMPT MAESTRO - RELIABILITY PRO ***
        </div>
      </div>
    </div>
  );
};

export default CobrosReport;
