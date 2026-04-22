import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import RootLayout from "@/src/app";
import { useColorScheme } from "@/src/hooks/use-color-scheme";

export default function Layout() {
  const colorScheme = useColorScheme();
  const statusBarStyle = colorScheme === "dark" ? "light" : "dark";

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <RootLayout />
      <StatusBar style={statusBarStyle} />
    </ThemeProvider>
  );
}
