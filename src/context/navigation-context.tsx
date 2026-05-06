import { NavigationState } from "@/src/navigation/types";
import React, { createContext, useCallback, useContext } from "react";

interface NavigationContextType {
  navigationState: NavigationState;
  navigateToScreen: (
    sectionId: string,
    screenId: string,
    params?: NavigationState["params"],
  ) => void;
  navigateToSection: (sectionId: string) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
);

export function NavigationProvider({
  children,
  navigationState,
  onNavigationChange,
}: {
  children: React.ReactNode;
  navigationState: NavigationState;
  onNavigationChange: (state: NavigationState) => void;
}) {
  const navigateToScreen = useCallback(
    (
      sectionId: string,
      screenId: string,
      params?: NavigationState["params"],
    ) => {
      const isSameScreen =
        navigationState.currentSection === sectionId &&
        navigationState.currentScreen === screenId;

      onNavigationChange({
        currentSection: sectionId,
        currentScreen: screenId,
        params,
        history: isSameScreen
          ? navigationState.history ?? []
          : [
              ...(navigationState.history ?? []),
              {
                sectionId: navigationState.currentSection,
                screenId: navigationState.currentScreen,
                params: navigationState.params,
              },
            ],
      });
    },
    [navigationState, onNavigationChange],
  );

  const navigateToSection = useCallback(
    (sectionId: string) => {
      if (navigationState.currentSection === sectionId) {
        return;
      }

      onNavigationChange({
        currentSection: sectionId,
        currentScreen: navigationState.currentScreen,
        params: navigationState.params,
        history: [
          ...(navigationState.history ?? []),
          {
            sectionId: navigationState.currentSection,
            screenId: navigationState.currentScreen,
            params: navigationState.params,
          },
        ],
      });
    },
    [navigationState, onNavigationChange],
  );

  const goBack = useCallback(() => {
    const history = navigationState.history ?? [];
    const previousRoute = history[history.length - 1];

    if (!previousRoute) {
      return;
    }

    onNavigationChange({
      currentSection: previousRoute.sectionId,
      currentScreen: previousRoute.screenId,
      params: previousRoute.params,
      history: history.slice(0, -1),
    });
  }, [navigationState.history, onNavigationChange]);

  return (
    <NavigationContext.Provider
      value={{
        navigationState,
        navigateToScreen,
        navigateToSection,
        goBack,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useAppNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useAppNavigation must be used within NavigationProvider");
  }
  return context;
}
