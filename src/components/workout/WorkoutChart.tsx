import { useMemo } from "react";
import { View, Text, Dimensions } from "react-native";
import Svg, {
  Line,
  Rect,
  Circle,
  Polyline,
  Defs,
  LinearGradient,
  Stop,
  G,
  Text as SvgText,
} from "react-native-svg";
import { useColors, typography, spacing, fonts } from "../../tokens";
import { ChartData, StreakDay, WeekdayCount } from "../../utils/chartData";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_HEIGHT = 180;
const PAD = { top: 20, right: 16, bottom: 32, left: 36 };
const DOT_RADIUS = 3;

// ─── Line Chart ───────────────────────────────────────────────────────────────

interface LineChartProps {
  data: ChartData;
  accent?: string;
}

export function LineChart({ data, accent }: LineChartProps) {
  const colors = useColors();
  const resolvedAccent = accent ?? colors.accent.DEFAULT;

  const width = SCREEN_WIDTH - spacing[8];
  const plotW = width - PAD.left - PAD.right;
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;

  const { points, maxValue } = data;

  const renderData = useMemo(() => {
    if (points.length === 0) return null;
    const yMax = maxValue * 1.2 || 1;

    const pts = points.map((p, i) => {
      const x = PAD.left + (i / Math.max(points.length - 1, 1)) * plotW;
      const y = PAD.top + plotH - (p.value / yMax) * plotH;
      return { x, y, label: p.label, value: p.value, date: p.date };
    });

    const linePoints = pts.map((p) => `${p.x},${p.y}`).join(" ");

    // Y-axis ticks
    const yTicks = 4;
    const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
      const y = PAD.top + (i / yTicks) * plotH;
      const val = Math.round(yMax - (i / yTicks) * yMax);
      return { y, label: String(val) };
    });

    return { pts, linePoints, yMax, gridLines };
  }, [points, maxValue, plotW, plotH]);

  if (!renderData || points.length === 0) {
    return <EmptyChart />;
  }

  const { pts, linePoints, gridLines } = renderData;

  return (
    <Svg width={width} height={CHART_HEIGHT}>
      <Defs>
        <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={resolvedAccent} stopOpacity={0.25} />
          <Stop offset="1" stopColor={resolvedAccent} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {/* Grid & Y-axis labels */}
      {gridLines.map((gl, i) => (
        <G key={i}>
          <Line
            x1={PAD.left}
            y1={gl.y}
            x2={width - PAD.right}
            y2={gl.y}
            stroke={colors.border.subtle}
            strokeWidth={0.5}
          />
          <SvgText
            x={PAD.left - 5}
            y={gl.y + 3}
            fill={colors.text.secondary}
            fontSize={9}
            textAnchor="end"
            fontFamily={fonts.body.regular}
          >
            {gl.label}
          </SvgText>
        </G>
      ))}

      {/* Area fill */}
      {pts.length > 1 && (
        <Polyline
          points={`${pts[0].x},${CHART_HEIGHT - PAD.bottom} ${linePoints} ${pts[pts.length - 1].x},${CHART_HEIGHT - PAD.bottom}`}
          fill="url(#chartFill)"
          stroke="none"
        />
      )}

      {/* Data line */}
      <Polyline
        points={linePoints}
        fill="none"
        stroke={resolvedAccent}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data dots */}
      {pts.map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={DOT_RADIUS + 2} fill={colors.bg.primary} />
          <Circle cx={p.x} cy={p.y} r={DOT_RADIUS} fill={resolvedAccent} />
        </G>
      ))}

      {/* X-axis labels */}
      {pts.map((p, i) => {
        const showLabel =
          i === 0 ||
          i === pts.length - 1 ||
          (pts.length > 5 && i % Math.ceil(pts.length / 4) === 0);
        if (!showLabel) return null;
        return (
          <SvgText
            key={i}
            x={p.x}
            y={CHART_HEIGHT - 4}
            fill={colors.text.secondary}
            fontSize={8}
            textAnchor="middle"
            fontFamily={fonts.body.regular}
          >
            {p.label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

interface BarChartProps {
  data: ChartData;
  accent?: string;
  barCount?: number;
}

export function BarChart({ data, accent }: BarChartProps) {
  const colors = useColors();
  const resolvedAccent = accent ?? colors.accent.DEFAULT;

  const width = SCREEN_WIDTH - spacing[8];
  const plotW = width - PAD.left - PAD.right;
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;

  const { points, maxValue } = data;

  const renderData = useMemo(() => {
    if (points.length === 0) return null;
    const yMax = maxValue * 1.2 || 1;

    const barGap = 4;
    const totalGaps = (points.length - 1) * barGap;
    const barW = Math.max(4, Math.min(20, (plotW - totalGaps) / points.length));

    const bars = points.map((p, i) => {
      const x = PAD.left + i * (barW + barGap);
      const barH = (p.value / yMax) * plotH;
      const y = PAD.top + plotH - barH;
      return { x, y, w: barW, h: barH, label: p.label, value: p.value };
    });

    // Y-axis ticks
    const yTicks = 4;
    const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
      const y = PAD.top + (i / yTicks) * plotH;
      const val = Math.round(yMax - (i / yTicks) * yMax);
      return { y, label: String(val) };
    });

    return { bars, gridLines, yMax };
  }, [points, maxValue, plotW, plotH]);

  if (!renderData || points.length === 0) {
    return <EmptyChart />;
  }

  const { bars, gridLines } = renderData;

  return (
    <Svg width={width} height={CHART_HEIGHT}>
      {/* Grid & Y-axis */}
      {gridLines.map((gl, i) => (
        <G key={i}>
          <Line
            x1={PAD.left}
            y1={gl.y}
            x2={width - PAD.right}
            y2={gl.y}
            stroke={colors.border.subtle}
            strokeWidth={0.5}
          />
          <SvgText
            x={PAD.left - 5}
            y={gl.y + 3}
            fill={colors.text.secondary}
            fontSize={9}
            textAnchor="end"
            fontFamily={fonts.body.regular}
          >
            {gl.label}
          </SvgText>
        </G>
      ))}

      {/* Bars */}
      {bars.map((b, i) => (
        <G key={i}>
          <Rect x={b.x} y={b.y} width={b.w} height={b.h} fill={resolvedAccent} opacity={0.85} rx={1} />
        </G>
      ))}

      {/* X-axis labels */}
      {bars.map((b, i) => {
        const showLabel =
          bars.length <= 8 ||
          i === 0 ||
          i === bars.length - 1 ||
          (bars.length > 8 && i % Math.ceil(bars.length / 5) === 0);
        if (!showLabel) return null;
        return (
          <SvgText
            key={i}
            x={b.x + b.w / 2}
            y={CHART_HEIGHT - 4}
            fill={colors.text.secondary}
            fontSize={8}
            textAnchor="middle"
            fontFamily={fonts.body.regular}
          >
            {b.label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ─── Streak Calendar ──────────────────────────────────────────────────────────

interface StreakCalendarProps {
  data: StreakDay[];
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CELL_SIZE = 14;
const CELL_GAP = 3;

export function StreakCalendar({ data }: StreakCalendarProps) {
  const colors = useColors();
  // Group into weeks (rows of 7)
  const weeks: StreakDay[][] = [];
  let currentWeek: StreakDay[] = [];

  // Pad the start to align with day of week
  if (data.length > 0) {
    const firstDayOfWeek = data[0].dayOfWeek;
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({
        date: "",
        hasWorkout: false,
        dayOfWeek: i,
        isToday: false,
      });
    }
  }

  for (const day of data) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const totalW = DAY_NAMES.length * (CELL_SIZE + CELL_GAP);
  const totalH = weeks.length * (CELL_SIZE + CELL_GAP);
  const width = SCREEN_WIDTH - spacing[8];

  return (
    <View>
      <Svg width={width} height={totalH + 24}>
        {/* Weekday headers */}
        {DAY_NAMES.map((name, i) => (
          <SvgText
            key={i}
            x={i * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2}
            y={12}
            fill={colors.text.secondary}
            fontSize={7}
            textAnchor="middle"
            fontFamily={fonts.body.semiBold}
          >
            {name[0]}
          </SvgText>
        ))}

        {/* Calendar cells */}
        {weeks.map((week, wi) =>
          week.map((day, di) => {
            if (!day.date) {
              return (
                <Rect
                  key={`${wi}-${di}`}
                  x={di * (CELL_SIZE + CELL_GAP)}
                  y={wi * (CELL_SIZE + CELL_GAP) + 18}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  fill="transparent"
                />
              );
            }

            const fill = day.isToday
              ? colors.accent.DEFAULT
              : day.hasWorkout
                ? colors.success
                : colors.bg.elevated;

            const stroke = day.isToday ? colors.accent.light : "transparent";

            return (
              <Rect
                key={`${wi}-${di}`}
                x={di * (CELL_SIZE + CELL_GAP)}
                y={wi * (CELL_SIZE + CELL_GAP) + 18}
                width={CELL_SIZE}
                height={CELL_SIZE}
                fill={fill}
                stroke={stroke}
                strokeWidth={day.isToday ? 1.5 : 0}
                rx={2}
                opacity={day.hasWorkout || day.isToday ? 1 : 0.6}
              />
            );
          }),
        )}
      </Svg>
    </View>
  );
}

// ─── Weekday Bar Chart ────────────────────────────────────────────────────────

interface WeekdayChartProps {
  data: (WeekdayCount & { percentage: number })[];
  accent?: string;
}

export function WeekdayChart({ data, accent }: WeekdayChartProps) {
  const colors = useColors();
  const resolvedAccent = accent ?? colors.accent.DEFAULT;
  const barH = 16;
  const gap = 8;
  const totalH = data.length * (barH + gap);
  const width = SCREEN_WIDTH - spacing[8];
  const labelW = 30;
  const barMaxW = width - labelW - 32;

  return (
    <Svg width={width} height={totalH + 4}>
      {data.map((d, i) => {
        const barWidth = Math.max(2, (d.percentage / 100) * barMaxW);
        const y = i * (barH + gap);
        return (
          <G key={i}>
            <SvgText
              x={0}
              y={y + barH / 2 + 4}
              fill={colors.text.secondary}
              fontSize={9}
              textAnchor="start"
              fontFamily={fonts.body.regular}
            >
              {d.day}
            </SvgText>
            <Rect
              x={labelW}
              y={y}
              width={barWidth}
              height={barH}
              fill={resolvedAccent}
              opacity={0.7}
              rx={2}
            />
            <SvgText
              x={labelW + barWidth + 6}
              y={y + barH / 2 + 4}
              fill={colors.text.primary}
              fontSize={9}
              textAnchor="start"
              fontFamily={fonts.body.semiBold}
            >
              {String(d.count)}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyChart() {
  const colors = useColors();
  const width = SCREEN_WIDTH - spacing[8];
  return (
    <View
      style={{
        height: CHART_HEIGHT,
        width,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.border.subtle,
        borderRadius: 4,
        backgroundColor: colors.bg.elevated,
      }}
    >
      <Text
        style={{
          ...typography.bodySmall,
          color: colors.text.secondary,
          fontSize: 11,
          textAlign: "center",
          padding: spacing[4],
        }}
      >
        Complete workouts to see your progress here.
      </Text>
    </View>
  );
}
