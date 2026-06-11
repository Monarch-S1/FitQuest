import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, typography, spacing } from "../../tokens";
import { captureError } from "../../services/sentry";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback UI */
  fallback?: (props: { error: Error; retry: () => void }) => React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — catches React render errors and displays a crash recovery UI.
 * Wraps children with error detection and a tactical ARCH-styled fallback.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 *
 * For route-level catching in Expo Router, export a named `ErrorBoundary`
 * from the route file instead of using this wrapper.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Send to Sentry in production, log locally in dev
    captureError(error, {
      componentStack: errorInfo.componentStack ?? undefined,
      source: "ErrorBoundary",
    });
    if (__DEV__) {
      console.error("[ErrorBoundary] Caught render error:", error);
      console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          retry: this.handleRetry,
        });
      }
      return <DefaultFallback error={this.state.error} retry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

/** Internal — tactical ARCH-styled crash fallback */
function DefaultFallback({ error, retry }: { error: Error; retry: () => void }) {
  const router = useRouter();
  const colors = useColors();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: spacing[6],
        }}
      >
        {/* Error icon */}
        <View
          style={{
            width: 72,
            height: 72,
            backgroundColor: `${colors.error}15`,
            borderWidth: 2,
            borderColor: colors.error,
            borderRadius: 4,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: spacing[5],
          }}
        >
          <Text style={{ fontSize: 32, color: colors.error }}>!</Text>
        </View>

        {/* Title */}
        <Text
          style={{
            ...typography.h2,
            color: colors.text.primary,
            fontSize: 28,
            textAlign: "center",
            marginBottom: spacing[2],
          }}
        >
          SYSTEM ERROR
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            ...typography.body,
            color: colors.text.secondary,
            fontSize: 13,
            lineHeight: 20,
            textAlign: "center",
            marginBottom: spacing[5],
            maxWidth: 300,
          }}
        >
          ARCH encountered an unexpected error. The system is stable and your data is preserved.
        </Text>

        {/* Error detail — only show message in production, no stack traces */}
        <ScrollView
          style={{
            maxHeight: 100,
            width: "100%",
            backgroundColor: colors.bg.elevated,
            borderWidth: 1,
            borderColor: colors.border.subtle,
            borderRadius: 4,
            padding: spacing[3],
            marginBottom: spacing[6],
          }}
        >
          <Text
            style={{
              ...typography.bodySmall,
              color: colors.error,
              fontSize: 10,
              fontFamily: "monospace",
            }}
          >
            {__DEV__
              ? `${error.name}: ${error.message}`
              : "An unexpected error occurred. Please try again."}
          </Text>
          {__DEV__ && error.stack && (
            <Text
              style={{
                ...typography.bodySmall,
                color: colors.text.secondary,
                fontSize: 8,
                fontFamily: "monospace",
                marginTop: spacing[1],
              }}
              numberOfLines={6}
            >
              {error.stack.split("\n").slice(0, 6).join("\n")}
            </Text>
          )}
        </ScrollView>

        {/* Actions */}
        <TouchableOpacity
          onPress={retry}
          activeOpacity={0.8}
          style={{
            backgroundColor: colors.accent.DEFAULT,
            borderRadius: 4,
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[10],
            alignItems: "center",
            width: "100%",
            maxWidth: 280,
            marginBottom: spacing[2],
          }}
        >
          <Text
            style={{
              ...typography.label,
              color: colors.bg.primary,
              fontSize: 12,
              letterSpacing: 2,
            }}
          >
            RETRY
          </Text>
        </TouchableOpacity>

        {/* Navigate home — breaks infinite retry loops */}
        <TouchableOpacity
          onPress={() => router.replace("/")}
          activeOpacity={0.7}
          style={{
            borderWidth: 1,
            borderColor: colors.border.subtle,
            borderRadius: 4,
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[10],
            alignItems: "center",
            width: "100%",
            maxWidth: 280,
          }}
        >
          <Text
            style={{
              ...typography.label,
              color: colors.text.secondary,
              fontSize: 11,
              letterSpacing: 1,
            }}
          >
            GO HOME
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
