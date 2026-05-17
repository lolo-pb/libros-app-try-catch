import {
  HomeScreenSnapshot,
  NavigationState,
  PreservedScreenState,
} from "@/src/navigation/types";
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
  setPreservedScreenState: <K extends keyof PreservedScreenState>(
    screenId: K,
    state: PreservedScreenState[K],
  ) => void;
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
  onNavigationChange: React.Dispatch<React.SetStateAction<NavigationState>>;
}) {
  const preservedScreenState = navigationState.preservedScreenState ?? {};

  const navigateToScreen = useCallback(
    (
      sectionId: string,
      screenId: string,
      params?: NavigationState["params"],
    ) => {
      const isSameScreen =
        navigationState.currentSection === sectionId &&
        navigationState.currentScreen === screenId;

      onNavigationChange((currentState) => ({
        currentSection: sectionId,
        currentScreen: screenId,
        params,
        history: isSameScreen
          ? currentState.history ?? []
          : [
              ...(currentState.history ?? []),
              {
                sectionId: currentState.currentSection,
                screenId: currentState.currentScreen,
                params: currentState.params,
              },
            ],
        preservedScreenState: currentState.preservedScreenState,
      }));
    },
    [navigationState.currentScreen, navigationState.currentSection, onNavigationChange],
  );

  const navigateToSection = useCallback(
    (sectionId: string) => {
      if (navigationState.currentSection === sectionId) {
        return;
      }

      onNavigationChange((currentState) => ({
        currentSection: sectionId,
        currentScreen:
          currentState.currentSection === sectionId
            ? currentState.currentScreen
            : currentState.currentScreen,
        params: currentState.params,
        history: [
          ...(currentState.history ?? []),
          {
            sectionId: currentState.currentSection,
            screenId: currentState.currentScreen,
            params: currentState.params,
          },
        ],
        preservedScreenState: currentState.preservedScreenState,
      }));
    },
    [navigationState.currentSection, onNavigationChange],
  );

  const goBack = useCallback(() => {
    onNavigationChange((currentState) => {
      const history = currentState.history ?? [];
      const previousRoute = history[history.length - 1];

      if (!previousRoute) {
        return currentState;
      }

      return {
        currentSection: previousRoute.sectionId,
        currentScreen: previousRoute.screenId,
        params: previousRoute.params,
        history: history.slice(0, -1),
        preservedScreenState: currentState.preservedScreenState,
      };
    });
  }, [onNavigationChange]);

  const setPreservedScreenState = useCallback(
    <K extends keyof PreservedScreenState>(
      screenId: K,
      state: PreservedScreenState[K],
    ) => {
      onNavigationChange((currentState) => ({
        ...currentState,
        preservedScreenState: {
          ...(currentState.preservedScreenState ?? {}),
          [screenId]: state,
        },
      }));
    },
    [onNavigationChange],
  );

  return (
    <NavigationContext.Provider
      value={{
        navigationState,
        navigateToScreen,
        navigateToSection,
        goBack,
        setPreservedScreenState,
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
