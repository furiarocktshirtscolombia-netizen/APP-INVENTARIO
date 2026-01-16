
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
    if (unique.length === 1) setSelectedSede(unique[0]);
    else setSelectedSede('Todas');
    
    setSelectedCentroCosto('Todos');
    setSelectedEstado('Todos');
    setActiveView('dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm print:hidden">
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
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sede Activa</p>
                <p className="text-sm font-black text-emerald-600 uppercase leading-none">{selectedSede}</p>
              </div>
              <FileUpload onDataLoaded={handleDataLoaded} />
            </div>
          </div>
        </div>

        {/* FILTROS GLOBALES CON ENFOQUE EN ESTADO */}
        <div className="bg-slate-50 border-t border-slate-200 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-x-8 gap-y-4 items-end">
             <div className="flex flex-col">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Almacén Origen</label>
               <select 
                 className="bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 text-xs font-black text-slate-700 outline-none focus:border-emerald-500 shadow-sm min-w-[200px]"
                 value={selectedSede}
                 onChange={(e) => setSelectedSede(e.target.value)}
               >
                 {sedesList.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
             </div>

             <div className="flex flex-col">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Centro de Costo</label>
               <select 
                 className="bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 text-xs font-black text-slate-700 outline-none focus:border-emerald-500 shadow-sm min-w-[180px]"
                 value={selectedCentroCosto}
                 onChange={(e) => setSelectedCentroCosto(e.target.value)}
               >
                 {centroCostoList.map(cc => <option key={cc} value={cc}>{cc}</option>)}
               </select>
             </div>

             <div className="flex flex-col">
               <label className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2 ml-1">Estado (Normalizado)</label>
               <select 
                 className="bg-emerald-50 border-2 border-emerald-500/30 rounded-2xl px-5 py-3 text-xs font-black text-emerald-700 outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm min-w-[180px] appearance-none cursor-pointer"
                 value={selectedEstado}
                 onChange={(e) => setSelectedEstado(e.target.value)}
               >
                 {estadosList.map(est => <option key={est} value={est}>{est}</option>)}
               </select>
             </div>

             <div className="flex gap-4">
               <div className="flex flex-col">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Periodo Inicial</label>
                 <input type="date" className="bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold shadow-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
               </div>
               <div className="flex flex-col">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Periodo Final</label>
                 <input type="date" className="bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold shadow-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
               </div>
             </div>
          </div>
        </div>

        <nav className="bg-white border-t border-slate-200 px-4">
          <div className="max-w-7xl mx-auto flex gap-4">
            <NavBtn active={activeView === 'dashboard'} label="Dashboard" onClick={() => setActiveView('dashboard')} />
            <NavBtn active={activeView === 'detail'} label="Detalle General" onClick={() => setActiveView('detail')} />
            <NavBtn active={activeView === 'cobros'} label="Informe de Cobros" onClick={() => setActiveView('cobros')} highlight />
            <NavBtn active={activeView === 'critical'} label="Items Críticos" onClick={() => setActiveView('critical')} />
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
            <i className="fa-solid fa-file-excel text-8xl mb-6 text-emerald-600 opacity-20 animate-bounce duration-1000"></i>
            <h2 className="text-3xl font-black mb-2 text-slate-800 uppercase tracking-tighter">Bienvenido a Prompt Maestro</h2>
            <p className="max-w-md text-center text-slate-400 font-medium">Importe el reporte de inventario en Excel para iniciar la normalización y liquidación.</p>
          </div>
        ) : (
          <>
            {activeView === 'dashboard' && <Dashboard metrics={sedeMetrics} data={filteredData} />}
            {activeView === 'detail' && <SedeDetail data={filteredData} selectedSede={selectedSede} />}
            {activeView === 'cobros' && <CobrosReport data={filteredData} selectedSede={selectedSede} selectedCentroCosto={selectedCentroCosto} selectedEstado={selectedEstado} startDate={startDate} endDate={endDate} />}
            {activeView === 'critical' && <CriticalItems data={filteredData} />}
          </>
        )}
      </main>
    </div>
  );
};

const NavBtn = ({ active, label, onClick, highlight = false }: any) => (
  <button 
    onClick={onClick} 
    className={`px-8 py-5 text-[11px] font-black uppercase tracking-widest border-b-4 transition-all ${
      active 
        ? 'border-emerald-600 text-emerald-600' 
        : highlight ? 'border-transparent text-emerald-600/60 hover:text-emerald-600 bg-emerald-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'
    }`}
  >
    {label}
  </button>
);

export default App;
