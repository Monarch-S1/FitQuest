import { View, ViewStyle } from "react-native";
import { ReactNode } from "react";
import { spacing } from "../../tokens";

interface FormGroupProps {
  children: ReactNode;
  gap?: number;
  containerStyle?: ViewStyle;
}

/**
 * Groups multiple form inputs with consistent spacing.
 * Manages form-level layout and maintains visual hierarchy.
 */
export function FormGroup({ children, gap = spacing.md, containerStyle }: FormGroupProps) {
  return (
    <View
      style={[
        {
          gap: gap,
        },
        containerStyle,
      ]}
    >
      {children}
    </View>
  );
}
