
import { InventoryRawRow, ProcessedItem, SedeMetrics } from '../types';

export const calculateItemReliability = (row: InventoryRawRow): number => {
  const stockSistema = Number(row["Stock a Fecha"]) || 0;
  const stockFisico = Number(row["Stock Inventario"]) || 0;
  const variacion = Math.abs(Number(row["Variación Stock"]) || 0);
  
  // Formula: (1 - (ABS(Variación Stock) / MAX(Stock a Fecha, Stock Inventario, 1))) * 100
  const maxStock = Math.max(stockSistema, stockFisico, 1);
  const reliability = 1 - (variacion / maxStock);
  
  return Math.max(0, Math.min(1, reliability));
};

export const getTrafficLightColor = (percentage: number): string => {
  if (percentage >= 95) return 'emerald';
  if (percentage >= 85) return 'amber';
  return 'rose';
};

export const processInventoryData = (data: InventoryRawRow[]): ProcessedItem[] => {
  return data.map((row, index) => ({
    ...row,
    id: `${row.Almacén}-${row.Artículo}-${index}`,
    reliability: calculateItemReliability(row)
  }));
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
      const effectiveWeight = weight || 1; // Fallback a 1 para no ignorar items de costo 0
      
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
