import { Colors } from "@/src/constants/theme";
import { NavigationProvider } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { NavigationSection, NavigationState } from "@/src/navigation/types";
import React, { useCallback, useEffect } from "react";
import { BackHandler, Platform, StyleSheet, View } from "react-native";
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

        if (
          navigationState.currentSection === sectionId &&
          navigationState.currentScreen === firstScreenId
        ) {
          return;
        }

        onNavigationChange({
          currentSection: sectionId,
          currentScreen: firstScreenId,
          history: [],
        });
      }
    },
    [navigationState, onNavigationChange, sections],
  );

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        const history = navigationState.history ?? [];
        const previousRoute = history[history.length - 1];

        if (previousRoute) {
          onNavigationChange({
            currentSection: previousRoute.sectionId,
            currentScreen: previousRoute.screenId,
            params: previousRoute.params,
            history: history.slice(0, -1),
          });
          return true;
        }

        const currentSection = sections.find(
          (section) => section.id === navigationState.currentSection,
        );
        const firstScreenId = currentSection?.screens[0]?.id;

        if (
          firstScreenId &&
          navigationState.currentScreen !== firstScreenId
        ) {
          onNavigationChange({
            currentSection: navigationState.currentSection,
            currentScreen: firstScreenId,
            history: [],
          });
          return true;
        }

        if (navigationState.currentSection !== "home") {
          onNavigationChange({
            currentSection: "home",
            currentScreen: "home-main",
            history: [],
          });
          return true;
        }

        return false;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [navigationState, onNavigationChange, sections]);

  return (
    <NavigationProvider
      navigationState={navigationState}
      onNavigationChange={onNavigationChange}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {children}
        </View>
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
