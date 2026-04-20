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
      onNavigationChange({
        currentSection: sectionId,
        currentScreen: screenId,
        params,
      });
    },
    [onNavigationChange],
  );

  const navigateToSection = useCallback(
    (sectionId: string) => {
      // This will be handled by the parent component
      onNavigationChange({
        currentSection: sectionId,
        currentScreen: navigationState.currentScreen,
        params: navigationState.params,
      });
    },
    [onNavigationChange, navigationState.currentScreen, navigationState.params],
  );

  return (
    <NavigationContext.Provider
      value={{
        navigationState,
        navigateToScreen,
        navigateToSection,
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
