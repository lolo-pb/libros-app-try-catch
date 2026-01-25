/**
 * Navigation configuration
 * Define all sections and their screens here
 */

import { ExploreScreen } from "@/src/screens/explore";
import { SearchScreen } from "@/src/screens/explore/search";
import { HomeScreen } from "@/src/screens/home";
import { HomeDetailsScreen } from "@/src/screens/home/details";
import { NavigationSection } from "./types";

export const navigationSections: NavigationSection[] = [
  {
    id: "home",
    name: "Home",
    icon: "house.fill",
    screens: [
      {
        id: "home-main",
        name: "index",
        title: "Home",
        component: HomeScreen,
      },
      {
        id: "home-details",
        name: "details",
        title: "Details",
        component: HomeDetailsScreen,
      },
    ],
  },
  {
    id: "explore",
    name: "Explore",
    icon: "paperplane.fill",
    screens: [
      {
        id: "explore-main",
        name: "index",
        title: "Explore",
        component: ExploreScreen,
      },
      {
        id: "explore-search",
        name: "search",
        title: "Search",
        component: SearchScreen,
      },
    ],
  },
];
