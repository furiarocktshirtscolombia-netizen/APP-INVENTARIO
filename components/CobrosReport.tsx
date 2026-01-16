
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
  // Solo ítems con cobro real (> 0) de la lista ya filtrada por el botón de Estado
  const itemsToCharge = data.filter(item => item.Cobro > 0);
  const totalCobro = itemsToCharge.reduce((acc, item) => acc + item.Cobro, 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="max-w-5xl mx-auto space-y-8 print:m-0 print:p-0 animate-in fade-in duration-500">
      <div className="flex justify-between items-end print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Generación de Liquidación</h2>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
            Organizado por Estado: <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{selectedEstado}</span>
          </p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl hover:shadow-emerald-200/20 active:scale-95 flex items-center gap-3 border-2 border-slate-800"
        >
          <i className="fa-solid fa-file-invoice-dollar text-xl"></i>
          Imprimir Liquidación Oficial
        </button>
      </div>

      <div className="bg-white border-2 border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[40px] overflow-hidden print:border-none print:shadow-none print:rounded-none">
        {/* ENCABEZADO DE DOCUMENTO */}
        <div className="p-12 border-b-4 border-slate-900 bg-slate-50/30">
          <div className="flex justify-between items-start">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 p-4 rounded-3xl text-white shadow-2xl">
                  <i className="fa-solid fa-brain text-4xl"></i>
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Acta de Liquidación</h1>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Control Interno & Auditoría</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                 <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">Almacén Origen</p>
                   <p className="text-xs font-black text-slate-800 uppercase">{selectedSede}</p>
                 </div>
                 <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">Centro de Costo</p>
                   <p className="text-xs font-black text-slate-800 uppercase">{selectedCentroCosto}</p>
                 </div>
                 <div className="bg-white px-4 py-2 rounded-xl border border-emerald-200 shadow-sm">
                   <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-tight">Estado Filtrado</p>
                   <p className="text-xs font-black text-emerald-700 uppercase">{selectedEstado}</p>
                 </div>
              </div>
            </div>

            <div className="text-right space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento No.</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">INV-{new Date().getTime().toString().slice(-6)}</p>
              <p className="text-xs font-bold text-slate-400">{new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })}</p>
            </div>
          </div>
        </div>

        {/* CUERPO DE LA TABLA */}
        <div className="p-12">
          <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                  <th className="px-6 py-5">Descripción del Artículo / Subartículo</th>
                  <th className="px-6 py-5 text-center">Variación</th>
                  <th className="px-6 py-5 text-right">Costo Ajuste</th>
                  <th className="px-6 py-5 text-right bg-emerald-600">Monto a Cobrar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemsToCharge.map((item) => (
                  <tr key={item.id} className="text-sm hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="font-black text-slate-900 uppercase leading-none mb-1">{item.Artículo}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{item.Subartículo} • {item["Centro de Costos"]}</p>
                    </td>
                    <td className="px-6 py-5 text-center font-black text-rose-600 text-base">
                      {item["Variación Stock"]}
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-slate-400 italic">
                      {formatCurrency(Math.abs(item["Costo Ajuste"]))}
                    </td>
                    <td className="px-6 py-5 text-right font-black text-slate-900 text-lg bg-emerald-50/30 border-l-2 border-emerald-100">
                      {formatCurrency(item.Cobro)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {itemsToCharge.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-3xl mt-6">
              <i className="fa-solid fa-magnifying-glass-dollar text-6xl text-slate-200 mb-6 block"></i>
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No existen registros de cobro para el estado: <span className="text-emerald-500">{selectedEstado}</span></p>
            </div>
          ) : (
            <div className="mt-12 flex justify-end">
              <div className="bg-slate-900 p-8 rounded-[32px] text-right shadow-2xl min-w-[400px]">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Neto Liquidación</p>
                <p className="text-5xl font-black text-white tracking-tighter">
                  {formatCurrency(totalCobro)}
                </p>
                <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-end gap-2 text-emerald-400">
                  <i className="fa-solid fa-check-circle"></i>
                  <p className="text-[10px] font-black uppercase tracking-widest">Soporte Operativo Validado</p>
                </div>
              </div>
            </div>
          )}

          {/* ÁREA DE FIRMAS */}
          <div className="mt-32 grid grid-cols-2 gap-24 px-6">
            <div className="text-center space-y-4">
              <div className="h-0.5 bg-slate-900 w-full mb-6 opacity-20"></div>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Responsable Operativo</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase italic">Firma del Administrador de Sede</p>
            </div>
            <div className="text-center space-y-4">
              <div className="h-0.5 bg-slate-900 w-full mb-6 opacity-20"></div>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Auditoría & Control</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase italic">Verificación de Inventarios</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 py-8 px-12 flex justify-between items-center text-white">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-50">Generado por Prompt Maestro - Reliability Pro</p>
          <div className="flex gap-4">
             <i className="fa-solid fa-qrcode text-3xl opacity-20"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CobrosReport;
