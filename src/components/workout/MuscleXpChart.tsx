import { View, Text, Dimensions } from "react-native";
import Svg, { Polyline, Circle, Line, G, Text as SvgText } from "react-native-svg";
import { useColors, typography, spacing, fonts } from "../../tokens";
import { MuscleXpHistory } from "../../utils/muscleXp";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface MuscleXpChartProps {
  history: MuscleXpHistory;
  accent: string;
}

/** Mini sparkline chart showing XP progression for a muscle over sessions */
export function MuscleXpChart({ history, accent }: MuscleXpChartProps) {
  const colors = useColors();
  const { points } = history;

  if (points.length < 2) {
    return (
      <View
        style={{
          height: 80,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg.elevated,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: colors.border.subtle,
        }}
      >
        <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 9 }}>
          Complete more sessions to see XP trend
        </Text>
      </View>
    );
  }

  const chartW = SCREEN_WIDTH - spacing.xxl - 32;
  const chartH = 80;
  const pad = { top: 10, right: 10, bottom: 18, left: 30 };
  const plotW = chartW - pad.left - pad.right;
  const plotH = chartH - pad.top - pad.bottom;

  const maxTotalXp = Math.max(...points.map((p) => p.totalXp), 1);
  const yMax = maxTotalXp * 1.2;

  const pts = points.map((p, i) => {
    const x = pad.left + (i / Math.max(points.length - 1, 1)) * plotW;
    const y = pad.top + plotH - (p.totalXp / yMax) * plotH;
    return { x, y, totalXp: p.totalXp, level: p.level, date: p.date };
  });

  const linePoints = pts.map((p) => `${p.x},${p.y}`).join(" ");

  // Y-axis ticks
  const yTicks = 3;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const y = pad.top + (i / yTicks) * plotH;
    const val = Math.round(yMax - (i / yTicks) * yMax);
    return { y, label: String(val) };
  });

  return (
    <View
      style={{
        backgroundColor: colors.bg.elevated,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        padding: spacing.sm,
      }}
    >
      <View
        style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs }}
      >
        <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 8 }}>
          XP PROGRESSION
        </Text>
        <Text style={{ ...typography.label, color: accent, fontSize: 8 }}>
          {points.length} SESSIONS
        </Text>
      </View>

      <Svg width={chartW} height={chartH}>
        {/* Grid lines */}
        {gridLines.map((gl, i) => (
          <G key={i}>
            <Line
              x1={pad.left}
              y1={gl.y}
              x2={chartW - pad.right}
              y2={gl.y}
              stroke={colors.border.subtle}
              strokeWidth={0.5}
            />
            <SvgText
              x={pad.left - 4}
              y={gl.y + 3}
              fill={colors.text.secondary}
              fontSize={7}
              textAnchor="end"
              fontFamily={fonts.body.regular}
            >
              {gl.label}
            </SvgText>
          </G>
        ))}

        {/* Data line */}
        <Polyline
          points={linePoints}
          fill="none"
          stroke={accent}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data dots */}
        {pts.map((p, i) => (
          <G key={i}>
            <Circle cx={p.x} cy={p.y} r={4} fill={colors.bg.primary} />
            <Circle cx={p.x} cy={p.y} r={2.5} fill={accent} />
          </G>
        ))}

        {/* X-axis labels */}
        {pts.map((p, i) => {
          const showLabel =
            i === 0 ||
            i === pts.length - 1 ||
            (pts.length > 5 && i % Math.ceil(pts.length / 4) === 0);
          if (!showLabel) return null;
          const d = new Date(p.date + "T12:00:00");
          const label = `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}`;
          return (
            <SvgText
              key={i}
              x={p.x}
              y={chartH - 4}
              fill={colors.text.secondary}
              fontSize={7}
              textAnchor="middle"
              fontFamily={fonts.body.regular}
            >
              {label}
            </SvgText>
          );
        })}

        {/* Level change annotations */}
        {pts.map((p, i) => {
          if (i === 0) return null;
          const prev = pts[i - 1];
          if (p.level > prev.level) {
            return (
              <SvgText
                key={`lvl-${i}`}
                x={p.x}
                y={p.y - 6}
                fill={colors.success}
                fontSize={7}
                textAnchor="middle"
                fontFamily={fonts.body.semiBold}
              >
                LV.{p.level}
              </SvgText>
            );
          }
          return null;
        })}
      </Svg>
    </View>
  );
}
