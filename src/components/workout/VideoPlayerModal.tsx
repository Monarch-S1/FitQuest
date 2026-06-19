import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, ActivityIndicator, Modal } from "react-native";
import { WebView } from "react-native-webview";
import { useColors, typography, spacing, radii, fonts } from "../../tokens";
import { exerciseVideoIds } from "../../data/exerciseVideos";

interface VideoPlayerModalProps {
  exerciseName: string;
  exerciseId: string;
  visible: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({
  exerciseName,
  exerciseId,
  visible,
  onClose,
}: VideoPlayerModalProps) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Animate in when visible becomes true
  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.9);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, fadeAnim]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setLoaded(false);
      setError(false);
      onClose();
    });
  }, [scaleAnim, fadeAnim, onClose]);

  if (!visible) return null;

  const videoId = exerciseVideoIds[exerciseId];
  const hasVideo = !!videoId;

  const embedUrl = hasVideo
    ? `https://www.youtube.com/embed/${videoId}?playsinline=1&autoplay=1&rel=0&modestbranding=1`
    : null;

  const searchUrl = hasVideo
    ? null
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${exerciseName} calisthenics exercise form`
      )}`;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.92)",
          justifyContent: "center",
          alignItems: "center",
          padding: spacing[4],
          opacity: fadeAnim,
        }}
      >
        {/* Backdrop tap to close */}
        <TouchableOpacity
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          activeOpacity={1}
          onPress={handleClose}
        />

        {/* Player panel */}
        <Animated.View
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: "rgba(14, 16, 24, 0.98)",
            borderWidth: 1,
            borderColor: "rgba(212, 168, 67, 0.4)",
            borderRadius: radii.lg,
            overflow: "hidden",
            transform: [{ scale: scaleAnim }],
            shadowColor: "#D4A843",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          {/* Inner decorative border */}
          <View
            style={{
              margin: 2,
              borderWidth: 1,
              borderColor: "rgba(212, 168, 67, 0.15)",
              borderRadius: radii.lg - 1,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[2],
                borderBottomWidth: 1,
                borderBottomColor: colors.border.subtle,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    ...typography.label,
                    color: colors.accent.DEFAULT,
                    fontSize: 8,
                    marginBottom: 1,
                  }}
                >
                  VIDEO DEMO
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: 14,
                    color: colors.text.primary,
                    letterSpacing: 0.5,
                  }}
                  numberOfLines={1}
                >
                  {exerciseName.toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                activeOpacity={0.7}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: `${colors.accent.DEFAULT}15`,
                  borderWidth: 1,
                  borderColor: colors.accent.DEFAULT,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 12, color: colors.accent.DEFAULT }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Video area */}
            <View
              style={{
                width: "100%",
                aspectRatio: 16 / 9,
                backgroundColor: "#000",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {embedUrl ? (
                <>
                  {!loaded && !error && (
                    <View style={{ position: "absolute", zIndex: 1 }}>
                      <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
                      <Text
                        style={{
                          ...typography.label,
                          color: colors.text.secondary,
                          fontSize: 8,
                          marginTop: spacing[2],
                          textAlign: "center",
                        }}
                      >
                        LOADING VIDEO...
                      </Text>
                    </View>
                  )}
                  {error && (
                    <View style={{ position: "absolute", zIndex: 1, alignItems: "center" }}>
                      <Text
                        style={{ fontFamily: fonts.heading, fontSize: 18, color: colors.error }}
                      >
                        ✕
                      </Text>
                      <Text
                        style={{
                          ...typography.bodySmall,
                          color: colors.text.secondary,
                          fontSize: 11,
                          marginTop: spacing[1],
                          textAlign: "center",
                        }}
                      >
                        Video failed to load
                      </Text>
                    </View>
                  )}
                  <WebView
                    source={{ uri: embedUrl }}
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#000000",
                      opacity: loaded ? 1 : 0,
                    }}
                    javaScriptEnabled
                    domStorageEnabled
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    onLoadEnd={() => setLoaded(true)}
                    onError={() => setError(true)}
                    scrollEnabled={false}
                    bounces={false}
                  />
                </>
              ) : (
                <WebView
                  source={{ uri: searchUrl! }}
                  style={{ width: "100%", height: "100%", backgroundColor: "#000000" }}
                  javaScriptEnabled
                  domStorageEnabled
                  scrollEnabled={false}
                  bounces={false}
                />
              )}
            </View>

            {/* Footer */}
            <View
              style={{
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[2],
                borderTopWidth: 1,
                borderTopColor: colors.border.subtle,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 9 }}
              >
                {hasVideo ? `${exerciseName} — form guide` : `Searching: ${exerciseName}`}
              </Text>
              <Text style={{ ...typography.label, color: colors.text.secondary, fontSize: 7 }}>
                TAP X TO CLOSE
              </Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
