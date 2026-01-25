import { NavigationState } from "@/src/navigation/types";
import React, { createContext, useCallback, useContext } from "react";

interface NavigationContextType {
  navigationState: NavigationState;
  navigateToScreen: (sectionId: string, screenId: string) => void;
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
    (sectionId: string, screenId: string) => {
      onNavigationChange({
        currentSection: sectionId,
        currentScreen: screenId,
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
      });
    },
    [onNavigationChange, navigationState.currentScreen],
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
