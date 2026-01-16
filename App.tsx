
import React, { useState, useMemo } from 'react';
import { ViewType, ProcessedItem, InventoryRawRow, FilterMode } from './types';
import { processInventoryData, aggregateSedeMetrics } from './utils/calculations';
import Dashboard from './components/Dashboard';
import SedeDetail from './components/SedeDetail';
import CobrosReport from './components/CobrosReport';
import CriticalItems from './components/CriticalItems';
import FileUpload from './components/FileUpload';

// Definición para evitar errores de tipado con las librerías externas
declare var html2canvas: any;
declare var jspdf: any;

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [data, setData] = useState<ProcessedItem[]>([]);
  const [selectedSede, setSelectedSede] = useState<string>('Todas');
  const [selectedCentroCosto, setSelectedCentroCosto] = useState<string>('Todos');
  const [selectedEstado, setSelectedEstado] = useState<string>('Todos');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterMode, setFilterMode] = useState<FilterMode>('Día');
  const [isDownloading, setIsDownloading] = useState(false);

  const filteredData = useMemo(() => {
    let result = data;
    if (selectedSede !== 'Todas') {
      result = result.filter(item => item.Almacén === selectedSede);
    }
    if (selectedCentroCosto !== 'Todos') {
      result = result.filter(item => item["Centro de Costos"] === selectedCentroCosto);
    }
    if (selectedEstado !== 'Todos') {
      result = result.filter(item => item.Estado_Normalizado === selectedEstado);
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

  /**
   * MOTOR DE EXPORTACIÓN MAESTRO
   */
  const handleDownloadReport = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (data.length === 0) return;

    try {
      setIsDownloading(true);
      
      // Espera técnica para que los componentes PDF terminen de renderizar en el contenedor oculto
      await new Promise((r) => setTimeout(r, 1200));

      const el = document.getElementById("PDF_EXPORT_CONTAINER");
      if (!el) {
        setIsDownloading(false);
        return;
      }
      
      const canvas = await html2canvas(el, {
        scale: 2, // Mejora calidad
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: 1240,
        logging: false
      });

      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = jspdf;
      const pdf = new jsPDF("p", "pt", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Primera página
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Páginas subsiguientes
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      pdf.save(`ReliabilityPro_Reporte_${activeView.toUpperCase()}_${dateStr}.pdf`);
    } catch (err) {
      console.error("Error en exportación PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatCurrency = (val: number) => {
    const formatted = new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(Math.abs(val));
    return val < 0 ? `-${formatted}` : formatted;
  };

  /**
   * VISTA DE EXPORTACIÓN (ESTRUCTURA FIJA PARA PDF)
   */
  const renderPrintView = () => (
    <div 
      id="PDF_EXPORT_CONTAINER" 
      className="bg-white p-12 text-slate-900"
      style={{ 
        width: '1240px', 
        minHeight: '1600px', 
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 999999,
        overflow: 'visible',
        backgroundColor: '#ffffff'
      }}
    >
      {/* CABECERA CORPORATIVA */}
      <div className="flex justify-between items-center mb-16 border-b-8 border-slate-900 pb-12">
        <div className="flex items-center gap-10">
          <div className="bg-emerald-600 p-8 rounded-[40px] text-white shadow-2xl">
            <i className="fa-solid fa-brain text-7xl"></i>
          </div>
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter leading-none mb-3">
              RELIABILITY PRO: {activeView === 'dashboard' ? 'RESUMEN EJECUTIVO' : 'REPORTE DE AUDITORÍA'}
            </h1>
            <p className="text-emerald-600 font-black uppercase tracking-[0.4em] text-xl">Soporte Operativo Certificado</p>
          </div>
        </div>
        <div className="text-right border-l-4 border-slate-100 pl-10">
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fecha Emisión:</p>
           <p className="font-black text-slate-800 text-3xl">{new Date().toLocaleDateString('es-CO')}</p>
        </div>
      </div>

      {/* METADATOS Y RESUMEN */}
      <div className="grid grid-cols-4 gap-8 p-12 bg-slate-50 border-2 border-slate-100 rounded-[50px] mb-16">
        <div><p className="text-xs font-black text-slate-400 uppercase mb-2">Sede:</p><p className="font-black text-2xl uppercase">{selectedSede}</p></div>
        <div><p className="text-xs font-black text-slate-400 uppercase mb-2">C. Costo:</p><p className="font-black text-2xl uppercase">{selectedCentroCosto}</p></div>
        <div><p className="text-xs font-black text-slate-400 uppercase mb-2">Estado Filtro:</p><p className="font-black text-2xl uppercase">{selectedEstado}</p></div>
        <div><p className="text-xs font-black text-slate-400 uppercase mb-2">Artículos:</p><p className="font-black text-2xl uppercase">{filteredData.length}</p></div>
      </div>

      {/* CONTENIDO PRINCIPAL PDF */}
      <div className="pdf-body">
        {activeView === 'dashboard' && (
          <div className="space-y-16">
            <div className="grid grid-cols-3 gap-8">
               <div className="bg-white p-10 border-2 border-slate-100 rounded-[40px] text-center">
                  <p className="text-xs font-black text-slate-400 uppercase mb-4">Salud Global</p>
                  <p className="text-6xl font-black text-slate-900">{(filteredData.filter(i=>i.reliability===1).length / (filteredData.length || 1) * 100).toFixed(1)}%</p>
               </div>
               <div className="bg-rose-50 p-10 border-2 border-rose-200 rounded-[40px] text-center">
                  <p className="text-xs font-black text-rose-400 uppercase mb-4">Monto Liquidación</p>
                  <p className="text-5xl font-black text-rose-600">{formatCurrency(filteredData.reduce((a,b)=>a+(b.Estado_Normalizado==='Faltantes'?-b.Cobro:b.Cobro),0))}</p>
               </div>
               <div className="bg-slate-900 p-10 rounded-[40px] text-center text-white">
                  <p className="text-xs font-black text-slate-500 uppercase mb-4">Total Ajustes</p>
                  <p className="text-5xl font-black">{formatCurrency(filteredData.reduce((a,b)=>a+b["Costo Ajuste"], 0))}</p>
               </div>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[14px] font-black tracking-widest">
                  <th className="p-8 text-left">Almacén Auditado</th>
                  <th className="p-8 text-center">Confiabilidad (%)</th>
                  <th className="p-8 text-right">Impacto Balance</th>
                </tr>
              </thead>
              <tbody>
                {sedeMetrics.map(m => (
                  <tr key={m.almacen} className="border-b-2 border-slate-50">
                    <td className="p-8 font-black uppercase text-slate-900 text-2xl">{m.almacen}</td>
                    <td className="p-8 text-center font-black text-2xl">{m.globalReliability.toFixed(2)}%</td>
                    <td className={`p-8 text-right font-black text-2xl ${m.totalCobro < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatCurrency(m.totalCobro)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(activeView === 'cobros' || activeView === 'detail' || activeView === 'critical') && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[12px] font-black tracking-widest">
                <th className="p-6 text-left">Artículo / Centro Costo</th>
                <th className="p-6 text-center">Unidad</th>
                <th className="p-6 text-center">Variación</th>
                <th className="p-6 text-right bg-slate-800">Valor Neto</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => {
                const isFaltante = item.Estado_Normalizado === 'Faltantes';
                const displayVal = isFaltante ? -item.Cobro : item.Cobro;
                return (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="p-6">
                      <p className="font-black uppercase text-xl text-slate-800 mb-1">{item.Artículo}</p>
                      <p className="text-xs text-slate-400 font-black uppercase tracking-widest">{item["Centro de Costos"]} — {item.Estado_Normalizado}</p>
                    </td>
                    <td className="p-6 text-center font-bold text-slate-400 text-lg">{item.Unidad}</td>
                    <td className={`p-6 text-center font-black text-2xl ${isFaltante ? 'text-rose-600' : 'text-emerald-600'}`}>{item["Variación Stock"]}</td>
                    <td className={`p-6 text-right font-black text-2xl ${isFaltante ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {item.Estado_Normalizado !== 'Sin Novedad' ? formatCurrency(displayVal) : '0'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50">
                <td colSpan={3} className="p-12 text-right font-black uppercase text-xl tracking-widest text-slate-400">Balance Final Reportado:</td>
                <td className={`p-12 text-right font-black text-6xl border-t-[10px] ${filteredData.reduce((a,b)=>a+(b.Estado_Normalizado==='Faltantes'?-b.Cobro:b.Cobro),0) < 0 ? 'text-rose-600 border-rose-600' : 'text-emerald-600 border-emerald-600'}`}>
                  {formatCurrency(filteredData.reduce((a,b)=>a+(b.Estado_Normalizado==='Faltantes'?-b.Cobro:b.Cobro),0))}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* PIE DE PÁGINA Y FIRMAS PDF */}
      <div className="mt-32 pt-24 border-t-8 border-slate-900">
         <div className="flex justify-between gap-40 mb-24">
            <div className="flex-1 border-t-2 border-slate-100 pt-6">
               <p className="text-sm font-black uppercase text-slate-400 mb-16">Firma Auditoría Senior</p>
               <div className="h-0.5 bg-slate-50 w-full mb-3"></div>
               <p className="text-xs font-bold text-slate-300 uppercase">Validación de Datos</p>
            </div>
            <div className="flex-1 border-t-2 border-slate-100 pt-6">
               <p className="text-sm font-black uppercase text-slate-400 mb-16">Firma Gerente General</p>
               <div className="h-0.5 bg-slate-50 w-full mb-3"></div>
               <p className="text-xs font-bold text-slate-300 uppercase">Autorización Administrativa</p>
            </div>
         </div>
         <p className="text-[14px] font-black text-slate-200 uppercase tracking-[1em] text-center">RELIABILITY PRO SYSTEM — AUDITORÍA CERTIFICADA INTERNACIONAL</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      {isDownloading && renderPrintView()}
      
      <div className="flex flex-col min-h-screen">
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
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                  disabled={data.length === 0}
                >
                  <i className="fa-solid fa-file-pdf"></i>
                  {isDownloading ? 'GENERANDO PDF...' : 'DESCARGAR REPORTE'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border-t border-slate-200 py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-x-6 gap-y-4 items-end">
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sede / Almacén</label>
                <select className="bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 text-xs font-black text-slate-700 shadow-sm min-w-[180px]" value={selectedSede} onChange={(e) => setSelectedSede(e.target.value)}>
                  {sedesList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Centro de Costo</label>
                <select className="bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 text-xs font-black text-slate-700 shadow-sm min-w-[150px]" value={selectedCentroCosto} onChange={(e) => setSelectedCentroCosto(e.target.value)}>
                  {centroCostoList.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Estado (Normalizado)</label>
                <select className="bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 text-xs font-black text-slate-700 shadow-sm min-w-[140px]" value={selectedEstado} onChange={(e) => setSelectedEstado(e.target.value)}>
                  <option value="Todos">Todos</option>
                  <option value="Faltantes">Faltantes</option>
                  <option value="Sobrantes">Sobrantes</option>
                  <option value="Sin Novedad">Sin Novedad</option>
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
                <input type={filterMode === 'Día' ? "date" : "month"} className="bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold shadow-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
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

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
              <i className="fa-solid fa-file-excel text-8xl mb-6 text-emerald-600 opacity-20"></i>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Sin Datos Cargados</h2>
              <p className="text-sm font-medium">Use el botón superior para importar el reporte de Excel.</p>
            </div>
          ) : (
            <div>
              {activeView === 'dashboard' && <Dashboard metrics={sedeMetrics} data={filteredData} onSelectCC={setSelectedCentroCosto} />}
              {activeView === 'detail' && <SedeDetail data={filteredData} selectedSede={selectedSede} />}
              {activeView === 'cobros' && <CobrosReport data={filteredData} selectedSede={selectedSede} selectedCentroCosto={selectedCentroCosto} selectedEstado={selectedEstado} startDate={startDate} endDate={endDate} />}
              {activeView === 'critical' && <CriticalItems data={filteredData} />}
            </div>
          )}
        </main>
        
        <footer className="py-10 border-t border-slate-200 text-center no-print">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Reliability Pro &copy; {new Date().getFullYear()} - Auditoría de Restaurantes</p>
        </footer>
      </div>
    </div>
  );
};

const NavBtn = ({ active, label, onClick, highlight = false }: any) => (
  <button onClick={onClick} className={`px-8 py-5 text-[11px] font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${active ? 'border-emerald-600 text-emerald-600' : highlight ? 'text-emerald-600/60' : 'text-slate-400 hover:text-slate-600'}`}>
    {label}
  </button>
);

export default App;
