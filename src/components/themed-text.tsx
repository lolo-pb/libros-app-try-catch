import { StyleSheet, Text, type TextProps } from "react-native";

import { BookTradeRed } from "@/src/constants/theme";
import { useThemeColor } from "@/src/hooks/use-theme-color";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 23,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 21,
    fontWeight: "700",
    letterSpacing: -0.25,
    lineHeight: 26,
  },
  link: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
    color: BookTradeRed,
  },
});
