import { ReferenceArea, ReferenceLine } from "recharts";
import { GasThresholdConfig } from "@/lib/airQuality";

interface GasChartReferencesProps {
  thresholds: GasThresholdConfig;
}

export function GasChartReferences({ thresholds }: GasChartReferencesProps) {
  const { bomMax, moderadoMax, unit } = thresholds;

  return (
    <>
      <ReferenceArea y1={0} y2={bomMax} fill="#22c55e" fillOpacity={0.08} />
      <ReferenceArea y1={bomMax} y2={moderadoMax} fill="#f59e0b" fillOpacity={0.08} />
      <ReferenceLine
        y={bomMax}
        stroke="#22c55e"
        strokeDasharray="6 4"
        strokeWidth={2}
        label={{
          value: `Limite seguro (${bomMax} ${unit})`,
          position: "insideTopRight",
          fill: "#16a34a",
          fontSize: 11,
        }}
      />
      <ReferenceLine
        y={moderadoMax}
        stroke="#f59e0b"
        strokeDasharray="4 4"
        strokeWidth={1.5}
        label={{
          value: `Alerta (${moderadoMax} ${unit})`,
          position: "insideBottomRight",
          fill: "#d97706",
          fontSize: 10,
        }}
      />
    </>
  );
}
