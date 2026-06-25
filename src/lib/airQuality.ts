/**
 * Escala de qualidade do ar para sensores MQ da estação meteorológica.
 *
 * MQ135 (qualidade do ar / CO₂ proxy):
 *   - OMS: CO₂ interno ≤ 1000 ppm = aceitável; 1000–2000 ppm = qualidade inferior;
 *     > 2000 ppm = insatisfatório (WHO Guidelines for Indoor Air Quality, 2010).
 *   - ASHRAE Standard 62.1: ventilação adequada com CO₂ ≤ 1000 ppm acima do externo.
 *
 * MQ02 / MQ-2 (gás combustível — LPG, metano, propano):
 *   - ACGIH TLV-TWA: metano e propano ~1000 ppm (8 h).
 *   - NR-15 (Brasil): limites de tolerância para hidrocarbonetos alifáticos.
 *   - CETESB: monitoramento de emissões/atmosfera — faixas de alerta progressivas.
 *
 * Nota: sensores MQ entregam valores calibrados empiricamente; os limiares seguem
 * as referências acima e podem ser ajustados conforme baseline da estação.
 */

export type AirQualityLevel = "bom" | "moderado" | "perigoso";

export interface GasThresholdConfig {
  /** Símbolo químico do poluente medido (proxy/calibração do sensor) */
  pollutant: string;
  /** Nome por extenso do poluente */
  name: string;
  /** Modelo do sensor na estação */
  sensor: string;
  bomMax: number;
  moderadoMax: number;
  unit: string;
  reference: string;
}

/** Rótulo padrão: "Dióxido de Carbono - ppm" */
export function getGasDisplayLabel(config: GasThresholdConfig): string {
  return `${config.name} - ${config.unit}`;
}

/** Rótulo completo com sensor: "Dióxido de Carbono (CO₂) · MQ-135" */
export function getGasChartTitle(config: GasThresholdConfig): string {
  return `${config.name} (${config.pollutant}) · ${config.sensor}`;
}

/** MQ-135 — proxy de CO₂ para qualidade do ar interno (OMS + ASHRAE) */
export const MQ135_THRESHOLDS: GasThresholdConfig = {
  pollutant: "CO₂",
  name: "Dióxido de Carbono",
  sensor: "MQ-135",
  bomMax: 1000,
  moderadoMax: 2000,
  unit: "ppm",
  reference: "OMS / ASHRAE 62.1 — CO₂ ≤ 1000 ppm (aceitável)",
};

/** MQ-2 — metano e gases combustíveis (LPG, propano) — NR-15 / ACGIH / CETESB */
export const MQ02_THRESHOLDS: GasThresholdConfig = {
  pollutant: "CH₄",
  name: "Metano",
  sensor: "MQ-2",
  bomMax: 300,
  moderadoMax: 1000,
  unit: "ppm",
  reference: "NR-15 / ACGIH — TLV metano e gases combustíveis ~1000 ppm",
};

export const LEVEL_STYLES: Record<
  AirQualityLevel,
  {
    label: string;
    badge: string;
    border: string;
    icon: string;
    chartColor: string;
  }
> = {
  bom: {
    label: "Bom",
    badge: "bg-emerald-500 text-white",
    border: "border-l-emerald-500",
    icon: "bg-emerald-500",
    chartColor: "#22c55e",
  },
  moderado: {
    label: "Moderado",
    badge: "bg-amber-500 text-white",
    border: "border-l-amber-500",
    icon: "bg-amber-500",
    chartColor: "#f59e0b",
  },
  perigoso: {
    label: "Perigoso",
    badge: "bg-red-500 text-white",
    border: "border-l-red-500",
    icon: "bg-red-500",
    chartColor: "#ef4444",
  },
};

const LEVEL_ORDER: Record<AirQualityLevel, number> = {
  bom: 0,
  moderado: 1,
  perigoso: 2,
};

export function getAirQualityLevel(
  value: number | null | undefined,
  thresholds: GasThresholdConfig
): AirQualityLevel | null {
  if (value == null || Number.isNaN(Number(value))) return null;
  const v = Number(value);
  if (v <= thresholds.bomMax) return "bom";
  if (v <= thresholds.moderadoMax) return "moderado";
  return "perigoso";
}

export function getWorstLevel(
  ...levels: (AirQualityLevel | null)[]
): AirQualityLevel | null {
  const valid = levels.filter((l): l is AirQualityLevel => l != null);
  if (valid.length === 0) return null;
  return valid.reduce((worst, current) =>
    LEVEL_ORDER[current] > LEVEL_ORDER[worst] ? current : worst
  );
}
