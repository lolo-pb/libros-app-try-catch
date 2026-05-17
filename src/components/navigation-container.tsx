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
  onNavigationChange: React.Dispatch<React.SetStateAction<NavigationState>>;
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
  const preservedScreenState = navigationState.preservedScreenState;

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
          preservedScreenState,
        });
      }
    },
    [navigationState, onNavigationChange, preservedScreenState, sections],
  );

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (
          navigationState.currentSection === "home" &&
          navigationState.currentScreen === "discussion-detail"
        ) {
          const discussionId = navigationState.params?.discussionId;
          const globalBookId = navigationState.params?.globalBookId;

          if (discussionId) {
            onNavigationChange({
              currentSection: "home",
              currentScreen: "global-book",
              params: {
                globalBookId,
              },
              history: [],
              preservedScreenState,
            });
            return true;
          }
        }

        if (navigationState.currentSection === "home" && navigationState.currentScreen === "comment-thread") {
          const discussionId = navigationState.params?.discussionId;
          const globalBookId = navigationState.params?.globalBookId;
          const ancestorPath = navigationState.params?.ancestorPath;
          const ancestorIds = ancestorPath
            ? ancestorPath.split(",").filter(Boolean)
            : [];
          const parentCommentId = ancestorIds[ancestorIds.length - 1];

          if (parentCommentId && discussionId) {
            const nextAncestorIds = ancestorIds.slice(0, -1);
            onNavigationChange({
              currentSection: "home",
              currentScreen: "comment-thread",
              params: {
                discussionId,
                commentId: parentCommentId,
                parentCommentId: nextAncestorIds[nextAncestorIds.length - 1],
                ancestorPath: nextAncestorIds.length ? nextAncestorIds.join(",") : undefined,
                globalBookId,
              },
              history: navigationState.history ?? [],
              preservedScreenState,
            });
            return true;
          }

          if (discussionId) {
            onNavigationChange({
              currentSection: "home",
              currentScreen: "discussion-detail",
              params: {
                discussionId,
                globalBookId,
              },
              history: navigationState.history ?? [],
              preservedScreenState,
            });
            return true;
          }
        }

        const history = navigationState.history ?? [];
        const previousRoute = history[history.length - 1];

        if (previousRoute) {
          onNavigationChange({
            currentSection: previousRoute.sectionId,
            currentScreen: previousRoute.screenId,
            params: previousRoute.params,
            history: history.slice(0, -1),
            preservedScreenState,
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
            preservedScreenState,
          });
          return true;
        }

        if (navigationState.currentSection !== "home") {
          onNavigationChange({
            currentSection: "home",
            currentScreen: "home-main",
            history: [],
            preservedScreenState,
          });
          return true;
        }

        return false;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [navigationState, onNavigationChange, preservedScreenState, sections]);

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
