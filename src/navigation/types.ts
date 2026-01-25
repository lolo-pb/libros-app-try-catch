/**
 * Navigation types for the app
 */

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

export interface NavigationState {
  currentSection: string;
  currentScreen: string;
}
