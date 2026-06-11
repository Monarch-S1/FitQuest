import { useCallback, useMemo, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { MotiView } from "moti";
import * as WebBrowser from "expo-web-browser";
import { useColors, typography, spacing } from "../../tokens";
import { Exercise } from "../../data/exercises";
import { exerciseVideoIds, exerciseMp4Urls, hasMp4Source } from "../../data/exerciseVideos";
import { videoCache } from "../../services/videoCache";

interface ExerciseDemoProps {
  exercise: Exercise;
}

export function ExerciseDemo({ exercise }: ExerciseDemoProps) {
  const colors = useColors();

  const [expanded, setExpanded] = useState(false);

  // Fallback checkpoints in case exercise guide is missing
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

  const videoId = exerciseVideoIds[exercise.id];
  const mp4Url = exerciseMp4Urls[exercise.id];
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const isMountedRef = useRef(true);

  // Check cache status on mount with unmount guard
  useEffect(() => {
    isMountedRef.current = true;
    if (mp4Url) {
      videoCache.isCached(exercise.id).then((cached) => {
        if (!isMountedRef.current) return;
        if (cached) {
          videoCache.getCachedUri(exercise.id).then((uri) => {
            if (isMountedRef.current) setCachedUri(uri);
          });
        }
      });
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [exercise.id, mp4Url]);

  const handleDownload = useCallback(async () => {
    if (!mp4Url) return;
    setIsDownloading(true);
    setDownloadProgress(0);

    const uri = await videoCache.download(exercise.id, mp4Url, (p) => {
      setDownloadProgress(p);
    });

    if (uri) {
      setCachedUri(uri);
    }
    setIsDownloading(false);
  }, [exercise.id, mp4Url]);

  const handleRemoveCache = useCallback(async () => {
    await videoCache.remove(exercise.id);
    setCachedUri(null);
  }, [exercise.id]);

  const handleWatchVideo = useCallback(async () => {
    const url = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : `https://m.youtube.com/results?search_query=${encodeURIComponent(
          `${exercise.name} calisthenics exercise form`
        )}`;
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert("Unable to open browser", "Please check your device settings.");
    }
  }, [exercise.name, videoId]);

  return (
    <View
      style={{
        backgroundColor: colors.bg.surface,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        borderRadius: 4,
        marginBottom: spacing[4],
        overflow: "hidden",
      }}
    >
      {/* Header - always visible */}
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: spacing[3],
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] }}>
          <View
            style={{
              width: 24,
              height: 24,
              backgroundColor: `${colors.accent.DEFAULT}15`,
              borderWidth: 1,
              borderColor: colors.accent.DEFAULT,
              borderRadius: 4,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 12, color: colors.accent.DEFAULT }}>?</Text>
          </View>
          <View>
            <Text
              style={{
                ...typography.label,
                color: colors.accent.DEFAULT,
                fontSize: 9,
              }}
            >
              FORM GUIDE
            </Text>
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.secondary,
                fontSize: 10,
                marginTop: 1,
              }}
            >
              {expanded ? "Tap to collapse" : "View setup, execution & safety tips"}
            </Text>
          </View>
        </View>
        <Text
          style={{
            ...typography.label,
            color: colors.text.secondary,
            fontSize: 10,
          }}
        >
          {expanded ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>

      {/* Expanded content */}
      {expanded && (
        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 200 }}
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border.subtle,
            padding: spacing[3],
          }}
        >
          {/* Form checkpoints */}
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 8,
              marginBottom: spacing[2],
            }}
          >
            FORM CHECKPOINTS
          </Text>

          {checkpoints.map((cp, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: spacing[2],
                backgroundColor: colors.bg.primary,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                borderRadius: 4,
                padding: spacing[2],
                marginBottom: spacing[1],
              }}
            >
              <View
                style={{
                  backgroundColor:
                    cp.phase === "SETUP"
                      ? colors.accent.DEFAULT
                      : cp.phase === "EXECUTION"
                        ? colors.success
                        : colors.error,
                  borderRadius: 4,
                  paddingHorizontal: spacing[1],
                  paddingVertical: 1,
                  marginTop: 1,
                  minWidth: 20,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    ...typography.label,
                    color: colors.bg.primary,
                    fontSize: 7,
                  }}
                >
                  {cp.phase.charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    ...typography.bodySmall,
                    color: colors.text.primary,
                    fontSize: 10,
                    lineHeight: 15,
                  }}
                >
                  {cp.instruction}
                </Text>
                <Text
                  style={{
                    ...typography.label,
                    color: colors.accent.DEFAULT,
                    fontSize: 7,
                    marginTop: 2,
                  }}
                >
                  FOCUS: {cp.focusPoint}
                </Text>
              </View>
            </View>
          ))}

          {/* Biomechanical notes */}
          {exercise.biomechanicalNotes && (
            <View
              style={{
                marginTop: spacing[2],
                backgroundColor: colors.bg.primary,
                borderWidth: 1,
                borderColor: colors.border.subtle,
                borderRadius: 4,
                padding: spacing[2],
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: colors.text.secondary,
                  fontSize: 8,
                  marginBottom: spacing[1],
                }}
              >
                MECHANICS
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

          {/* Progression pathway */}
          <View
            style={{
              marginTop: spacing[1],
              backgroundColor: colors.bg.primary,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: 4,
              padding: spacing[2],
            }}
          >
            <Text
              style={{
                ...typography.label,
                color: colors.success,
                fontSize: 8,
                marginBottom: spacing[1],
              }}
            >
              PROGRESSION PATH
            </Text>
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.primary,
                fontSize: 10,
                lineHeight: 15,
              }}
            >
              {exercise.progressionPathway}
            </Text>
          </View>

          {/* Video demo buttons */}
          <View
            style={{
              marginTop: spacing[2],
              borderTopWidth: 1,
              borderTopColor: colors.border.subtle,
              paddingTop: spacing[2],
              gap: spacing[1],
            }}
          >
            {/* Watch online button */}
            <TouchableOpacity
              onPress={handleWatchVideo}
              activeOpacity={0.7}
              style={{
                paddingVertical: spacing[2],
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  ...typography.label,
                  color: colors.accent.DEFAULT,
                  fontSize: 9,
                }}
              >
                {videoId ? "▶ WATCH VIDEO DEMO" : "WATCH VIDEO DEMO ↗"}
              </Text>
            </TouchableOpacity>

            {/* Download for offline button (only if MP4 source exists) */}
            {hasMp4Source(exercise.id) && (
              <View>
                {isDownloading ? (
                  <View
                    style={{
                      alignItems: "center",
                      paddingVertical: spacing[1],
                    }}
                  >
                    <ActivityIndicator size="small" color={colors.accent.DEFAULT} />
                    <Text
                      style={{
                        ...typography.label,
                        color: colors.text.secondary,
                        fontSize: 7,
                        marginTop: 4,
                      }}
                    >
                      DOWNLOADING {Math.round(downloadProgress * 100)}%
                    </Text>
                  </View>
                ) : cachedUri ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: spacing[2],
                    }}
                  >
                    <Text
                      style={{
                        ...typography.label,
                        color: colors.success,
                        fontSize: 8,
                      }}
                    >
                      ✓ SAVED OFFLINE
                    </Text>
                    <TouchableOpacity
                      onPress={handleRemoveCache}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          ...typography.label,
                          color: colors.error,
                          fontSize: 7,
                        }}
                      >
                        REMOVE
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleDownload}
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: spacing[1],
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        ...typography.label,
                        color: colors.text.secondary,
                        fontSize: 8,
                      }}
                    >
                      ↓ DOWNLOAD FOR OFFLINE
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            </View>
        </MotiView>
      )}
    </View>
  );
}
