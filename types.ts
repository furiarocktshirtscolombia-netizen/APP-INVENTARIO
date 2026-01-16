
export interface InventoryRawRow {
  "Fecha Doc": any;
  "Serie": string | number;
  "Número": string | number;
  "Almacén": string;
  "Centro de Costos": string;
  "Subfamilia": string;
  "Artículo": string;
  "Subartículo": string;
  "Stock a Fecha": number;
  "Stock Inventario": number;
  "Variación Stock": number;
  "Coste Línea": number;
  "Costo Ajuste": number;
  "Cobro": number;
  "Estado": string;
}

export interface ProcessedItem extends InventoryRawRow {
  reliability: number; // 0 to 1
  id: string;
}

export interface SedeMetrics {
  almacen: string;
  globalReliability: number;
  totalCobro: number;
  totalFaltantes: number;
  totalSobrantes: number;
  totalCostoAjuste: number;
  itemCount: number;
}

export type ViewType = 'dashboard' | 'detail' | 'cobros' | 'critical';
