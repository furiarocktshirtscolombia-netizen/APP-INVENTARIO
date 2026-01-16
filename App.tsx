
import React, { useState, useMemo } from 'react';
import { ViewType, ProcessedItem, InventoryRawRow } from './types';
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
    if (startDate) {
      result = result.filter(item => item["Fecha Doc"] >= startDate);
    }
    if (endDate) {
      result = result.filter(item => item["Fecha Doc"] <= endDate);
    }
    return result;
  }, [data, selectedSede, selectedCentroCosto, selectedEstado, startDate, endDate]);

  const sedeMetrics = useMemo(() => aggregateSedeMetrics(filteredData), [filteredData]);
  
  const sedesList = useMemo(() => {
    const uniqueSedes = Array.from(new Set(data.map(i => i.Almacén))).filter(Boolean).sort();
    return ['Todas', ...uniqueSedes];
  }, [data]);

  const centroCostoList = useMemo(() => {
    const uniqueCC = Array.from(new Set(data.map(i => i["Centro de Costos"]))).filter(Boolean).sort();
    return ['Todos', ...uniqueCC];
  }, [data]);

  const estadosList = ['Todos', 'Sin Novedad', 'Faltantes', 'Sobrantes'];

  const handleDataLoaded = (raw: InventoryRawRow[]) => {
    const processed = processInventoryData(raw);
    setData(processed);
    
    const unique = Array.from(new Set(processed.map(i => i.Almacén))).filter(Boolean);
    if (unique.length === 1) {
      setSelectedSede(unique[0]);
    } else {
      setSelectedSede('Todas');
    }
    
    setSelectedCentroCosto('Todos');
    setSelectedEstado('Todos');
    setActiveView('dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen selection:bg-emerald-100 selection:text-emerald-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveView('dashboard')}>
                <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-emerald-200 shadow-lg group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-brain text-2xl"></i>
                </div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-800 hidden sm:block">
                  PROMPT <span className="text-emerald-600 uppercase">Maestro</span>
                </h1>
              </div>
              <div className="hidden md:block">
                <FileUpload onDataLoaded={handleDataLoaded} showFull={false} />
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="hidden lg:flex flex-col items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Filtro Global Activo</p>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <p className="text-lg font-black text-emerald-600 uppercase tracking-tight">CC: {selectedCentroCosto}</p>
                </div>
              </div>
              <FileUpload onDataLoaded={handleDataLoaded} />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="flex flex-wrap gap-x-8 gap-y-6 items-end">
               <div className="flex flex-col">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Almacén (Sede):</label>
                 <select 
                   className="bg-white border-2 border-emerald-100 rounded-2xl px-5 py-3 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all shadow-sm min-w-[200px]"
                   value={selectedSede}
                   onChange={(e) => setSelectedSede(e.target.value)}
                 >
                   {sedesList.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>
               <div className="flex flex-col">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Centro de Costos:</label>
                 <select 
                   className="bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all shadow-sm min-w-[200px]"
                   value={selectedCentroCosto}
                   onChange={(e) => setSelectedCentroCosto(e.target.value)}
                 >
                   {centroCostoList.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                 </select>
               </div>
               <div className="flex flex-col">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Estado:</label>
                 <select 
                   className="bg-white border-2 border-emerald-100 rounded-2xl px-5 py-3 text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all shadow-sm min-w-[180px]"
                   value={selectedEstado}
                   onChange={(e) => setSelectedEstado(e.target.value)}
                 >
                   {estadosList.map(est => <option key={est} value={est}>{est}</option>)}
                 </select>
               </div>
               <div className="flex flex-col">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Fecha Inicio:</label>
                 <input 
                   type="date" 
                   className="bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"
                   value={startDate}
                   onChange={(e) => setStartDate(e.target.value)}
                 />
               </div>
               <div className="flex flex-col">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Fecha Fin:</label>
                 <input 
                   type="date" 
                   className="bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"
                   value={endDate}
                   onChange={(e) => setEndDate(e.target.value)}
                 />
               </div>
             </div>
          </div>
        </div>

        <nav className="bg-white border-t border-slate-200 px-4">
          <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto no-scrollbar">
            <TabItem active={activeView === 'dashboard'} label="Resumen General" icon="fa-chart-line" onClick={() => setActiveView('dashboard')} />
            <TabItem active={activeView === 'detail'} label="Detalle por Ítem" icon="fa-table-list" onClick={() => setActiveView('detail')} />
            <TabItem active={activeView === 'cobros'} label="Informe de Cobros" icon="fa-file-invoice-dollar" onClick={() => setActiveView('cobros')} />
            <TabItem active={activeView === 'critical'} label="Items Críticos" icon="fa-triangle-exclamation" onClick={() => setActiveView('critical')} />
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500">
            <i className="fa-solid fa-file-excel text-7xl mb-6 text-emerald-500 opacity-20"></i>
            <h2 className="text-3xl font-black mb-2 text-slate-700 uppercase tracking-tighter">Esperando Reporte de Inventario</h2>
            <p className="max-w-md text-center text-slate-400 font-medium">Importe su archivo Excel para comenzar el análisis.</p>
          </div>
        ) : (
          <>
            {activeView === 'dashboard' && (
              <Dashboard 
                metrics={sedeMetrics} 
                data={filteredData} 
                onSelectCC={setSelectedCentroCosto} 
              />
            )}
            {activeView === 'detail' && <SedeDetail data={filteredData} selectedSede={selectedSede} />}
            {activeView === 'cobros' && (
              <CobrosReport 
                data={filteredData} 
                selectedSede={selectedSede} 
                selectedCentroCosto={selectedCentroCosto}
                selectedEstado={selectedEstado}
                startDate={startDate}
                endDate={endDate}
              />
            )}
            {activeView === 'critical' && <CriticalItems data={filteredData} />}
          </>
        )}
      </main>

      <footer className="bg-slate-100 py-10 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Reliability Pro &copy; {new Date().getFullYear()} - Prompt Maestro</p>
        </div>
      </footer>
    </div>
  );
};

const TabItem = ({ active, label, icon, onClick }: { active: boolean, label: string, icon: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-8 py-5 text-sm font-black uppercase tracking-tighter border-b-4 transition-all whitespace-nowrap ${
      active ? 'border-emerald-600 text-emerald-600 bg-emerald-50/40' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
    }`}
  >
    <i className={`fa-solid ${icon} ${active ? 'scale-110' : ''}`}></i>
    {label}
  </button>
);

export default App;
