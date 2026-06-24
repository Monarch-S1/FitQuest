import { useState, useCallback, useRef } from "react";
import { View, Text, Modal, TouchableOpacity, Animated } from "react-native";
import { useColors, typography, spacing, radii, fonts } from "../../tokens";

// ── Types ──────────────────────────────────────

interface BaseDialogParams {
  title: string;
  message?: string;
  onCancel?: () => void;
}

interface AlertDialogParams extends BaseDialogParams {
  okLabel?: string;
}

interface ConfirmDialogParams extends BaseDialogParams {
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

interface DestructiveDialogParams extends BaseDialogParams {
  actionLabel?: string;
  cancelLabel?: string;
  onAction: () => void;
}

interface SelectOption {
  label: string;
  description?: string;
  onPress: () => void;
}

interface SelectDialogParams {
  title: string;
  options: SelectOption[];
  cancelLabel?: string;
  onCancel?: () => void;
}

type DialogConfig =
  | { variant: "alert"; params: AlertDialogParams }
  | { variant: "confirm"; params: ConfirmDialogParams }
  | { variant: "destructive"; params: DestructiveDialogParams }
  | { variant: "select"; params: SelectDialogParams };

type DialogState = { visible: false } | ({ visible: true } & DialogConfig);

// ── Hook ───────────────────────────────────────

export function useDialog() {
  const [state, setState] = useState<DialogState>({ visible: false });
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
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
  }, [scaleAnim, fadeAnim]);

  const hide = useCallback(() => {
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
      setState({ visible: false });
    });
  }, [scaleAnim, fadeAnim]);

  const alert = useCallback(
    (params: AlertDialogParams) => {
      setState({ visible: true, variant: "alert", params });
      requestAnimationFrame(() => animateIn());
    },
    [animateIn],
  );

  const confirm = useCallback(
    (params: ConfirmDialogParams) => {
      setState({ visible: true, variant: "confirm", params });
      requestAnimationFrame(() => animateIn());
    },
    [animateIn],
  );

  const destructive = useCallback(
    (params: DestructiveDialogParams) => {
      setState({ visible: true, variant: "destructive", params });
      requestAnimationFrame(() => animateIn());
    },
    [animateIn],
  );

  const select = useCallback(
    (params: SelectDialogParams) => {
      setState({ visible: true, variant: "select", params });
      requestAnimationFrame(() => animateIn());
    },
    [animateIn],
  );

  const DialogComponent = useCallback(() => {
    if (!state.visible) return null;

    return (
      <Modal transparent visible={state.visible} animationType="none" onRequestClose={hide}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            justifyContent: "center",
            alignItems: "center",
            padding: spacing.lg,
            opacity: fadeAnim,
          }}
        >
          <TouchableOpacity
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            onPress={hide}
          />
          <DialogPanel config={state} scaleAnim={scaleAnim} onClose={hide} />
        </Animated.View>
      </Modal>
    );
  }, [state, hide, fadeAnim, scaleAnim]);

  return { alert, confirm, destructive, select, Dialog: DialogComponent };
}

// ── Panel ──────────────────────────────────────

function DialogPanel({
  config,
  scaleAnim,
  onClose,
}: {
  config: DialogConfig & { visible: true };
  scaleAnim: Animated.Value;
  onClose: () => void;
}) {
  const isDestructive = config.variant === "destructive";
  const borderColor = isDestructive ? "rgba(239, 68, 68, 0.5)" : "rgba(212, 168, 67, 0.4)";
  const innerBorderColor = isDestructive ? "rgba(239, 68, 68, 0.2)" : "rgba(212, 168, 67, 0.15)";

  return (
    <Animated.View
      style={{
        width: "100%",
        maxWidth: 340,
        backgroundColor: "rgba(14, 16, 24, 0.98)",
        borderWidth: 1,
        borderColor,
        borderRadius: radii.lg,
        overflow: "hidden",
        transform: [{ scale: scaleAnim }],
        shadowColor: isDestructive ? "#EF4444" : "#D4A843",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
      }}
    >
      <View
        style={{
          margin: 2,
          borderWidth: 1,
          borderColor: innerBorderColor,
          borderRadius: radii.lg - 1,
          overflow: "hidden",
        }}
      >
        {config.variant === "select" ? (
          <SelectContent params={config.params} onClose={onClose} />
        ) : (
          <StandardContent variant={config.variant} params={config.params} onClose={onClose} />
        )}
      </View>
    </Animated.View>
  );
}

// ── Standard Content (alert / confirm / destructive) ────────────

function StandardContent({
  variant,
  params,
  onClose,
}: {
  variant: "alert" | "confirm" | "destructive";
  params: AlertDialogParams | ConfirmDialogParams | DestructiveDialogParams;
  onClose: () => void;
}) {
  const colors = useColors();

  const isDestructive = variant === "destructive";
  const isConfirm = variant === "confirm";
  const isAlert = variant === "alert";

  // Extract button labels based on variant
  let confirmButtonLabel: string;
  if (isDestructive) {
    confirmButtonLabel = (params as DestructiveDialogParams).actionLabel || "DELETE";
  } else if (isConfirm) {
    confirmButtonLabel = (params as ConfirmDialogParams).confirmLabel || "CONFIRM";
  } else {
    confirmButtonLabel = (params as AlertDialogParams).okLabel || "OK";
  }

  const cancelButtonLabel = isAlert
    ? ""
    : isDestructive
      ? (params as DestructiveDialogParams).cancelLabel
      : (params as ConfirmDialogParams).cancelLabel;

  const accentColor = isDestructive ? "#EF4444" : colors.accent.DEFAULT;

  return (
    <View>
      {/* Title */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.sm,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 32,
            height: 2,
            backgroundColor: accentColor,
            borderRadius: 1,
            marginBottom: spacing.sm,
            opacity: 0.6,
          }}
        />
        <Text
          style={{
            fontFamily: fonts.heading,
            fontSize: 20,
            color: colors.text.primary,
            letterSpacing: 1.5,
            textAlign: "center",
          }}
        >
          {params.title}
        </Text>
      </View>

      {/* Message */}
      {params.message && (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
          <Text
            style={{
              ...typography.bodySmall,
              color: colors.text.secondary,
              fontSize: 13,
              lineHeight: 20,
              textAlign: "center",
            }}
          >
            {params.message}
          </Text>
        </View>
      )}

      {/* Buttons */}
      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          borderTopColor: colors.border.subtle,
        }}
      >
        {!isAlert && (
          <ActionButton
            label={cancelButtonLabel || "Cancel"}
            variant="cancel"
            onPress={() => {
              params.onCancel?.();
              onClose();
            }}
            style={{ borderRightWidth: 1, borderRightColor: colors.border.subtle }}
          />
        )}
        <ActionButton
          label={confirmButtonLabel}
          variant={isDestructive ? "destructive" : "confirm"}
          onPress={() => {
            if (isDestructive) {
              (params as DestructiveDialogParams).onAction();
            } else if (isConfirm) {
              (params as ConfirmDialogParams).onConfirm();
            }
            onClose();
          }}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

// ── Select Content ─────────────────────────────

function SelectContent({ params, onClose }: { params: SelectDialogParams; onClose: () => void }) {
  const colors = useColors();

  return (
    <View>
      {/* Title */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.sm,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 32,
            height: 2,
            backgroundColor: colors.accent.DEFAULT,
            borderRadius: 1,
            marginBottom: spacing.sm,
            opacity: 0.6,
          }}
        />
        <Text
          style={{
            fontFamily: fonts.heading,
            fontSize: 20,
            color: colors.text.primary,
            letterSpacing: 1.5,
            textAlign: "center",
          }}
        >
          {params.title}
        </Text>
      </View>

      {/* Options */}
      <View style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.xs }}>
        {params.options.map((option, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => {
              onClose();
              setTimeout(() => option.onPress(), 200);
            }}
            activeOpacity={0.7}
            style={{
              backgroundColor: `${colors.accent.DEFAULT}08`,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              borderRadius: radii.md,
              padding: spacing.md,
              marginBottom: spacing.xs,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.body.semiBold,
                fontSize: 14,
                color: colors.text.primary,
                letterSpacing: 0.5,
              }}
            >
              {option.label}
            </Text>
            {option.description && (
              <Text
                style={{
                  ...typography.bodySmall,
                  color: colors.text.secondary,
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                {option.description}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Cancel */}
      <View style={{ borderTopWidth: 1, borderTopColor: colors.border.subtle }}>
        <ActionButton
          label={params.cancelLabel || "Cancel"}
          variant="cancel"
          onPress={() => {
            params.onCancel?.();
            onClose();
          }}
        />
      </View>
    </View>
  );
}

// ── Action Button ──────────────────────────────

function ActionButton({
  label,
  variant,
  onPress,
  style,
}: {
  label: string;
  variant: "confirm" | "cancel" | "destructive";
  onPress: () => void;
  style?: any;
}) {
  const colors = useColors();

  const textColor =
    variant === "destructive"
      ? "#EF4444"
      : variant === "confirm"
        ? colors.accent.DEFAULT
        : colors.text.secondary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        {
          flex: 1,
          paddingVertical: spacing.md,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: fonts.body.semiBold,
          fontSize: 11,
          color: textColor,
          letterSpacing: 1.5,
        }}
      >
        {label.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}
