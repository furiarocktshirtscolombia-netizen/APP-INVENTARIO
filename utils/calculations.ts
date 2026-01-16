
import { InventoryRawRow, ProcessedItem, SedeMetrics } from '../types';

/**
 * NORMALIZACIÓN DE FECHAS
 */
export const normalizeDate = (val: any): string => {
  if (!val) return '';
  
  let dateObj: Date | null = null;

  if (typeof val === 'number') {
    dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
  } else if (val instanceof Date) {
    dateObj = val;
  } else {
    const str = String(val).trim();
    if (!str || str === '-') return '';
    const parts = str.split(/[\/\-]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else if (parts[0].length === 4) {
        dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    if (!dateObj || isNaN(dateObj.getTime())) {
      dateObj = new Date(str);
    }
  }

  if (dateObj && !isNaN(dateObj.getTime())) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '';
};

export const parseCurrency = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val || String(val).trim() === '-' || String(val).trim() === '') return 0;
  return parseFloat(String(val).replace(/[^0-9.-]+/g, "")) || 0;
};

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
    const articulo = String(row["Artículo"] || row["Articulo"] || "Articulo").trim();
    const subarticulo = String(row["Subartículo"] || row["Subarticulo"] || "").trim();
    const centroCosto = String(row["Centro de Costos"] || "General").trim();
    const stockSistema = Number(row["Stock a Fecha"]) || 0;
    const stockFisico = Number(row["Stock Inventario"]) || 0;
    const variacion = Number(row["Variación Stock"]) ?? (stockFisico - stockSistema);
    const rawDate = row["Fecha Doc"] || row["Fecha"] || "";
    const fechaOperativa = normalizeDate(rawDate);
    const rawCobro = parseCurrency(row["Cobro"]);
    const costoAjuste = parseCurrency(row["Costo Ajuste"]);
    const cobro = (rawCobro === 0 && costoAjuste !== 0) ? Math.abs(costoAjuste) : rawCobro;
    const reliability = variacion === 0 ? 1 : 0;
    let unidad = String(row["Unidad"] || row["Unid."] || row["U.M."] || row["Unid"] || row["UNIDAD"] || "").trim().toUpperCase();
    const commonUnits = ["ONZA", "UNIDADES", "GRAMOS", "KG", "GRAMO", "ONZAS", "UND", "UNIDAD", "LT", "LITRO", "BOTELLA"];
    if ((!unidad || unidad === "-" || unidad === "UND") && subarticulo) {
      if (commonUnits.includes(subarticulo.toUpperCase())) { unidad = subarticulo.toUpperCase(); }
    }
    const estadoNormalizado = normalizeEstado(row["Estado"], variacion);
    return {
      ...row,
      id: `${almacen}-${articulo}-${index}`,
      "Almacén": almacen,
      "Artículo": articulo,
      "Subartículo": subarticulo,
      "Centro de Costos": centroCosto,
      "Stock a Fecha": stockSistema,
      "Stock Inventario": stockFisico,
      "Variación Stock": variacion,
      "Cobro": cobro,
      "Costo Ajuste": costoAjuste,
      "Unidad": unidad || "UND",
      "Estado": estadoNormalizado,
      "Estado_Normalizado": estadoNormalizado,
      "Fecha_Operativa": fechaOperativa,
      "Fecha Doc": fechaOperativa,
      reliability
    } as ProcessedItem;
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
    let perfectItems = 0;
    let totalCobro = 0;
    let totalCostoAjuste = 0;
    let totalFaltantes = 0;
    let totalSobrantes = 0;
    const ccDataMap: Record<string, { perfect: number; total: number }> = {};
    items.forEach(item => {
      const cc = item["Centro de Costos"] || "General";
      if (!ccDataMap[cc]) ccDataMap[cc] = { perfect: 0, total: 0 };
      ccDataMap[cc].total++;
      if (item.reliability === 1) { perfectItems++; ccDataMap[cc].perfect++; }
      const cobroEfectivo = item.Estado_Normalizado === 'Faltantes' ? -item.Cobro : item.Cobro;
      totalCobro += cobroEfectivo;
      totalCostoAjuste += item["Costo Ajuste"];
      if (item.Estado_Normalizado === 'Faltantes') totalFaltantes++;
      else if (item.Estado_Normalizado === 'Sobrantes') totalSobrantes++;
    });
    const ccMetrics: Record<string, { reliability: number; count: number }> = {};
    Object.entries(ccDataMap).forEach(([name, data]) => {
      ccMetrics[name] = { reliability: (data.perfect / data.total) * 100, count: data.total };
    });
    return {
      almacen,
      globalReliability: items.length > 0 ? (perfectItems / items.length) * 100 : 100,
      totalCobro,
      totalFaltantes,
      totalSobrantes,
      totalCostoAjuste,
      itemCount: items.length,
      ccMetrics
    };
  });
};

export const getTrafficLightColor = (percentage: number): string => {
  if (percentage >= 85) return 'emerald';
  if (percentage >= 60) return 'amber';
  return 'rose';
};

export const getStatusLabel = (percentage: number): string => {
  if (percentage >= 85) return 'EXCELENTE';
  if (percentage >= 60) return 'ATENCIÓN';
  return 'CRÍTICO';
};

export const getRiskLevelText = (percentage: number): string => {
  if (percentage >= 85) return 'Riesgo Bajo (Confiable)';
  if (percentage >= 60) return 'Riesgo Medio (Atención)';
  return 'Riesgo Alto (Crítico)';
};
