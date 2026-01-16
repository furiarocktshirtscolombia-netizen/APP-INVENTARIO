
import React, { useState, useMemo, useEffect } from 'react';
import { ViewType, ProcessedItem, InventoryRawRow, FilterMode } from './types';
import { processInventoryData, aggregateSedeMetrics } from './utils/calculations';
import Dashboard from './components/Dashboard';
import SedeDetail from './components/SedeDetail';
import CobrosReport from './components/CobrosReport';
import CriticalItems from './components/CriticalItems';
import FileUpload from './components/FileUpload';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [data, setData] = useState<ProcessedItem[]>([]);
  const [selectedSede, setSelectedSede] = useState<string>('Todas');
  const [selectedCentroCosto, setSelectedCentroCosto] = useState<string>('Todos');
  const [selectedEstado, setSelectedEstado] = useState<string>('Todos');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterMode, setFilterMode] = useState<FilterMode>('Día');

  const filteredData = useMemo(() => {
    let result = data;
    if (selectedSede !== 'Todas') {
      result = result.filter(item => item.Almacén === selectedSede);
    }
    if (selectedCentroCosto !== 'Todos') {
      result = result.filter(item => item["Centro de Costos"] === selectedCentroCosto);
    }
    if (selectedEstado !== 'Todos') {
      result = result.filter(item => item.Estado === selectedEstado);
    }
    
    if (filterMode === 'Día') {
      if (startDate) result = result.filter(item => item.Fecha_Operativa >= startDate);
      if (endDate) result = result.filter(item => item.Fecha_Operativa <= endDate);
    } else {
      if (startDate) {
        const monthFilter = startDate.substring(0, 7);
        result = result.filter(item => item.Fecha_Operativa.startsWith(monthFilter));
      }
    }
    return result;
  }, [data, selectedSede, selectedCentroCosto, selectedEstado, startDate, endDate, filterMode]);

  const sedeMetrics = useMemo(() => aggregateSedeMetrics(filteredData), [filteredData]);
  
  const sedesList = useMemo(() => {
    const uniqueSedes = Array.from(new Set(data.map(i => i.Almacén))).filter(Boolean).sort();
    return ['Todas', ...uniqueSedes];
  }, [data]);

  const centroCostoList = useMemo(() => {
    const uniqueCC = Array.from(new Set(data.map(i => i["Centro de Costos"]))).filter(Boolean).sort();
    return ['Todos', ...uniqueCC];
  }, [data]);

  const handleDataLoaded = (raw: InventoryRawRow[]) => {
    const processed = processInventoryData(raw);
    setData(processed);
    const unique = Array.from(new Set(processed.map(i => i.Almacén))).filter(Boolean);
    setSelectedSede(unique.length === 1 ? unique[0] : 'Todas');
    setSelectedCentroCosto('Todos');
    setSelectedEstado('Todos');
    setActiveView('dashboard');
  };

  const handleExportPDF = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const originalTitle = document.title;
    // Nombre de archivo sugerido: Inventario_Sede_Seccion_Fecha.pdf
    document.title = `Inventario_${selectedSede.replace(/\s+/g, '_')}_${activeView.toUpperCase()}_${dateStr}`;
    
    window.print();
    
    // Restaurar título original después de que se abra el diálogo de impresión
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 print:bg-white">
      {/* ESTILOS GLOBALES DE IMPRESIÓN */}
      <style>{`
        @media print {
          @page { margin: 1cm; size: auto; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-block { display: block !important; }
          .print-flex { display: flex !important; }
          .print-grid { display: grid !important; }
          .shadow-xl, .shadow-2xl, .shadow-sm { box-shadow: none !important; }
          .border-2 { border-width: 1px !important; }
          .rounded-[40px], .rounded-3xl { border-radius: 12px !important; }
          table { width: 100% !important; table-layout: auto !important; border-collapse: collapse !important; }
          .overflow-x-auto { overflow: visible !important; }
          .min-w-[1300px] { min-width: 0 !important; }
          .bg-slate-50\/50, .bg-slate-50 { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
          .text-emerald-600 { color: #059669 !important; -webkit-print-color-adjust: exact; }
          .text-rose-600 { color: #e11d48 !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg">
                  <i className="fa-solid fa-brain text-2xl"></i>
                </div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-800">
                  PROMPT <span className="text-emerald-600 uppercase">Maestro</span>
                </h1>
              </div>
              <FileUpload onDataLoaded={handleDataLoaded} showFull={false} />
            </div>
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md active:scale-95"
              >
                <i className="fa-solid fa-file-pdf"></i>
                Exportar PDF
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-x-6 gap-y-4 items-end">
             <div className="flex flex-col">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sede / Almacén</label>
               <select 
                 className="bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 text-xs font-black text-slate-700 focus:border-emerald-500 shadow-sm min-w-[180px]"
                 value={selectedSede}
                 onChange={(e) => setSelectedSede(e.target.value)}
               >
                 {sedesList.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
             </div>
             <div className="flex flex-col">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Centro de Costo</label>
               <select 
                 className="bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 text-xs font-black text-slate-700 focus:border-emerald-500 shadow-sm min-w-[150px]"
                 value={selectedCentroCosto}
                 onChange={(e) => setSelectedCentroCosto(e.target.value)}
               >
                 {centroCostoList.map(cc => <option key={cc} value={cc}>{cc}</option>)}
               </select>
             </div>
             <div className="flex flex-col">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Modo Temporal</label>
               <div className="flex bg-white p-1 rounded-2xl border-2 border-slate-200 shadow-sm">
                 <button onClick={() => setFilterMode('Día')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl ${filterMode === 'Día' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Día</button>
                 <button onClick={() => setFilterMode('Mes')} className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl ${filterMode === 'Mes' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Mes</button>
               </div>
             </div>
             <div className="flex flex-col">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{filterMode === 'Día' ? 'Fecha' : 'Mes'}</label>
               <input 
                 type={filterMode === 'Día' ? "date" : "month"} 
                 className="bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold shadow-sm"
                 value={startDate} 
                 onChange={(e) => setStartDate(e.target.value)} 
               />
             </div>
          </div>
        </div>

        <nav className="bg-white border-t border-slate-200 px-4">
          <div className="max-w-7xl mx-auto flex gap-4 overflow-x-auto no-scrollbar">
            <NavBtn active={activeView === 'dashboard'} label="Resumen Dashboard" onClick={() => setActiveView('dashboard')} />
            <NavBtn active={activeView === 'detail'} label="Detalle General" onClick={() => setActiveView('detail')} />
            <NavBtn active={activeView === 'cobros'} label="Informe de Cobros" onClick={() => setActiveView('cobros')} highlight />
            <NavBtn active={activeView === 'critical'} label="Items Críticos" onClick={() => setActiveView('critical')} />
          </div>
        </nav>
      </header>

      {/* ENCABEZADO DE AUDITORÍA EXCLUSIVO PARA EL PDF */}
      <div className="hidden print:block mb-10 border-b-4 border-slate-900 pb-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-600 p-4 rounded-2xl text-white">
              <i className="fa-solid fa-brain text-4xl"></i>
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-800 uppercase leading-none">REPORTE DE INVENTARIO</h1>
              <p className="text-lg font-bold text-emerald-600 mt-1 uppercase tracking-widest">{activeView.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generado el:</p>
             <p className="font-black text-slate-800">{new Date().toLocaleString('es-CO')}</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-8 mt-10 p-6 bg-slate-50 border border-slate-200 rounded-3xl">
          <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Sede:</p><p className="font-black text-sm uppercase">{selectedSede}</p></div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Centro de Costo:</p><p className="font-black text-sm uppercase">{selectedCentroCosto}</p></div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Estado:</p><p className="font-black text-sm uppercase">{selectedEstado}</p></div>
          <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Periodo:</p><p className="font-black text-sm uppercase">{startDate || 'Todo el tiempo'} {endDate ? `- ${endDate}` : ''}</p></div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 print:py-0">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 no-print">
            <i className="fa-solid fa-file-excel text-8xl mb-6 text-emerald-600 opacity-20"></i>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Sin Datos Cargados</h2>
            <p className="text-sm font-medium">Use el botón superior para importar el reporte de Excel.</p>
          </div>
        ) : (
          <div className="print:block">
            {activeView === 'dashboard' && <Dashboard metrics={sedeMetrics} data={filteredData} onSelectCC={setSelectedCentroCosto} />}
            {activeView === 'detail' && <SedeDetail data={filteredData} selectedSede={selectedSede} />}
            {activeView === 'cobros' && <CobrosReport data={filteredData} selectedSede={selectedSede} selectedCentroCosto={selectedCentroCosto} selectedEstado={selectedEstado} startDate={startDate} endDate={endDate} />}
            {activeView === 'critical' && <CriticalItems data={filteredData} />}
          </div>
        )}
      </main>
      
      <footer className="no-print py-10 border-t border-slate-200 text-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Reliability Pro &copy; {new Date().getFullYear()} - Auditoría de Restaurantes</p>
      </footer>
    </div>
  );
};

const NavBtn = ({ active, label, onClick, highlight = false }: any) => (
  <button onClick={onClick} className={`px-8 py-5 text-[11px] font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${active ? 'border-emerald-600 text-emerald-600' : highlight ? 'text-emerald-600/60' : 'text-slate-400 hover:text-slate-600'}`}>
    {label}
  </button>
);

export default App;
