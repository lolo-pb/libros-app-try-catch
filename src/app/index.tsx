import { NavigationContainer } from "@/src/components/navigation-container";
import { Colors } from "@/src/constants/theme";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { navigationSections } from "@/src/navigation/navigation-config";
import { NavigationState } from "@/src/navigation/types";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentSection: "home",
    currentScreen: "home-main",
  });

  const handleNavigationChange = useCallback((state: NavigationState) => {
    setNavigationState(state);
  }, []);

  const currentSection = navigationSections.find(
    (s) => s.id === navigationState.currentSection,
  );
  const currentScreen = currentSection?.screens.find(
    (s) => s.id === navigationState.currentScreen,
  );
  const ScreenComponent = currentScreen?.component;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <NavigationContainer
        sections={navigationSections}
        navigationState={navigationState}
        onNavigationChange={handleNavigationChange}
      >
        {ScreenComponent && <ScreenComponent />}
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
