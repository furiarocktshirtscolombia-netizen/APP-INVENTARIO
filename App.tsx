
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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredData = useMemo(() => {
    let result = data;
    if (selectedSede !== 'Todas') {
      result = result.filter(item => item.Almacén === selectedSede);
    }
    if (startDate) {
      result = result.filter(item => item["Fecha Doc"] >= startDate);
    }
    if (endDate) {
      result = result.filter(item => item["Fecha Doc"] <= endDate);
    }
    return result;
  }, [data, selectedSede, startDate, endDate]);

  const sedeMetrics = useMemo(() => aggregateSedeMetrics(filteredData), [filteredData]);
  const sedesList = useMemo(() => ['Todas', ...Array.from(new Set(data.map(i => i.Almacén)))], [data]);

  const handleDataLoaded = (raw: InventoryRawRow[]) => {
    const processed = processInventoryData(raw);
    setData(processed);
    setActiveView('dashboard');
  };

  const renderView = () => {
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500">
          <i className="fa-solid fa-file-excel text-6xl mb-4 text-emerald-500 opacity-20"></i>
          <h2 className="text-2xl font-black mb-2 text-slate-700 uppercase tracking-tight">Esperando archivo de inventario</h2>
          <p className="max-w-md text-center text-sm font-medium">Cargue su reporte Excel para visualizar los indicadores de confiabilidad y ajustes de su operación.</p>
        </div>
      );
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard metrics={sedeMetrics} data={filteredData} />;
      case 'detail':
        return <SedeDetail data={filteredData} selectedSede={selectedSede} />;
      case 'cobros':
        return <CobrosReport data={filteredData} selectedSede={selectedSede} />;
      case 'critical':
        return <CriticalItems data={filteredData} />;
      default:
        return <Dashboard metrics={sedeMetrics} data={filteredData} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-2 rounded-lg text-white shadow-lg">
                  <i className="fa-solid fa-brain text-xl"></i>
                </div>
                <h1 className="text-xl font-black tracking-tighter text-slate-800 hidden sm:block">
                  PROMPT <span className="text-emerald-600 uppercase">Maestro</span>
                </h1>
              </div>
              
              <div className="hidden md:block">
                <FileUpload onDataLoaded={handleDataLoaded} showFull={false} />
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* TÍTULO DINÁMICO DE SEDE */}
              <div className="hidden lg:flex flex-col items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Visualización Activa</p>
                <p className="text-sm font-black text-emerald-600 uppercase tracking-tight">Sede: {selectedSede}</p>
              </div>
              <FileUpload onDataLoaded={handleDataLoaded} />
            </div>
          </div>
        </div>

        {/* Global Filters - FILTRO PRINCIPAL ALMACÉN */}
        <div className="bg-slate-50 border-t border-slate-200 py-4 shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-6 items-center">
             <div className="flex flex-col">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Almacén (Sede):</label>
               <select 
                 className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
                 value={selectedSede}
                 onChange={(e) => setSelectedSede(e.target.value)}
               >
                 {sedesList.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
             </div>
             
             <div className="flex flex-col">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Periodo Desde:</label>
               <input 
                 type="date" 
                 className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all shadow-sm"
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
               />
             </div>

             <div className="flex flex-col">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Periodo Hasta:</label>
               <input 
                 type="date" 
                 className="bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-all shadow-sm"
                 value={endDate}
                 onChange={(e) => setEndDate(e.target.value)}
               />
             </div>
          </div>
        </div>

        {/* Navigation Tabs - VISTAS SOLICITADAS */}
        <nav className="bg-white border-t border-slate-200 px-4">
          <div className="max-w-7xl mx-auto flex gap-4 overflow-x-auto no-scrollbar">
            <TabItem active={activeView === 'dashboard'} label="Resumen General" icon="fa-chart-pie" onClick={() => setActiveView('dashboard')} />
            <TabItem active={activeView === 'detail'} label="Detalle por Ítem" icon="fa-table-list" onClick={() => setActiveView('detail')} />
            <TabItem active={activeView === 'cobros'} label="Informe de Cobros" icon="fa-file-invoice-dollar" onClick={() => setActiveView('cobros')} />
            <TabItem active={activeView === 'critical'} label="Items Críticos" icon="fa-triangle-exclamation" onClick={() => setActiveView('critical')} />
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>

      <footer className="bg-slate-100 py-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Reliability Pro &copy; {new Date().getFullYear()} - Arquitectura Analítica de Inventarios</p>
        </div>
      </footer>
    </div>
  );
};

const TabItem = ({ active, label, icon, onClick }: { active: boolean, label: string, icon: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-4 text-sm font-black uppercase tracking-tight border-b-4 transition-all whitespace-nowrap ${
      active ? 'border-emerald-600 text-emerald-600 bg-emerald-50/30' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
    }`}
  >
    <i className={`fa-solid ${icon} ${active ? 'animate-bounce' : ''}`}></i>
    {label}
  </button>
);

export default App;
