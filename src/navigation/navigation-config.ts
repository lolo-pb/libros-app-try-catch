/**
 * Navigation configuration
 * Define all sections and their screens here
 */

import { BookScreen } from "@/src/screens/book";
import { HomeScreen } from "@/src/screens/home";
import { LoginScreen } from "@/src/screens/login";
import { MyBooksScreen } from "@/src/screens/my-books";
import { MyUserScreen } from "@/src/screens/my-user";
import { NewBookScreen } from "@/src/screens/new-book";
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
        id: "book",
        name: "book",
        title: "Book",
        component: BookScreen,
      },
    ],
  },
  {
    id: "books",
    name: "My Books",
    icon: "book.fill",
    screens: [
      {
        id: "my-books",
        name: "index",
        title: "My Books",
        component: MyBooksScreen,
      },
      {
        id: "new-book",
        name: "new",
        title: "New Book",
        component: NewBookScreen,
      },
      {
        id: "book",
        name: "book",
        title: "Book",
        component: BookScreen,
      },
    ],
  },
  {
    id: "user",
    name: "My User",
    icon: "person.fill",
    screens: [
      {
        id: "my-user",
        name: "index",
        title: "My User",
        component: MyUserScreen,
      },
      {
        id: "login",
        name: "login",
        title: "Login",
        component: LoginScreen,
      },
    ],
  },
];
