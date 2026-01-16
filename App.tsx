
import React, { useState, useMemo } from 'react';
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
        const monthFilter = startDate.substring(0, 7); // YYYY-MM
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
    setStartDate('');
    setEndDate('');
    setActiveView('dashboard');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 print:bg-white">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm print:relative print:shadow-none print:border-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg print:bg-black">
                  <i className="fa-solid fa-brain text-2xl"></i>
                </div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-800">
                  PROMPT <span className="text-emerald-600 uppercase">Maestro</span>
                </h1>
              </div>
              <div className="print:hidden">
                <FileUpload onDataLoaded={handleDataLoaded} showFull={false} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={handlePrint}
                className="print:hidden flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md"
              >
                <i className="fa-solid fa-file-pdf"></i>
                Exportar PDF
              </button>
              <div className="hidden lg:block text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Periodo Activo</p>
                <p className="text-sm font-black text-emerald-600 uppercase leading-none">
                  {filterMode === 'Día' ? (startDate || 'Sin Fecha') : (startDate || 'Mes No Selecc.')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTROS ACTUALIZADA */}
        <div className="bg-slate-50 border-t border-slate-200 py-6 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-x-6 gap-y-4 items-end">
             <div className="flex flex-col">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Almacén Origen</label>
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
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Modo de Filtro</label>
               <div className="flex bg-white p-1 rounded-2xl border-2 border-slate-200 shadow-sm">
                 <button onClick={() => { setFilterMode('Día'); setStartDate(''); setEndDate(''); }} className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${filterMode === 'Día' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Día</button>
                 <button onClick={() => { setFilterMode('Mes'); setStartDate(''); setEndDate(''); }} className={`px-4 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${filterMode === 'Mes' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>Mes</button>
               </div>
             </div>

             <div className="flex gap-3">
               <div className="flex flex-col">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{filterMode === 'Día' ? 'Periodo Inicial' : 'Seleccionar Mes'}</label>
                 <input 
                   type={filterMode === 'Día' ? "date" : "month"} 
                   className="bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold shadow-sm"
                   value={startDate} 
                   onChange={(e) => setStartDate(e.target.value)} 
                 />
               </div>
               {filterMode === 'Día' && (
                 <div className="flex flex-col">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Periodo Final</label>
                   <input type="date" className="bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold shadow-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* METADATA PARA IMPRESIÓN (OCULTA EN WEB) */}
        <div className="hidden print:block p-8 bg-slate-50 border-2 border-slate-200 rounded-3xl mb-8">
           <h2 className="text-xl font-black uppercase tracking-tight mb-4">Reporte de Inventario: {activeView.toUpperCase()}</h2>
           <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sede:</p><p className="font-black text-slate-800">{selectedSede}</p></div>
              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Centro de Costo:</p><p className="font-black text-slate-800">{selectedCentroCosto}</p></div>
              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filtro Temporal:</p><p className="font-black text-slate-800">{filterMode} ({startDate} {endDate ? `- ${endDate}` : ''})</p></div>
              <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha Generación:</p><p className="font-black text-slate-800">{new Date().toLocaleString()}</p></div>
           </div>
        </div>

        <nav className="bg-white border-t border-slate-200 px-4 print:hidden">
          <div className="max-w-7xl mx-auto flex gap-4 overflow-x-auto no-scrollbar">
            <NavBtn active={activeView === 'dashboard'} label="Dashboard" onClick={() => setActiveView('dashboard')} />
            <NavBtn active={activeView === 'detail'} label="Detalle General" onClick={() => setActiveView('detail')} />
            <NavBtn active={activeView === 'cobros'} label="Informe de Cobros" onClick={() => setActiveView('cobros')} highlight />
            <NavBtn active={activeView === 'critical'} label="Items Críticos" onClick={() => setActiveView('critical')} />
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 print:py-0">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 print:hidden">
            <i className="fa-solid fa-file-excel text-8xl mb-6 text-emerald-600 opacity-20"></i>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Esperando Carga de Datos</h2>
            <p className="max-w-xs text-center text-sm font-medium">Importe un archivo Excel para habilitar el motor de análisis operativo.</p>
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
    </div>
  );
};

const NavBtn = ({ active, label, onClick, highlight = false }: any) => (
  <button onClick={onClick} className={`px-8 py-5 text-[11px] font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${active ? 'border-emerald-600 text-emerald-600' : highlight ? 'text-emerald-600/60 bg-emerald-50/20' : 'text-slate-400'}`}>
    {label}
  </button>
);

export default App;
