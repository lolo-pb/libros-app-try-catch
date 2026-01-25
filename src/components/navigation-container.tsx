import { Colors } from "@/src/constants/theme";
import { NavigationProvider } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { NavigationSection, NavigationState } from "@/src/navigation/types";
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { SectionNavBar } from "./section-nav-bar";

interface NavigationContainerProps {
  sections: NavigationSection[];
  navigationState: NavigationState;
  onNavigationChange: (state: NavigationState) => void;
  children: React.ReactNode;
}

export function NavigationContainer({
  sections,
  navigationState,
  onNavigationChange,
  children,
}: NavigationContainerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleSectionChange = useCallback(
    (sectionId: string) => {
      const section = sections.find((s) => s.id === sectionId);
      if (section) {
        const firstScreenId = section.screens[0]?.id || "";
        onNavigationChange({
          currentSection: sectionId,
          currentScreen: firstScreenId,
        });
      }
    },
    [sections, onNavigationChange],
  );

  return (
    <NavigationProvider
      navigationState={navigationState}
      onNavigationChange={onNavigationChange}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>{children}</View>
        <SectionNavBar
          sections={sections}
          currentSectionId={navigationState.currentSection}
          onSectionChange={handleSectionChange}
        />
      </View>
    </NavigationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
  },
  content: {
    flex: 1,
  },
});
