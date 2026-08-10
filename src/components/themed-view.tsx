import { View, type ViewProps } from "react-native";

import { useThemeColor } from "@/src/hooks/use-theme-color";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const themedBackground = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background",
  );
  const backgroundColor = lightColor || darkColor ? themedBackground : "transparent";

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
