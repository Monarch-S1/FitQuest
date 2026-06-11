import { TextStyle } from "react-native";

export const fonts = {
  heading: "BebasNeue-Regular",
  body: {
    regular: "Inter-Regular",
    semiBold: "Inter-SemiBold",
    bold: "Inter-Bold",
  },
} as const;

export const fontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 36,
  "5xl": 48,
  "6xl": 64,
} as const;

export const lineHeights = {
  tight: 1,
  normal: 1.3,
  relaxed: 1.5,
} as const;

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily: fonts.heading,
    fontSize: 32,
    letterSpacing: 1.5,
  },
  h1: {
    fontFamily: fonts.heading,
    fontSize: fontSizes["5xl"],
    lineHeight: fontSizes["5xl"] * lineHeights.tight,
    letterSpacing: 1.5,
  },
  h2: {
    fontFamily: fonts.heading,
    fontSize: fontSizes["4xl"],
    lineHeight: fontSizes["4xl"] * lineHeights.tight,
    letterSpacing: 1.2,
  },
  h3: {
    fontFamily: fonts.heading,
    fontSize: fontSizes["3xl"],
    lineHeight: fontSizes["3xl"] * lineHeights.tight,
    letterSpacing: 1,
  },
  h4: {
    fontFamily: fonts.heading,
    fontSize: fontSizes["2xl"],
    lineHeight: fontSizes["2xl"] * lineHeights.tight,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  body: {
    fontFamily: fonts.body.regular,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.relaxed,
  },
  bodySmall: {
    fontFamily: fonts.body.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.relaxed,
  },
  stat: {
    fontFamily: fonts.heading,
    fontSize: fontSizes["2xl"],
    lineHeight: fontSizes["2xl"] * lineHeights.tight,
    letterSpacing: 0.8,
  },
  label: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
};
