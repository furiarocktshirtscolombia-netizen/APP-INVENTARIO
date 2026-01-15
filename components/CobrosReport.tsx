
import React from 'react';
import { ProcessedItem } from '../types';

interface CobrosReportProps {
  data: ProcessedItem[];
  selectedSede: string;
}

const CobrosReport: React.FC<CobrosReportProps> = ({ data, selectedSede }) => {
  const itemsToCharge = data.filter(item => item.Cobro > 0);
  const totalCobro = itemsToCharge.reduce((acc, item) => acc + item.Cobro, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:m-0 print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-xl font-bold text-slate-800">Informe de Cobros</h2>
        <button 
          onClick={handlePrint}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-slate-900 transition-colors shadow-sm"
        >
          <i className="fa-solid fa-print"></i>
          Imprimir Reporte
        </button>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden print:border-none print:shadow-none">
        <div className="p-8 border-b border-slate-100 bg-slate-50/30">
          <div className="flex justify-between items-start">
            <div>
              <div className="bg-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center text-white mb-4">
                <i className="fa-solid fa-brain text-xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Liquidación de Inventarios</h1>
              <p className="text-slate-500">Punto de Venta: <span className="font-bold text-slate-700 uppercase">{selectedSede}</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase">Fecha Generación</p>
              <p className="font-medium text-slate-800">{new Date().toLocaleDateString('es-CO')}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <table className="w-full text-left mb-8">
            <thead>
              <tr className="border-b-2 border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                <th className="py-3">Descripción de Ítem</th>
                <th className="py-3 text-center">Faltante</th>
                <th className="py-3 text-right">Costo Ajuste</th>
                <th className="py-3 text-right">Valor a Cobrar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsToCharge.map((item) => (
                <tr key={item.id} className="text-sm">
                  <td className="py-4">
                    <p className="font-bold text-slate-800 uppercase">{item.Artículo}</p>
                    <p className="text-[11px] text-slate-400">{item.Subartículo}</p>
                  </td>
                  <td className="py-4 text-center font-medium text-slate-600">
                    {Math.abs(item["Variación Stock"])}
                  </td>
                  <td className="py-4 text-right font-medium text-slate-500 italic">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.abs(item["Costo Ajuste"]))}
                  </td>
                  <td className="py-4 text-right font-bold text-rose-600">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.Cobro)}
                  </td>
                </tr>
              ))}
              {itemsToCharge.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                    No se registran cobros pendientes para esta sede.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-800 bg-slate-50">
                <td colSpan={3} className="py-4 text-right font-bold text-slate-600 uppercase text-xs">Total Liquidación:</td>
                <td className="py-4 text-right font-black text-xl text-slate-800">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalCobro)}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="mt-20 flex gap-20">
            <div className="flex-1 border-t border-slate-400 pt-4">
              <p className="text-xs font-bold text-slate-400 uppercase mb-8">Recibido por (Admin. Sede)</p>
              <div className="border-b border-slate-200 h-8"></div>
            </div>
            <div className="flex-1 border-t border-slate-400 pt-4">
              <p className="text-xs font-bold text-slate-400 uppercase mb-8">Autorizado por (Auditoría)</p>
              <div className="border-b border-slate-200 h-8"></div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 text-[10px] text-slate-400 uppercase font-bold text-center">
          Este documento es un soporte interno de liquidación basado en el conteo físico del inventario realizado.
        </div>
      </div>
    </div>
  );
};

export default CobrosReport;
