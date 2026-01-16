
import React from 'react';
import { ProcessedItem } from '../types';

interface CobrosReportProps {
  data: ProcessedItem[];
  selectedSede: string;
  selectedCentroCosto: string;
  selectedEstado: string;
  startDate: string;
  endDate: string;
}

const CobrosReport: React.FC<CobrosReportProps> = ({ 
  data, 
  selectedSede, 
  selectedCentroCosto, 
  selectedEstado,
  startDate,
  endDate
}) => {
  const itemsToCharge = data.filter(item => item.Cobro > 0);
  const totalCobro = itemsToCharge.reduce((acc, item) => acc + item.Cobro, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:m-0 print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Informe de Cobros Personalizado</h2>
        <button 
          onClick={handlePrint}
          className="bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-tighter flex items-center gap-2 hover:bg-slate-900 transition-all shadow-md active:scale-95"
        >
          <i className="fa-solid fa-print"></i>
          Imprimir Reporte
        </button>
      </div>

      <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden print:border-none print:shadow-none">
        <div className="p-10 border-b border-slate-100 bg-slate-50/30">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                <i className="fa-solid fa-brain text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Liquidación de Inventarios</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Documento de Soporte Operativo</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Generación</p>
              <p className="font-black text-slate-800 text-lg">{new Date().toLocaleDateString('es-CO')}</p>
            </div>
          </div>

          {/* RESUMEN DE FILTROS APLICADOS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
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
        </div>

        <div className="p-10">
          <table className="w-full text-left mb-10 border-separate border-spacing-0">
            <thead>
              <tr className="border-b-2 border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="py-4 border-b-2 border-slate-800">Descripción de Ítem</th>
                <th className="py-4 text-center border-b-2 border-slate-800">Faltante</th>
                <th className="py-4 text-right border-b-2 border-slate-800">Costo Ajuste</th>
                <th className="py-4 text-right border-b-2 border-slate-800">Valor a Cobrar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsToCharge.map((item) => (
                <tr key={item.id} className="text-sm">
                  <td className="py-5">
                    <p className="font-black text-slate-800 uppercase leading-none mb-1">{item.Artículo}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{item.Subartículo} • {item["Centro de Costos"]}</p>
                  </td>
                  <td className="py-5 text-center font-black text-slate-600">
                    {Math.abs(item["Variación Stock"])}
                  </td>
                  <td className="py-5 text-right font-bold text-slate-400 italic">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.abs(item["Costo Ajuste"]))}
                  </td>
                  <td className="py-5 text-right font-black text-rose-600 text-lg">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.Cobro)}
                  </td>
                </tr>
              ))}
              {itemsToCharge.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-sm">
                    No se registran cobros pendientes para los criterios seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="py-6 text-right font-black text-slate-400 uppercase text-xs tracking-widest">Total Liquidación:</td>
                <td className="py-6 text-right font-black text-3xl text-slate-800 tracking-tighter">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalCobro)}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-24 flex flex-wrap gap-20">
            <div className="flex-1 min-w-[200px] border-t-2 border-slate-200 pt-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Firma Administrador Sede</p>
              <div className="border-b border-dashed border-slate-300 h-8"></div>
              <p className="text-[9px] text-slate-300 font-bold mt-2">Nombre y Cédula</p>
            </div>
            <div className="flex-1 min-w-[200px] border-t-2 border-slate-200 pt-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Firma Auditoría Central</p>
              <div className="border-b border-dashed border-slate-300 h-8"></div>
              <p className="text-[9px] text-slate-300 font-bold mt-2">Soporte Verificado</p>
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
