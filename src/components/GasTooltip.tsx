import type { TooltipContentProps } from "recharts";
import {
  GasThresholdConfig,
  LEVEL_STYLES,
  getAirQualityLevel,
} from "@/lib/airQuality";

export function createGasTooltip(thresholds: GasThresholdConfig) {
  return function GasTooltip({
    active,
    payload,
    label,
  }: TooltipContentProps) {
    if (!active || !payload?.[0]) return null;

    const raw = payload[0].value;
    const value = typeof raw === "number" ? raw : Number(raw);
    if (Number.isNaN(value)) return null;

    const level = getAirQualityLevel(value, thresholds);
    const style = level ? LEVEL_STYLES[level] : null;

    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-sm">
        <p className="text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">
          {thresholds.name} ({thresholds.pollutant})
        </p>
        <p className="font-bold text-slate-800 dark:text-slate-100">
          {value} {thresholds.unit}
        </p>
        {style && (
          <p
            className={`mt-1 font-semibold ${style.badge} inline-block px-2 py-0.5 rounded-full text-xs`}
          >
            {style.label}
          </p>
        )}
      </div>
    );
  };
}
