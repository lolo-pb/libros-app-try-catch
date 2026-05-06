/**
 * Navigation configuration
 * Define all sections and their screens here
 */

import { BookScreen } from "@/src/screens/book";
import { CommentThreadScreen } from "@/src/screens/comment-thread";
import { ConfirmTradeScreen } from "@/src/screens/confirm-trade";
import { DiscussionDetailScreen } from "@/src/screens/discussion-detail";
import { EditBookScreen } from "@/src/screens/edit-book";
import { GlobalBookScreen } from "@/src/screens/global-book";
import { HomeScreen } from "@/src/screens/home";
import { LoginScreen } from "@/src/screens/login";
import { MyBooksScreen } from "@/src/screens/my-books";
import { MyTradesScreen } from "@/src/screens/my-trades";
import { MyUserScreen } from "@/src/screens/my-user";
import { NewBookScreen } from "@/src/screens/new-book";
import { NewDiscussionScreen } from "@/src/screens/new-discussion";
import { SelectTradeBookScreen } from "@/src/screens/select-trade-book";
import { TradeDetailScreen } from "@/src/screens/trade-detail";
import { UserSettingsScreen } from "@/src/screens/user-settings";
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
        id: "global-book",
        name: "global-book",
        title: "Topic",
        component: GlobalBookScreen,
      },
      {
        id: "new-discussion",
        name: "new-discussion",
        title: "New Discussion",
        component: NewDiscussionScreen,
      },
      {
        id: "discussion-detail",
        name: "discussion-detail",
        title: "Discussion Detail",
        component: DiscussionDetailScreen,
      },
      {
        id: "comment-thread",
        name: "comment-thread",
        title: "Comment Thread",
        component: CommentThreadScreen,
      },
      {
        id: "book",
        name: "book",
        title: "Book",
        component: BookScreen,
      },
      {
        id: "edit-book",
        name: "edit",
        title: "Edit Book",
        component: EditBookScreen,
      },
      {
        id: "select-trade-book",
        name: "select-trade",
        title: "Select Trade Book",
        component: SelectTradeBookScreen,
      },
      {
        id: "confirm-trade",
        name: "confirm-trade",
        title: "Confirm Trade",
        component: ConfirmTradeScreen,
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
      {
        id: "edit-book",
        name: "edit",
        title: "Edit Book",
        component: EditBookScreen,
      },
    ],
  },
  {
    id: "trades",
    name: "My Trades",
    icon: "arrow.left.arrow.right",
    screens: [
      {
        id: "my-trades",
        name: "index",
        title: "My Trades",
        component: MyTradesScreen,
      },
      {
        id: "trade-detail",
        name: "detail",
        title: "Trade Detail",
        component: TradeDetailScreen,
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
      {
        id: "user-settings",
        name: "settings",
        title: "User Settings",
        component: UserSettingsScreen,
      },
    ],
  },
];
