import {
  AirQualityLevel,
  GasThresholdConfig,
  LEVEL_STYLES,
  getAirQualityLevel,
} from "@/lib/airQuality";

interface GasQualityBadgeProps {
  value: number | null | undefined;
  thresholds: GasThresholdConfig;
  showReference?: boolean;
}

export function GasQualityBadge({
  value,
  thresholds,
  showReference = false,
}: GasQualityBadgeProps) {
  const level = getAirQualityLevel(value, thresholds);
  if (!level) return null;

  const style = LEVEL_STYLES[level];

  return (
    <div className="mt-2 space-y-1">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.badge}`}
      >
        <span
          className="w-2 h-2 rounded-full bg-white/90 shrink-0"
          aria-hidden
        />
        {style.label}
      </span>
      {showReference && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
          {thresholds.reference}
        </p>
      )}
    </div>
  );
}

export function getGasCardBorderClass(
  value: number | null | undefined,
  thresholds: GasThresholdConfig
): string {
  const level = getAirQualityLevel(value, thresholds);
  return level ? LEVEL_STYLES[level].border : "border-l-transparent";
}

export function getGasIconClass(
  value: number | null | undefined,
  thresholds: GasThresholdConfig,
  fallback: string
): string {
  const level = getAirQualityLevel(value, thresholds);
  return level ? LEVEL_STYLES[level].icon : fallback;
}

export type { AirQualityLevel };
