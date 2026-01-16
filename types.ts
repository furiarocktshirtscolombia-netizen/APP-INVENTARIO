
export interface InventoryRawRow {
  "Fecha Doc": any;
  "Serie": string | number;
  "Número": string | number;
  "Almacén": string;
  "Centro de Costos": string;
  "Subfamilia": string;
  "Artículo": string;
  "Subartículo": string;
  "Unidad": string;
  "Stock a Fecha": number;
  "Stock Inventario": number;
  "Variación Stock": number;
  "Coste Línea": number;
  "Costo Ajuste": number;
  "Cobro": number;
  "Estado": string;
  "Fecha_Operativa"?: string; // Campo normalizado YYYY-MM-DD
}

export interface ProcessedItem extends InventoryRawRow {
  reliability: number; // 0 o 1
  id: string;
  Fecha_Operativa: string;
}

export interface SedeMetrics {
  almacen: string;
  globalReliability: number;
  totalCobro: number;
  totalFaltantes: number;
  totalSobrantes: number;
  totalCostoAjuste: number;
  itemCount: number;
  ccMetrics: Record<string, { reliability: number; count: number }>;
}

export type ViewType = 'dashboard' | 'detail' | 'cobros' | 'critical';
export type FilterMode = 'Día' | 'Mes';
