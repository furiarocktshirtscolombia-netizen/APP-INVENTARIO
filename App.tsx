
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

  /**
   * SECUENCIA MAESTRA DE EXPORTACIÓN (html2canvas + jsPDF)
   * 1. Activar modo exportación (desmonta charts)
   * 2. Esperar renderizado limpio
   * 3. Capturar canvas y generar PDF
   */
  const handleDownloadReport = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (data.length === 0) return;

    try {
      console.log("EXPORT MODE ON");
      setIsDownloading(true);
      
      // Espera para asegurar unmount de charts y render de PDF_PRINT_ROOT
      await new Promise((r) => setTimeout(r, 800));

      const el = document.getElementById("PDF_PRINT_ROOT");
      if (!el) {
        console.error("PDF_PRINT_ROOT no encontrado");
        setIsDownloading(false);
        return;
      }

      console.log("PRINT ROOT READY - CAPTURING CANVAS");
      
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1240,
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

      // Agregar primera página
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Agregar páginas adicionales si es necesario
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const viewFriendly = activeView.toUpperCase();
      pdf.save(`Reporte_Inventario_${viewFriendly}_${selectedSede}_${dateStr}.pdf`);
      
      console.log("EXPORT DONE");
    } catch (err) {
      console.error("Error exportando PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  // VISTA DE EXPORTACIÓN EXCLUSIVA (SIN CHARTS)
  const renderPrintView = () => (
    <div 
      id="PDF_PRINT_ROOT" 
      className="bg-white p-10"
      style={{ 
        width: '1240px', 
        minHeight: '900px', 
        background: '#ffffff',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 999999,
        overflow: 'visible'
      }}
    >
      <div className="flex justify-between items-center mb-12 border-b-8 border-slate-900 pb-8">
        <div className="flex items-center gap-6">
          <div className="bg-emerald-600 p-5 rounded-2xl text-white">
            <i className="fa-solid fa-file-invoice-dollar text-5xl"></i>
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              REPORTE: {activeView === 'dashboard' ? 'RESUMEN EJECUTIVO' : activeView === 'cobros' ? 'LIQUIDACIÓN COBROS' : 'ÍTEMS CRÍTICOS'}
            </h1>
            <p className="text-emerald-600 font-black uppercase tracking-widest mt-3 text-sm">RELIABILITY PRO - GESTIÓN INVENTARIOS</p>
          </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emisión:</p>
           <p className="font-black text-slate-800 text-xl">{new Date().toLocaleString('es-CO')}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl mb-12">
        <div><p className="text-[9px] font-black text-slate-400 uppercase">Sede:</p><p className="font-black text-sm uppercase">{selectedSede}</p></div>
        <div><p className="text-[9px] font-black text-slate-400 uppercase">C. Costo:</p><p className="font-black text-sm uppercase">{selectedCentroCosto}</p></div>
        <div><p className="text-[9px] font-black text-slate-400 uppercase">Estado:</p><p className="font-black text-sm uppercase">{selectedEstado}</p></div>
        <div><p className="text-[9px] font-black text-slate-400 uppercase">Ítems:</p><p className="font-black text-sm uppercase">{filteredData.length}</p></div>
      </div>

      <div className="pdf-body">
        {activeView === 'dashboard' && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px]">
                <th className="p-4 text-left">Sede / Centro Costo</th>
                <th className="p-4 text-right">Confiabilidad (%)</th>
                <th className="p-4 text-right">Cobro</th>
                <th className="p-4 text-right">Ajuste</th>
              </tr>
            </thead>
            <tbody>
              {sedeMetrics.map(m => (
                <React.Fragment key={m.almacen}>
                  <tr className="border-b border-slate-200">
                    <td className="p-4 font-black uppercase text-slate-900">{m.almacen}</td>
                    <td className="p-4 text-right font-black text-emerald-600 text-lg">{m.globalReliability.toFixed(2)}%</td>
                    <td className="p-4 text-right font-black text-rose-600">{formatCurrency(m.totalCobro)}</td>
                    <td className="p-4 text-right font-bold text-slate-700">{formatCurrency(m.totalCostoAjuste)}</td>
                  </tr>
                  {Object.entries(m.ccMetrics).map(([ccName, ccData]) => (
                    <tr key={`${m.almacen}-${ccName}`} className="bg-slate-50/50">
                      <td className="p-2 pl-12 text-[10px] font-black text-slate-400 uppercase">└ {ccName}</td>
                      <td className="p-2 text-right text-[10px] font-black text-emerald-600/70">{ccData.reliability.toFixed(2)}%</td>
                      <td></td>
                      <td></td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}

        {activeView === 'cobros' && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px]">
                <th className="p-4 text-left">Descripción / Centro Costo</th>
                <th className="p-4 text-center">Unidad</th>
                <th className="p-4 text-center">Variación</th>
                <th className="p-4 text-right">Valor Cobro</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.filter(i => i.Cobro > 0).map(item => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="p-4">
                    <p className="font-black uppercase text-xs">{item.Artículo}</p>
                    <p className="text-[9px] text-slate-400 uppercase">{item["Centro de Costos"]}</p>
                  </td>
                  <td className="p-4 text-center font-bold text-slate-500">{item.Unidad}</td>
                  <td className="p-4 text-center font-black text-rose-600">{item["Variación Stock"]}</td>
                  <td className="p-4 text-right font-black text-slate-900">{formatCurrency(item.Cobro)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50">
                <td colSpan={3} className="p-6 text-right font-black uppercase text-xs">Total Cobros Reportados:</td>
                <td className="p-6 text-right font-black text-3xl border-t-4 border-emerald-600">{formatCurrency(filteredData.reduce((acc, i) => acc + i.Cobro, 0))}</td>
              </tr>
            </tfoot>
          </table>
        )}

        {activeView === 'critical' && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[11px]">
                <th className="p-4 text-left">Artículo / Sede</th>
                <th className="p-4 text-center">Unidad</th>
                <th className="p-4 text-center">Desviación</th>
                <th className="p-4 text-right bg-rose-700">Valor Cobro</th>
              </tr>
            </thead>
            <tbody>
              {[...filteredData]
                .filter(i => i.Estado !== 'Sin Novedad')
                .sort((a,b) => b.Cobro - a.Cobro)
                .map(item => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="p-4">
                    <p className="font-black uppercase text-xs">{item.Artículo}</p>
                    <p className="text-[9px] text-slate-400 uppercase">{item.Almacén} - {item["Centro de Costos"]}</p>
                  </td>
                  <td className="p-4 text-center font-bold">{item.Unidad}</td>
                  <td className="p-4 text-center font-black text-rose-600">{item["Variación Stock"]}</td>
                  <td className="p-4 text-right font-black text-rose-700">{formatCurrency(item.Cobro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-20 pt-10 border-t-4 border-slate-900 text-center">
         <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em]">REPORTE GENERADO MEDIANTE PROMPT MAESTRO - RELIABILITY PRO SYSTEM</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      {isDownloading ? (
        // MODO EXPORTACIÓN: Solo se renderiza el contenedor limpio para html2canvas
        renderPrintView()
      ) : (
        // UI OPERATIVA NORMAL
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
                    DESCARGAR REPORTE
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Estado</label>
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
                {activeView === 'dashboard' && <Dashboard metrics={sedeMetrics} data={filteredData} onSelectCC={setSelectedCentroCosto} isDownloadingPDF={isDownloading} />}
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
      )}
    </div>
  );
};

const NavBtn = ({ active, label, onClick, highlight = false }: any) => (
  <button onClick={onClick} className={`px-8 py-5 text-[11px] font-black uppercase tracking-widest border-b-4 transition-all whitespace-nowrap ${active ? 'border-emerald-600 text-emerald-600' : highlight ? 'text-emerald-600/60' : 'text-slate-400 hover:text-slate-600'}`}>
    {label}
  </button>
);

export default App;
