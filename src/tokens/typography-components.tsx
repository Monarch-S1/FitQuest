/**
 * FitQuest Design Tokens — Typography Components
 *
 * Typed Text wrappers that replace inline `{...typography.label, fontSize: 9, color: ...}`
 * throughout the app. Each variant accepts a `variant` prop for color/mood.
 *
 * Usage:
 *   <Display>FitQuest</Display>
 *   <H2>What's your goal?</H2>
 *   <Body>Description text here</Body>
 *   <Label variant="accent">XP</Label>
 *   <Stat>1,240</Stat>
 *   <Mono>12:34</Mono>
 */

import { Text, TextProps, TextStyle } from "react-native";
import { useColors } from "./useColors";
import { fonts, fontSizes, lineHeights } from "./typography";

type ColorVariant = "primary" | "secondary" | "tertiary" | "accent" | "success" | "error";

function useColor(variant: ColorVariant): string {
  const colors = useColors();
  switch (variant) {
    case "primary":
      return colors.text.primary;
    case "secondary":
      return colors.text.secondary;
    case "tertiary":
      return colors.text.tertiary;
    case "accent":
      return colors.accent.DEFAULT;
    case "success":
      return colors.success;
    case "error":
      return colors.error;
  }
}

// ─── Display (huge, heading font) ───────────────

interface DisplayProps extends TextProps {
  variant?: ColorVariant;
}

export function Display({ variant = "primary", style, ...rest }: DisplayProps) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.heading,
          fontSize: 32,
          letterSpacing: 1.5,
          color: useColor(variant),
        } as TextStyle,
        style,
      ]}
      {...rest}
    />
  );
}

// ─── Headings ────────────────────────────────────

interface HeadingProps extends TextProps {
  variant?: ColorVariant;
}

export function H1({ variant = "primary", style, ...rest }: HeadingProps) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.heading,
          fontSize: fontSizes["5xl"],
          lineHeight: fontSizes["5xl"] * lineHeights.tight,
          letterSpacing: 1.5,
          color: useColor(variant),
        } as TextStyle,
        style,
      ]}
      {...rest}
    />
  );
}

export function H2({ variant = "primary", style, ...rest }: HeadingProps) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.heading,
          fontSize: fontSizes["4xl"],
          lineHeight: fontSizes["4xl"] * lineHeights.tight,
          letterSpacing: 1.2,
          color: useColor(variant),
        } as TextStyle,
        style,
      ]}
      {...rest}
    />
  );
}

export function H3({ variant = "primary", style, ...rest }: HeadingProps) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.heading,
          fontSize: fontSizes["3xl"],
          lineHeight: fontSizes["3xl"] * lineHeights.tight,
          letterSpacing: 1,
          color: useColor(variant),
        } as TextStyle,
        style,
      ]}
      {...rest}
    />
  );
}

export function H4({ variant = "primary", style, ...rest }: HeadingProps) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.heading,
          fontSize: fontSizes["2xl"],
          lineHeight: fontSizes["2xl"] * lineHeights.tight,
          letterSpacing: 0.8,
          color: useColor(variant),
        } as TextStyle,
        style,
      ]}
      {...rest}
    />
  );
}

// ─── Body Text ────────────────────────────────────

interface BodyProps extends TextProps {
  variant?: ColorVariant;
  size?: "sm" | "md";
}

export function Body({ variant = "primary", size = "md", style, ...rest }: BodyProps) {
  const sizeVal = size === "md" ? fontSizes.base : fontSizes.sm;
  return (
    <Text
      style={[
        {
          fontFamily: fonts.body.regular,
          fontSize: sizeVal,
          lineHeight: sizeVal * lineHeights.relaxed,
          color: useColor(variant),
        } as TextStyle,
        style,
      ]}
      {...rest}
    />
  );
}

// ─── Label (uppercase, small, semiBold) ──────────

interface LabelProps extends TextProps {
  variant?: ColorVariant;
}

export function Label({ variant = "secondary", style, ...rest }: LabelProps) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.body.semiBold,
          fontSize: fontSizes.xs,
          lineHeight: fontSizes.xs * lineHeights.normal,
          letterSpacing: 1,
          textTransform: "uppercase" as const,
          color: useColor(variant),
        } as TextStyle,
        style,
      ]}
      {...rest}
    />
  );
}

// ─── Stat (large heading number) ─────────────────

interface StatProps extends TextProps {
  variant?: ColorVariant;
  size?: "sm" | "md" | "lg";
}

export function Stat({ variant = "primary", size = "md", style, ...rest }: StatProps) {
  const fontSize = size === "lg" ? 36 : size === "sm" ? 20 : 28;
  return (
    <Text
      style={[
        {
          fontFamily: fonts.heading,
          fontSize,
          lineHeight: fontSize * lineHeights.tight,
          letterSpacing: 0.8,
          color: useColor(variant),
        } as TextStyle,
        style,
      ]}
      {...rest}
    />
  );
}

// ─── Mono (monospaced for timers/numbers) ─────────

interface MonoProps extends TextProps {
  variant?: ColorVariant;
  size?: "sm" | "md" | "lg";
}

export function Mono({ variant = "primary", size = "md", style, ...rest }: MonoProps) {
  const fontSize = size === "lg" ? 48 : size === "sm" ? 14 : 24;
  return (
    <Text
      style={[
        {
          fontFamily: "monospace",
          fontSize,
          lineHeight: fontSize * 1.1,
          letterSpacing: 2,
          fontVariant: ["tabular-nums"] as any,
          color: useColor(variant),
        } as TextStyle,
        style,
      ]}
      {...rest}
    />
  );
}

// ─── Subtitle (body.semiBold, uppercase) ─────────

interface SubtitleProps extends TextProps {
  variant?: ColorVariant;
}

export function Subtitle({ variant = "secondary", style, ...rest }: SubtitleProps) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.body.semiBold,
          fontSize: fontSizes.base,
          lineHeight: fontSizes.base * lineHeights.normal,
          letterSpacing: 0.5,
          textTransform: "uppercase" as const,
          color: useColor(variant),
        } as TextStyle,
        style,
      ]}
      {...rest}
    />
  );
}

// ─── Tag (tiny badge text) ───────────────────────

interface TagProps extends TextProps {
  variant?: ColorVariant;
}

export function Tag({ variant = "secondary", style, ...rest }: TagProps) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.body.semiBold,
          fontSize: 7,
          letterSpacing: 0.5,
          textTransform: "uppercase" as const,
          color: useColor(variant),
        } as TextStyle,
        style,
      ]}
      {...rest}
    />
  );
}
