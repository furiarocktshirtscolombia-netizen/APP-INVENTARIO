
import { InventoryRawRow, ProcessedItem, SedeMetrics } from '../types';

export const calculateItemReliability = (row: InventoryRawRow): number => {
  const stockSistema = Number(row["Stock a Fecha"]) || 0;
  const stockFisico = Number(row["Stock Inventario"]) || 0;
  const variacion = Math.abs(Number(row["Variación Stock"]) || 0);
  
  // Formula obligatoria: (1 - (ABS(Variación Stock) / MAX(Stock a Fecha, Stock Inventario, 1))) * 100
  const maxStock = Math.max(stockSistema, stockFisico, 1);
  const reliability = 1 - (variacion / maxStock);
  
  return Math.max(0, Math.min(1, reliability));
};

export const getTrafficLightColor = (percentage: number): string => {
  if (percentage >= 95) return 'emerald';
  if (percentage >= 85) return 'amber';
  return 'rose';
};

/**
 * Procesa los datos del Excel aplicando un mapeo robusto para asegurar que 
 * campos como "Almacén" se capturen incluso si tienen nombres ligeramente distintos.
 */
export const processInventoryData = (data: any[]): ProcessedItem[] => {
  return data.map((row, index) => {
    // Mapeo robusto para "Almacén" (Sede)
    const almacen = String(row["Almacén"] || row["Almacen"] || row["Sede"] || row["Punto de Venta"] || "Sede Sin Nombre").trim();
    const articulo = String(row["Artículo"] || row["Articulo"] || "Artículo Desconocido").trim();
    const subarticulo = String(row["Subartículo"] || row["Subarticulo"] || "N/A").trim();
    
    const stockSistema = Number(row["Stock a Fecha"]) || Number(row["Stock Sistema"]) || 0;
    const stockFisico = Number(row["Stock Inventario"]) || Number(row["Stock Físico"]) || 0;
    const variacion = Number(row["Variación Stock"]) ?? (stockFisico - stockSistema);
    
    // El costo unitario se toma de "Coste Línea" o "Costo Unitario"
    const costeLinea = Number(row["Coste Línea"]) || Number(row["Costo Unitario"]) || 0;
    
    // El costo de ajuste se toma del Excel o se calcula si no existe
    const costoAjuste = Number(row["Costo Ajuste"]) ?? (variacion * costeLinea);
    
    const cobro = Number(row["Cobro"]) || 0;
    const estado = String(row["Estado"] || (variacion < 0 ? "Faltante" : variacion > 0 ? "Sobrante" : "Sin novedad"));

    const sanitizedRow: InventoryRawRow = {
      ...row,
      "Almacén": almacen,
      "Artículo": articulo,
      "Subartículo": subarticulo,
      "Stock a Fecha": stockSistema,
      "Stock Inventario": stockFisico,
      "Variación Stock": variacion,
      "Coste Línea": costeLinea,
      "Costo Ajuste": costoAjuste,
      "Cobro": cobro,
      "Estado": estado
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
    let weightedReliabilitySum = 0;
    let totalWeight = 0;
    let totalCobro = 0;
    let totalFaltantes = 0;
    let totalSobrantes = 0;
    let totalCostoAjuste = 0;

    items.forEach(item => {
      // Peso_Economico = ABS(Costo Ajuste)
      const weight = Math.abs(Number(item["Costo Ajuste"]) || 0);
      const effectiveWeight = weight || 1; 
      
      const itemRelPct = item.reliability * 100;
      weightedReliabilitySum += itemRelPct * effectiveWeight;
      totalWeight += effectiveWeight;
      
      totalCobro += Number(item.Cobro) || 0;
      totalCostoAjuste += Number(item["Costo Ajuste"]) || 0;
      
      const variacion = Number(item["Variación Stock"]) || 0;
      if (variacion < 0) totalFaltantes++;
      else if (variacion > 0) totalSobrantes++;
    });

    return {
      almacen,
      // Confiabilidad_Sede_Pct = SUM(Confiabilidad_Item_Pct * Peso_Economico) / SUM(Peso_Economico)
      globalReliability: totalWeight > 0 ? (weightedReliabilitySum / totalWeight) : 100,
      totalCobro,
      totalFaltantes,
      totalSobrantes,
      totalCostoAjuste,
      itemCount: items.length
    };
  });
};
