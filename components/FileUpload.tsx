
import React, { useRef } from 'react';
import { InventoryRawRow } from '../types';

declare var XLSX: any;

interface FileUploadProps {
  onDataLoaded: (data: InventoryRawRow[]) => void;
  showFull?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, showFull = true }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      onDataLoaded(data as InventoryRawRow[]);
      
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const loadSampleData = () => {
    const sampleData: any[] = [
      {
        "Fecha Doc": "2024-03-01", "Almacén": "Sede Norte", "Artículo": "Whisky Buchanans", "Subartículo": "Botella 750ml", "Unidad de Inventario": "ONZA",
        "Stock a Fecha": 100, "Stock Inventario": 98, "Variación Stock": -2, "Costo Ajuste": -150000, "Cobro": 150000, "Estado": "Faltante",
        "Serie": "A", "Número": "101", "Centro de Costos": "Bar", "Subfamilia": "Licores", "Coste Línea": 75000
      },
      {
        "Fecha Doc": "2024-03-01", "Almacén": "Sede Sur", "Artículo": "Solomito Res", "Subartículo": "Corte premium", "Unidad de Inventario": "GRAMOS",
        "Stock a Fecha": 5000, "Stock Inventario": 4800, "Variación Stock": -200, "Costo Ajuste": -45000, "Cobro": 45000, "Estado": "Faltante",
        "Serie": "A", "Número": "102", "Centro de Costos": "Cocina", "Subfamilia": "Carnes", "Coste Línea": 225
      },
      {
        "Fecha Doc": "2024-03-02", "Almacén": "Sede Norte", "Artículo": "Salmon", "Subartículo": "Filete", "Unidad de Inventario": "UNIDADES",
        "Stock a Fecha": 20, "Stock Inventario": 15, "Variación Stock": -5, "Costo Ajuste": -250000, "Cobro": 250000, "Estado": "Faltante",
        "Serie": "A", "Número": "103", "Centro de Costos": "Cocina", "Subfamilia": "Pescados", "Coste Línea": 50000
      },
      {
        "Fecha Doc": "2024-03-02", "Almacén": "Sede Central", "Artículo": "Cerveza Corona", "Subartículo": "Botella", "Unidad de Inventario": "UNIDADES",
        "Stock a Fecha": 200, "Stock Inventario": 200, "Variación Stock": 0, "Costo Ajuste": 0, "Cobro": 0, "Estado": "Sin novedad",
        "Serie": "A", "Número": "104", "Centro de Costos": "Bar", "Subfamilia": "Cervezas", "Coste Línea": 4500
      },
      {
         "Fecha Doc": "2024-03-02", "Almacén": "Sede Norte", "Artículo": "Vino Merlot", "Subartículo": "Botella 750ml", "Unidad de Inventario": "COPA",
         "Stock a Fecha": 12, "Stock Inventario": 11, "Variación Stock": -1, "Costo Ajuste": -83000, "Cobro": 83000, "Estado": "Faltante",
         "Serie": "A", "Número": "105", "Centro de Costos": "Bar", "Subfamilia": "Vinos", "Coste Línea": 83000
      }
    ];
    onDataLoaded(sampleData as InventoryRawRow[]);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  if (!showFull) {
    return (
      <>
        <button 
          onClick={triggerUpload}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-600 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors shadow-sm"
        >
          <i className="fa-solid fa-plus-circle"></i>
          Nuevo Reporte
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".xlsx, .xls" 
          onChange={handleFile} 
        />
      </>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <button 
        onClick={loadSampleData}
        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline px-2 transition-colors"
      >
        Cargar Demo
      </button>
      <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95">
        <i className="fa-solid fa-cloud-arrow-up"></i>
        Importar Excel
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept=".xlsx, .xls" 
          onChange={handleFile} 
        />
      </label>
    </div>
  );
};

export default FileUpload;
