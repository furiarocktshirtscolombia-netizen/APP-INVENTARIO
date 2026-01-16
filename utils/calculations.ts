
import { InventoryRawRow, ProcessedItem, SedeMetrics } from '../types';

/**
 * Función de utilidad para limpiar y convertir strings de moneda a números.
 * Implementa la lógica: REPLACE($, ''), REPLACE(., ''), REPLACE(',', '.')
 */
const parseCurrency = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val || String(val).trim() === '-' || String(val).trim() === '') return 0;
  
  const cleaned = String(val)
    .replace(/\$/g, '')      // Quita el signo de peso
    .replace(/\./g, '')      // Quita puntos de miles
    .replace(/,/g, '.')      // Cambia coma decimal por punto
    .trim();
    
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

/**
 * Nueva lógica de Confiabilidad por Ítem:
 * 1 si Variación = 0, 0 en caso contrario.
 */
export const calculateItemReliability = (row: InventoryRawRow): number => {
  const variacion = Number(row["Variación Stock"]) || 0;
  return variacion === 0 ? 1 : 0;
};

export const getTrafficLightColor = (percentage: number): string => {
  if (percentage >= 95) return 'emerald';
  if (percentage >= 85) return 'amber';
  return 'rose';
};

/**
 * ESTADO NORMALIZADO (REGLA MAESTRA)
 */
export const normalizeEstado = (estadoRaw: any, variacion: number): string => {
  const val = String(estadoRaw || "").trim().toUpperCase();
  
  if (val === 'FALTANTE' || val === 'FALTANTES') return 'Faltantes';
  if (val === 'SOBRANTE' || val === 'SOBRANTES') return 'Sobrantes';
  if (val === 'SIN NOVEDAD' || val === 'SINNOVEDAD') return 'Sin Novedad';
  
  if (variacion < 0) return 'Faltantes';
  if (variacion > 0) return 'Sobrantes';
  
  return 'Sin Novedad';
};

export const processInventoryData = (data: any[]): ProcessedItem[] => {
  return data.map((row, index) => {
    const almacen = String(row["Almacén"] || row["Almacen"] || "Sede Sin Nombre").trim();
    const articulo = String(row["Artículo"] || row["Articulo"] || "Artículo Desconocido").trim();
    const stockSistema = Number(row["Stock a Fecha"]) || 0;
    const stockFisico = Number(row["Stock Inventario"]) || 0;
    const variacion = Number(row["Variación Stock"]) ?? (stockFisico - stockSistema);
    
    // Priorización del campo real de inventario solicitado
    const unidad = String(
      row["Unidad de Inventario"] || 
      row["Unidad de Medida"] || 
      row["Unidad de medida"] || 
      row["Unidad"] || 
      row["U.M."] || 
      "-"
    ).trim();
    
    const estadoNormalizado = normalizeEstado(row["Estado"], variacion);

    // Parsing robusto de valores financieros (Cobro_Num)
    const cobroParsed = parseCurrency(row["Cobro"]);
    const costeLinea = parseCurrency(row["Coste Línea"]);
    const costoAjusteParsed = row["Costo Ajuste"] !== undefined ? parseCurrency(row["Costo Ajuste"]) : (variacion * costeLinea);

    const sanitizedRow: InventoryRawRow = {
      ...row,
      "Almacén": almacen,
      "Artículo": articulo,
      "Centro de Costos": String(row["Centro de Costos"] || "General").trim(),
      "Stock a Fecha": stockSistema,
      "Stock Inventario": stockFisico,
      "Variación Stock": variacion,
      "Coste Línea": costeLinea,
      "Costo Ajuste": costoAjusteParsed,
      "Cobro": cobroParsed,
      "Unidad": unidad,
      "Estado": estadoNormalizado 
    };

    return {
      ...sanitizedRow,
      id: `${almacen}-${articulo}-${index}`,
      reliability: calculateItemReliability(sanitizedRow)
    };
  });
};

export const aggregateSedeMetrics = (processedData: ProcessedItem[]): SedeMetrics[] => {
  const map = new Map<string, ProcessedItem[]>();
  
  processedData.forEach(item => {
    const list = map.get(item.Almacén) || [];
    list.push(item);
    map.set(item.Almacén, list);
  });

  return Array.from(map.entries()).map(([almacen, items]) => {
    let reliableCount = 0;
    let totalCobro = 0;
    let totalFaltantes = 0;
    let totalSobrantes = 0;
    let totalCostoAjuste = 0;

    items.forEach(item => {
      if (item.reliability === 1) reliableCount++;
      totalCobro += item.Cobro;
      totalCostoAjuste += item["Costo Ajuste"];
      
      if (item.Estado === 'Faltantes') totalFaltantes++;
      else if (item.Estado === 'Sobrantes') totalSobrantes++;
    });

    return {
      almacen,
      // (SUM(Item_Sin_Variacion) / SUM(Total_Item)) * 100
      globalReliability: items.length > 0 ? (reliableCount / items.length) * 100 : 100,
      totalCobro,
      totalFaltantes,
      totalSobrantes,
      totalCostoAjuste,
      itemCount: items.length
    };
  });
};
