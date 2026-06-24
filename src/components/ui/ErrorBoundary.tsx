import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors, spacing, H3, Label, Body } from "../../tokens";
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
 * Wraps children with error detection and a tactical FitQuest-styled fallback.
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

/** Internal — tactical FitQuest-styled crash fallback */
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
          padding: spacing.xl,
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
            marginBottom: spacing.lg + spacing.xs,
          }}
        >
          <Text style={{ fontSize: 32, color: colors.error }}>!</Text>
        </View>

        {/* Title */}
        <H3 variant="primary" style={{ textAlign: "center", marginBottom: spacing.sm }}>
          SYSTEM ERROR
        </H3>

        {/* Subtitle */}
        <Body
          variant="secondary"
          style={{
            fontSize: 13,
            lineHeight: 20,
            textAlign: "center",
            marginBottom: spacing.lg + spacing.xs,
            maxWidth: 300,
          }}
        >
          FitQuest encountered an unexpected error. The system is stable and your data is preserved.
        </Body>

        {/* Error detail — only show message in production, no stack traces */}
        <ScrollView
          style={{
            maxHeight: 100,
            width: "100%",
            backgroundColor: colors.bg.card,
            borderWidth: 1,
            borderColor: colors.border.subtle,
            borderRadius: 4,
            padding: spacing.md,
            marginBottom: spacing.xl,
          }}
        >
          <Body variant="error" size="sm" style={{ fontSize: 10, fontFamily: "monospace" }}>
            {__DEV__
              ? `${error.name}: ${error.message}`
              : "An unexpected error occurred. Please try again."}
          </Body>
          {__DEV__ && error.stack && (
            <Body
              variant="secondary"
              size="sm"
              style={{ fontSize: 8, fontFamily: "monospace", marginTop: spacing.xs }}
              numberOfLines={6}
            >
              {error.stack.split("\n").slice(0, 6).join("\n")}
            </Body>
          )}
        </ScrollView>

        {/* Actions */}
        <TouchableOpacity
          onPress={retry}
          activeOpacity={0.8}
          style={{
            backgroundColor: colors.accent.DEFAULT,
            borderRadius: 4,
            paddingVertical: spacing.md,
            paddingHorizontal: 40,
            alignItems: "center",
            width: "100%",
            maxWidth: 280,
            marginBottom: spacing.sm,
          }}
        >
          <Label style={{ color: colors.bg.primary, fontSize: 12, letterSpacing: 2 }}>RETRY</Label>
        </TouchableOpacity>

        {/* Navigate home — breaks infinite retry loops */}
        <TouchableOpacity
          onPress={() => router.replace("/")}
          activeOpacity={0.7}
          style={{
            borderWidth: 1,
            borderColor: colors.border.subtle,
            borderRadius: 4,
            paddingVertical: spacing.md,
            paddingHorizontal: 40,
            alignItems: "center",
            width: "100%",
            maxWidth: 280,
          }}
        >
          <Label variant="secondary" style={{ fontSize: 11, letterSpacing: 1 }}>
            GO HOME
          </Label>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
