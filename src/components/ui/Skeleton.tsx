import { createContext, useContext, useEffect, useRef } from "react";
import { View, Animated, Easing, DimensionValue, ViewStyle, StyleSheet } from "react-native";
import { useColors, spacing } from "../../tokens";

// ── Shared animation context ──
const ShimmerContext = createContext<Animated.Value | null>(null);

/** Provides a single shimmer animation to all child SkeletonBones */
function ShimmerProvider({ children }: { children: React.ReactNode }) {
  const shimmerX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerX]);

  return <ShimmerContext.Provider value={shimmerX}>{children}</ShimmerContext.Provider>;
}

// ── SkeletonBone ──

interface SkeletonBoneProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/** A single skeleton placeholder "bone" with animated shimmer */
export function SkeletonBone({
  width = "100%",
  height = 16,
  borderRadius = 4,
  style,
}: SkeletonBoneProps) {
  const colors = useColors();
  const parentShimmer = useContext(ShimmerContext);
  // Fallback for standalone use outside ShimmerProvider
  const ownShimmer = useRef(new Animated.Value(-1)).current;
  const shimmerX = parentShimmer ?? ownShimmer;

  useEffect(() => {
    if (parentShimmer) return; // parent drives the loop
    const animation = Animated.loop(
      Animated.timing(ownShimmer, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [parentShimmer, ownShimmer]);

  const translateX = shimmerX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-200, 200],
  });

  return (
    <View
      style={[
        styles.bone,
        { width, height, borderRadius, backgroundColor: colors.bg.highlight },
        style,
      ]}
      importantForAccessibility="no"
      accessibilityElementsHidden
    >
      <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]} />
    </View>
  );
}

// ── SkeletonRow ──

interface SkeletonRowProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function SkeletonRow({ children, style }: SkeletonRowProps) {
  return <View style={[styles.row, style]}>{children}</View>;
}

// ── Shared panel styles ──

function PanelCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const colors = useColors();
  return (
    <View
      style={[
        {
          backgroundColor: colors.bg.elevated,
          borderWidth: 1,
          borderColor: colors.border.subtle,
          borderRadius: 4,
          padding: spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ── HomeScreenSkeleton ──

export function HomeScreenSkeleton() {
  const colors = useColors();

  return (
    <ShimmerProvider>
      <View style={styles.container}>
        {/* Header: title + LevelBadge */}
        <View style={styles.heroRow}>
          <View style={styles.heroLeft}>
            <SkeletonBone width={120} height={10} style={{ marginBottom: 6 }} />
            <SkeletonBone width={80} height={28} style={{ marginBottom: 8 }} />
            <SkeletonBone width="100%" height={8} />
          </View>
          <SkeletonBone width={56} height={56} borderRadius={28} />
        </View>

        {/* Insight cards */}
        <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          <PanelCard
            style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: spacing.md }}
          >
            <SkeletonBone width={32} height={32} borderRadius={4} />
            <View style={{ flex: 1 }}>
              <SkeletonBone width={80} height={8} style={{ marginBottom: 6 }} />
              <SkeletonBone width="100%" height={12} />
            </View>
          </PanelCard>
          <PanelCard
            style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: spacing.md }}
          >
            <SkeletonBone width={32} height={32} borderRadius={4} />
            <View style={{ flex: 1 }}>
              <SkeletonBone width={100} height={8} style={{ marginBottom: 6 }} />
              <SkeletonBone width="85%" height={12} />
            </View>
          </PanelCard>
        </View>

        {/* Streak row */}
        <PanelCard
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: spacing.sm,
          }}
        >
          <SkeletonRow>
            <SkeletonBone width={40} height={40} borderRadius={4} />
            <View>
              <SkeletonBone width={32} height={24} />
              <SkeletonBone width={60} height={8} style={{ marginTop: 4 }} />
            </View>
          </SkeletonRow>
          <View style={{ alignItems: "flex-end" }}>
            <SkeletonBone width={60} height={10} style={{ marginBottom: 4 }} />
            <SkeletonBone width={80} height={8} />
          </View>
        </PanelCard>

        {/* Recovery row */}
        <PanelCard
          style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: spacing.lg }}
        >
          <SkeletonBone width={36} height={36} borderRadius={4} />
          <View style={{ flex: 1 }}>
            <SkeletonBone width={60} height={8} style={{ marginBottom: 6 }} />
            <SkeletonBone width="80%" height={10} />
          </View>
        </PanelCard>

        {/* Daily Mission */}
        <View
          style={{
            backgroundColor: colors.bg.primary,
            borderWidth: 1.5,
            borderColor: colors.border.subtle,
            borderRadius: 4,
            padding: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          <SkeletonBone width={90} height={8} style={{ marginBottom: 8 }} />
          <SkeletonBone width="90%" height={16} style={{ marginBottom: 4 }} />
          <SkeletonBone width="60%" height={16} style={{ marginBottom: spacing.md }} />
          <SkeletonBone width="100%" height={36} borderRadius={4} />
        </View>

        {/* Quick Start Button */}
        <SkeletonBone width="100%" height={48} style={{ marginBottom: spacing.xl }} />

        {/* Section label */}
        <SkeletonBone width={90} height={11} style={{ marginBottom: spacing.md }} />

        {/* Stat cards row */}
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm }}>
          <PanelCard style={{ flex: 1, padding: spacing.sm, minHeight: 60 }}>
            <SkeletonBone width={50} height={8} style={{ marginBottom: 8 }} />
            <SkeletonBone width={40} height={20} />
          </PanelCard>
          <PanelCard style={{ flex: 1, padding: spacing.sm, minHeight: 60 }}>
            <SkeletonBone width={60} height={8} style={{ marginBottom: 8 }} />
            <SkeletonBone width={40} height={20} />
          </PanelCard>
        </View>

        {/* Bento: Featured + Library */}
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm }}>
          <PanelCard style={{ flex: 2, padding: spacing.lg }}>
            <SkeletonBone width="70%" height={16} style={{ marginBottom: 6 }} />
            <SkeletonBone width="90%" height={10} style={{ marginBottom: spacing.md }} />
            <SkeletonRow style={{ flexWrap: "wrap", gap: 4, marginBottom: spacing.md }}>
              <SkeletonBone width={60} height={20} borderRadius={4} />
              <SkeletonBone width={50} height={20} borderRadius={4} />
              <SkeletonBone width={70} height={20} borderRadius={4} />
            </SkeletonRow>
            <SkeletonBone width="100%" height={1} style={{ marginBottom: 8 }} />
            <SkeletonBone width={50} height={10} />
          </PanelCard>
          <PanelCard
            style={{
              flex: 1,
              padding: spacing.md,
              alignItems: "center",
              justifyContent: "center",
              minHeight: 120,
            }}
          >
            <SkeletonBone
              width={36}
              height={36}
              borderRadius={18}
              style={{ marginBottom: spacing.sm }}
            />
            <SkeletonBone width={60} height={8} style={{ marginBottom: 4 }} />
            <SkeletonBone width={50} height={8} />
          </PanelCard>
        </View>

        {/* Remaining workout cards */}
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm }}>
          {[0, 1].map((i) => (
            <PanelCard key={i} style={{ flex: 1, padding: spacing.lg }}>
              <SkeletonBone width="60%" height={14} style={{ marginBottom: 6 }} />
              <SkeletonBone width="80%" height={10} style={{ marginBottom: spacing.md }} />
              <SkeletonRow style={{ flexWrap: "wrap", gap: 4, marginBottom: spacing.md }}>
                <SkeletonBone width={50} height={18} borderRadius={4} />
                <SkeletonBone width={40} height={18} borderRadius={4} />
              </SkeletonRow>
              <SkeletonBone width="100%" height={1} style={{ marginBottom: 6 }} />
              <SkeletonBone width={40} height={10} />
            </PanelCard>
          ))}
        </View>

        {/* Program structure panel */}
        <PanelCard style={{ marginTop: spacing.sm }}>
          <SkeletonBone width={120} height={9} style={{ marginBottom: spacing.md }} />
          {[0, 1, 2].map((i) => (
            <SkeletonRow
              key={i}
              style={{ justifyContent: "space-between", marginBottom: spacing.sm }}
            >
              <SkeletonBone width={80} height={9} />
              <SkeletonBone width={120} height={11} />
            </SkeletonRow>
          ))}
        </PanelCard>
      </View>
    </ShimmerProvider>
  );
}

// ── TrainScreenSkeleton ──

export function TrainScreenSkeleton() {
  const colors = useColors();

  return (
    <ShimmerProvider>
      <View style={styles.container}>
        {/* Header */}
        <View style={{ marginBottom: spacing.lg }}>
          <SkeletonBone width={140} height={10} style={{ marginBottom: 6 }} />
          <SkeletonBone width={160} height={28} />
        </View>

        {/* Recommendation panel */}
        <PanelCard style={{ marginBottom: spacing.sm }}>
          <SkeletonBone width={160} height={9} style={{ marginBottom: spacing.md }} />
          <SkeletonBone width="100%" height={12} style={{ marginBottom: 6 }} />
          <SkeletonBone width="85%" height={12} style={{ marginBottom: spacing.md }} />
          <SkeletonBone
            width="100%"
            height={36}
            borderRadius={4}
            style={{ marginBottom: spacing.sm }}
          />
          <SkeletonBone width={100} height={8} />
        </PanelCard>

        {/* Section label */}
        <SkeletonBone width={110} height={11} style={{ marginBottom: spacing.md }} />

        {/* Workout cards */}
        {[0, 1, 2, 3].map((i) => (
          <PanelCard key={i} style={{ padding: spacing.lg, marginBottom: spacing.md }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <SkeletonBone width="60%" height={16} style={{ marginBottom: 6 }} />
                <SkeletonBone width="80%" height={10} />
              </View>
              <SkeletonBone width={40} height={20} borderRadius={4} />
            </View>
            <SkeletonRow
              style={{ flexWrap: "wrap", gap: 4, marginTop: spacing.md, marginBottom: spacing.md }}
            >
              <SkeletonBone width={60} height={18} borderRadius={4} />
              <SkeletonBone width={50} height={18} borderRadius={4} />
              <SkeletonBone width={70} height={18} borderRadius={4} />
            </SkeletonRow>
            <SkeletonBone width="100%" height={1} style={{ marginBottom: 8 }} />
            <SkeletonBone width={40} height={10} />
          </PanelCard>
        ))}

        {/* Exercise library link */}
        <View
          style={{
            backgroundColor: colors.bg.elevated,
            borderWidth: 1.5,
            borderColor: colors.border.subtle,
            borderRadius: 4,
            borderStyle: "dashed",
            padding: spacing.lg,
            marginBottom: spacing.md,
            alignItems: "center",
          }}
        >
          <SkeletonBone width={140} height={18} style={{ marginBottom: 6 }} />
          <SkeletonBone width="70%" height={11} style={{ marginBottom: spacing.md }} />
          <SkeletonBone width={70} height={24} borderRadius={4} />
        </View>

        {/* Program info */}
        <PanelCard>
          <SkeletonBone width={130} height={9} style={{ marginBottom: spacing.md }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonRow
              key={i}
              style={{ justifyContent: "space-between", marginBottom: spacing.sm }}
            >
              <SkeletonBone width={80} height={9} />
              <SkeletonBone width={140} height={11} />
            </SkeletonRow>
          ))}
        </PanelCard>
      </View>
    </ShimmerProvider>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing[5],
  },
  heroLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  bone: {
    overflow: "hidden",
  },
  shimmerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
