/**
 * Navigation types for the app
 */

import type { GlobalBookWithBooks } from "@/src/types/database";

export interface NavigationSection {
  id: string;
  name: string;
  icon: string;
  screens: NavigationScreen[];
}

export interface NavigationScreen {
  id: string;
  name: string;
  title: string;
  component: React.ComponentType<any>;
}

export interface NavigationRoute {
  sectionId: string;
  screenId: string;
  params?: Record<string, string | undefined>;
}

export interface HomeScreenSnapshot {
  hasLoadedOnce: boolean;
  search: string;
  globalBooks: GlobalBookWithBooks[];
  errorMessage: string | null;
  isLoading: boolean;
  scrollOffset: number;
}

export interface PreservedScreenState {
  "home-main"?: HomeScreenSnapshot;
}

export interface NavigationState {
  currentSection: string;
  currentScreen: string;
  params?: Record<string, string | undefined>;
  history?: NavigationRoute[];
  preservedScreenState?: PreservedScreenState;
}
