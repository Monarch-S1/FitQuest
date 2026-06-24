import { View, Dimensions } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { useColors, spacing, fonts } from "../../tokens";
import { StreakDay } from "../../utils/chartData";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface StreakCalendarProps {
  data: StreakDay[];
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CELL_SIZE = 14;
const CELL_GAP = 3;

export function StreakCalendar({ data }: StreakCalendarProps) {
  const colors = useColors();
  const weeks: StreakDay[][] = [];
  let currentWeek: StreakDay[] = [];

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

  const totalH = weeks.length * (CELL_SIZE + CELL_GAP);
  const width = SCREEN_WIDTH - spacing.xxl;

  return (
    <View>
      <Svg width={width} height={totalH + 24}>
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
