import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useColors, typography, spacing } from "../../tokens";
import { Exercise } from "../../data/exercises";
import { exerciseVideoIds } from "../../data/exerciseVideos";
import { useDialog } from "../ui/Dialog";
import { searchExerciseVideo } from "../../services/youtubeSearch";

interface ExerciseDemoProps {
  exercise: Exercise;
}

type ActiveTab = "video" | "guide";
type SearchState = "searching" | "found" | "failed";

export function ExerciseDemo({ exercise }: ExerciseDemoProps) {
  const colors = useColors();
  const dialog = useDialog();
  const [activeTab, setActiveTab] = useState<ActiveTab>("video");
  const curatedVideoId = exerciseVideoIds[exercise.id];

  // Fallback search state — always searching until result returns
  // (curated videos use embedUrl directly, so searchState is irrelevant)
  const [searchState, setSearchState] = useState<SearchState>("searching");
  const [searchVideoId, setSearchVideoId] = useState<string | null>(null);
  const [searchInitiated, setSearchInitiated] = useState(false);

  const checkpoints = useMemo(() => {
    if (exercise.visualGuide?.checkpoints) {
      return exercise.visualGuide.checkpoints;
    }
    return [
      {
        phase: "SETUP" as const,
        instruction: "Assume standard posture and prepare for movement execution.",
        focusPoint: "Core stabilization",
      },
      {
        phase: "EXECUTION" as const,
        instruction: "Execute the movement smoothly under continuous mechanical tension.",
        focusPoint: "Tempo compliance",
      },
      {
        phase: "SAFETY" as const,
        instruction:
          "Perform with perfect form and stop immediately if experiencing sharp joint pain.",
        focusPoint: "Joint safety",
      },
    ];
  }, [exercise]);

  // ── Open YouTube video in device browser / YouTube app ──
  // We use expo-web-browser instead of WebView embedding because YouTube
  // blocks embedded playback on mobile WebViews in release builds.

  const openInBrowser = useCallback(
    (videoId: string) => {
      const url = `https://www.youtube.com/watch?v=${videoId}`;
      WebBrowser.openBrowserAsync(url, {
        toolbarColor: "#0F1115",
        controlsColor: "#F59E0B",
      }).catch(() => {
        dialog.alert({
          title: "Unable to open browser",
          message: "Please check your device settings.",
        });
      });
    },
    [dialog],
  );

  // ── Fallback YouTube search for exercises without curated IDs ──

  useEffect(() => {
    if (!curatedVideoId && !searchInitiated && activeTab === "video") {
      setSearchInitiated(true);

      searchExerciseVideo(exercise.id, exercise.name).then((result) => {
        if (result.videoId) {
          setSearchVideoId(result.videoId);
          setSearchState("found");
        } else {
          setSearchState("failed");
        }
      });
    }
  }, [curatedVideoId, searchInitiated, activeTab, exercise.id, exercise.name]);

  const handleSearchYouTube = useCallback(() => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${exercise.name} exercise form`,
    )}`;
    WebBrowser.openBrowserAsync(url, {
      toolbarColor: "#0F1115",
      controlsColor: "#F59E0B",
    }).catch(() => {
      dialog.alert({
        title: "Unable to open browser",
        message: "Please check your device settings.",
      });
    });
  }, [exercise.name]);

  return (
    <View
      style={{
        backgroundColor: colors.bg.elevated,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: spacing.md,
      }}
    >
      {/* Tab bar */}
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab("video")}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "video" }}
          activeOpacity={0.7}
          style={{
            flex: 1,
            paddingVertical: spacing.sm,
            alignItems: "center",
            backgroundColor: activeTab === "video" ? `${colors.accent.DEFAULT}10` : "transparent",
            borderBottomWidth: 2,
            borderBottomColor: activeTab === "video" ? colors.accent.DEFAULT : "transparent",
          }}
        >
          <Text
            style={{
              ...typography.label,
              fontSize: 9,
              letterSpacing: 1.5,
              color: activeTab === "video" ? colors.accent.DEFAULT : colors.text.secondary,
            }}
          >
            ▶ VIDEO
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("guide")}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "guide" }}
          activeOpacity={0.7}
          style={{
            flex: 1,
            paddingVertical: spacing.sm,
            alignItems: "center",
            backgroundColor: activeTab === "guide" ? `${colors.accent.DEFAULT}10` : "transparent",
            borderBottomWidth: 2,
            borderBottomColor: activeTab === "guide" ? colors.accent.DEFAULT : "transparent",
          }}
        >
          <Text
            style={{
              ...typography.label,
              fontSize: 9,
              letterSpacing: 1.5,
              color: activeTab === "guide" ? colors.accent.DEFAULT : colors.text.secondary,
            }}
          >
            ≡ GUIDE
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      {activeTab === "video" ? (
        <View
          style={{
            aspectRatio: 16 / 9,
            backgroundColor: "#000",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {curatedVideoId ? (
            <TouchableOpacity
              onPress={() => openInBrowser(curatedVideoId)}
              activeOpacity={0.7}
              style={{
                alignItems: "center",
                padding: spacing.lg,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: `${colors.accent.DEFAULT}15`,
                  borderWidth: 1.5,
                  borderColor: colors.accent.DEFAULT,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: spacing.md,
                }}
              >
                <Text style={{ fontSize: 28, color: colors.accent.DEFAULT }}>▶</Text>
              </View>
              <Text
                style={{
                  ...typography.label,
                  color: colors.accent.DEFAULT,
                  fontSize: 11,
                  letterSpacing: 1,
                  marginBottom: spacing.xs,
                }}
              >
                WATCH FORM VIDEO
              </Text>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.text.secondary,
                  fontSize: 9,
                  textAlign: "center",
                  maxWidth: 240,
                }}
              >
                Opens YouTube in your browser — {exercise.name} form guide
              </Text>
            </TouchableOpacity>
          ) : searchState === "searching" ? (
            <View
              style={{
                alignItems: "center",
                padding: spacing.lg,
              }}
            >
              <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
              <Text
                style={{
                  ...typography.label,
                  color: colors.text.secondary,
                  fontSize: 8,
                  marginTop: spacing.sm,
                }}
              >
                FINDING VIDEO...
              </Text>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.text.secondary,
                  fontSize: 9,
                  marginTop: spacing.xs,
                  textAlign: "center",
                }}
              >
                Searching for &quot;{exercise.name} exercise form&quot;
              </Text>
            </View>
          ) : searchState === "found" && searchVideoId ? (
            <TouchableOpacity
              onPress={() => openInBrowser(searchVideoId)}
              activeOpacity={0.7}
              style={{
                alignItems: "center",
                padding: spacing.lg,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: `${colors.accent.DEFAULT}15`,
                  borderWidth: 1.5,
                  borderColor: colors.accent.DEFAULT,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: spacing.md,
                }}
              >
                <Text style={{ fontSize: 28, color: colors.accent.DEFAULT }}>▶</Text>
              </View>
              <Text
                style={{
                  ...typography.label,
                  color: colors.accent.DEFAULT,
                  fontSize: 11,
                  letterSpacing: 1,
                  marginBottom: spacing.xs,
                }}
              >
                WATCH FORM VIDEO
              </Text>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.text.secondary,
                  fontSize: 9,
                  textAlign: "center",
                  maxWidth: 240,
                }}
              >
                Opens YouTube in your browser
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSearchYouTube}
              activeOpacity={0.7}
              style={{
                alignItems: "center",
                padding: spacing.lg,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: `${colors.accent.DEFAULT}15`,
                  borderWidth: 1.5,
                  borderColor: colors.accent.DEFAULT,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: spacing.md,
                }}
              >
                <Text style={{ fontSize: 22, color: colors.accent.DEFAULT }}>▶</Text>
              </View>
              <Text
                style={{
                  ...typography.label,
                  color: colors.accent.DEFAULT,
                  fontSize: 10,
                  letterSpacing: 1,
                }}
              >
                SEARCH ON YOUTUBE
              </Text>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.text.secondary,
                  fontSize: 10,
                  marginTop: spacing.xs,
                  textAlign: "center",
                }}
              >
                {exercise.name}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* GUIDE tab — detailed exercise instructions */
        <ScrollView
          style={{ maxHeight: 340 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <View style={{ padding: spacing.sm, gap: spacing.sm }}>
            {/* Description / How to perform */}
            {exercise.description ? (
              <View
                style={{
                  backgroundColor: colors.bg.primary,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                  padding: spacing.sm,
                }}
              >
                <Text
                  style={{
                    ...typography.label,
                    color: colors.accent.DEFAULT,
                    fontSize: 7,
                    marginBottom: spacing.xs,
                    letterSpacing: 0.5,
                  }}
                >
                  HOW TO PERFORM
                </Text>
                <Text
                  style={{
                    ...typography.bodySmall,
                    color: colors.text.primary,
                    fontSize: 10,
                    lineHeight: 16,
                  }}
                >
                  {exercise.description}
                </Text>
              </View>
            ) : null}

            {/* Target Muscles */}
            <View
              style={{
                backgroundColor: colors.bg.primary,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                borderRadius: 4,
                padding: spacing.sm,
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: colors.success,
                  fontSize: 7,
                  marginBottom: spacing.sm,
                  letterSpacing: 0.5,
                }}
              >
                TARGET MUSCLES
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                {exercise.targetMuscles.map((muscle) => (
                  <View
                    key={muscle}
                    style={{
                      backgroundColor: `${colors.success}12`,
                      borderWidth: 1,
                      borderColor: colors.success,
                      borderRadius: 3,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 1,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.label,
                        color: colors.success,
                        fontSize: 7,
                        textTransform: "capitalize",
                      }}
                    >
                      {muscle.replace(/_/g, " ")}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Step-by-step checkpoints */}
            {checkpoints.length > 0 && (
              <View
                style={{
                  backgroundColor: colors.bg.primary,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                  padding: spacing.sm,
                }}
              >
                <Text
                  style={{
                    ...typography.label,
                    color: colors.accent.DEFAULT,
                    fontSize: 7,
                    marginBottom: spacing.sm,
                    letterSpacing: 0.5,
                  }}
                >
                  STEP BY STEP
                </Text>
                {checkpoints.map((cp, idx) => {
                  const phaseColors: Record<string, string> = {
                    SETUP: "#3B82F6",
                    EXECUTION: "#10B981",
                    SAFETY: "#EF4444",
                  };
                  const phaseColor = phaseColors[cp.phase] || colors.accent.DEFAULT;
                  const stepLabels: Record<string, string> = {
                    SETUP: "SETUP",
                    EXECUTION: "EXECUTE",
                    SAFETY: "SAFETY",
                  };
                  return (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        marginBottom: spacing.xs,
                        backgroundColor: `${phaseColor}08`,
                        borderRadius: 3,
                        padding: spacing.sm,
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: phaseColor,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: spacing.sm,
                          marginTop: 1,
                        }}
                      >
                        <Text
                          style={{
                            ...typography.label,
                            color: "#fff",
                            fontSize: 8,
                          }}
                        >
                          {idx + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View
                          style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}
                        >
                          <Text
                            style={{
                              ...typography.label,
                              fontSize: 7,
                              color: phaseColor,
                              letterSpacing: 0.5,
                            }}
                          >
                            {stepLabels[cp.phase] || cp.phase}
                          </Text>
                          <Text style={{ fontSize: 6, color: colors.text.secondary }}>·</Text>
                          <Text
                            style={{
                              ...typography.label,
                              fontSize: 7,
                              color: colors.text.secondary,
                            }}
                          >
                            {cp.focusPoint}
                          </Text>
                        </View>
                        <Text
                          style={{
                            ...typography.bodySmall,
                            color: colors.text.primary,
                            fontSize: 10,
                            lineHeight: 15,
                            marginTop: 1,
                          }}
                        >
                          {cp.instruction}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Breathing guidance */}
            <View
              style={{
                backgroundColor: colors.bg.primary,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                borderRadius: 4,
                padding: spacing.sm,
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: "#8B5CF6",
                  fontSize: 7,
                  marginBottom: spacing.xs,
                  letterSpacing: 0.5,
                }}
              >
                BREATHING
              </Text>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.text.secondary,
                  fontSize: 10,
                  lineHeight: 15,
                }}
              >
                {exercise.tempo === "isometric"
                  ? "Breathe steadily throughout the hold. Avoid holding your breath. Inhale before, exhale during exertion."
                  : "Exhale during the concentric (pressing/lifting) phase. Inhale during the eccentric (lowering) phase. Never hold your breath."}
              </Text>
            </View>

            {/* Common Mistakes — derived from SAFETY checkpoints */}
            {checkpoints.filter((cp) => cp.phase === "SAFETY").length > 0 && (
              <View
                style={{
                  backgroundColor: colors.bg.primary,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                  padding: spacing.sm,
                }}
              >
                <Text
                  style={{
                    ...typography.label,
                    color: colors.error,
                    fontSize: 7,
                    marginBottom: spacing.xs,
                    letterSpacing: 0.5,
                  }}
                >
                  COMMON MISTAKES
                </Text>
                {checkpoints
                  .filter((cp) => cp.phase === "SAFETY")
                  .map((cp, idx) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: "row",
                        gap: spacing.xs,
                        marginBottom: idx < checkpoints.length - 1 ? spacing.xs : 0,
                      }}
                    >
                      <Text style={{ color: colors.error, fontSize: 8 }}>✗</Text>
                      <Text
                        style={{
                          ...typography.bodySmall,
                          color: colors.text.primary,
                          fontSize: 10,
                          lineHeight: 14,
                          flex: 1,
                        }}
                      >
                        {cp.instruction}
                      </Text>
                    </View>
                  ))}
              </View>
            )}

            {/* Biomechanics */}
            {exercise.biomechanicalNotes && (
              <View
                style={{
                  backgroundColor: colors.bg.primary,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 4,
                  padding: spacing.sm,
                }}
              >
                <Text
                  style={{
                    ...typography.label,
                    color: colors.text.secondary,
                    fontSize: 7,
                    marginBottom: spacing.xs,
                    letterSpacing: 0.5,
                  }}
                >
                  BIOMECHANICS NOTE
                </Text>
                <Text
                  style={{
                    ...typography.bodySmall,
                    color: colors.text.secondary,
                    fontSize: 10,
                    lineHeight: 15,
                  }}
                >
                  {exercise.biomechanicalNotes}
                </Text>
              </View>
            )}

            {/* Skill path */}
            <View
              style={{
                backgroundColor: colors.bg.primary,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                borderRadius: 4,
                padding: spacing.sm,
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: colors.success,
                  fontSize: 7,
                  marginBottom: spacing.xs,
                  letterSpacing: 0.5,
                }}
              >
                SKILL PATH
              </Text>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.text.primary,
                  fontSize: 10,
                  lineHeight: 14,
                }}
              >
                {exercise.progressionPathway}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      <dialog.Dialog />
    </View>
  );
}
