import { useMemo } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { pillarsToRadarData, type PillarRadarInput } from "@/lib/fullAuditRadarData";

const RADAR_STROKE = "#E8A838";
const RADAR_FILL = "#E8A838";

type FullAuditRadarProps = {
  pillars: PillarRadarInput[];
  isAr: boolean;
};

export function FullAuditRadar({ pillars, isAr }: FullAuditRadarProps) {
  const data = useMemo(() => pillarsToRadarData(pillars, isAr), [pillars, isAr]);

  if (data.length === 0) return null;

  const ariaLabel = isAr
    ? `رادار درجات المحاور السبعة، من صفر إلى مئة`
    : `Radar chart of up to seven pillar scores from 0 to 100`;

  return (
    <section
      className="rounded-xl border border-border/80 bg-card/50 px-2 py-4 sm:px-4"
      aria-label={ariaLabel}
    >
      <h2 className="font-bold text-lg mb-1 text-center px-2">
        {isAr ? "توزيع المحاور" : "Pillar scores"}
      </h2>
      <p className="text-xs text-muted-foreground text-center mb-2 px-2">
        {isAr ? "كل محور من ٠ إلى ١٠٠ — نفس منطق تقرير PDF" : "Each axis 0–100 — same logic as the PDF report"}
      </p>
      <div className="w-full mx-auto max-w-lg" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="52%" outerRadius="72%" data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tickCount={6}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              axisLine={false}
            />
            <Radar
              name={isAr ? "الدرجة" : "Score"}
              dataKey="score"
              stroke={RADAR_STROKE}
              fill={RADAR_FILL}
              fillOpacity={0.33}
              strokeWidth={2}
              dot={{ r: 3, fill: RADAR_STROKE, strokeWidth: 1, stroke: "#fff" }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(var(--border))",
                fontSize: 12,
              }}
              formatter={(value: number) => [`${value}/100`, isAr ? "الدرجة" : "Score"]}
              labelFormatter={(label) => label}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
