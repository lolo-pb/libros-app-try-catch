import { Platform, type ViewStyle } from "react-native";

export const BookTradeRed = "#E91E63";

export const Colors = {
  light: {
    text: "#1C1C1E",
    background: "#F5F5F7",
    surface: "#FFFFFF",
    surfaceMuted: "#ECECF0",
    chrome: "rgba(255,255,255,0.92)",
    tint: BookTradeRed,
    accent: BookTradeRed,
    icon: "#AEAEB2",
    separator: "rgba(60,60,67,0.16)",
    tabIconDefault: "#6C6C70",
    tabIconSelected: BookTradeRed,
    danger: "#FF3B30",
    warning: "#FF9F0A",
    success: "#34C759",
  },
  dark: {
    text: "#F5F5F7",
    background: "#000000",
    surface: "#1C1C1E",
    surfaceMuted: "#2C2C2E",
    chrome: "rgba(28,28,30,0.94)",
    tint: BookTradeRed,
    accent: BookTradeRed,
    icon: "#48484A",
    separator: "rgba(84,84,88,0.65)",
    tabIconDefault: "#98989D",
    tabIconSelected: BookTradeRed,
    danger: "#FF453A",
    warning: "#FFD60A",
    success: "#30D158",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const AppRadii = {
  control: 14,
  card: 20,
  large: 26,
  pill: 999,
} as const;

export const AppShadow: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  android: {
    elevation: 8,
  },
  web: {
    boxShadow: "0 12px 36px rgba(0,0,0,0.12)",
  },
}) ?? {};
