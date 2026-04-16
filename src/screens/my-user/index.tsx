import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/context/auth-context";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { supabase } from "@/src/lib/supabase";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function MyUserScreen() {
  const { session, profile, isLoading } = useAuth();
  const { navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsSigningOut(false);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.centerState}>
        <ActivityIndicator color={colors.tint} />
      </ThemedView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ThemedView style={styles.container}>
          <ThemedText type="title">My User</ThemedText>
          <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
            Sign in to manage your profile and your BookTrade shelf.
          </ThemedText>
          <Pressable
            onPress={() => navigateToScreen("user", "login")}
            style={[styles.primaryButton, { backgroundColor: colors.tint }]}
          >
            <ThemedText style={styles.primaryButtonText}>Go to Login</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.container}>
        <ThemedView style={[styles.avatar, { backgroundColor: colors.tint + "20" }]}>
          <ThemedText style={[styles.avatarText, { color: colors.tint }]}>
            {(profile?.display_name ?? session.user.email ?? "B").slice(0, 1)}
          </ThemedText>
        </ThemedView>
        <ThemedText type="title" style={styles.nameText}>
          {profile?.display_name ?? "BookTrade user"}
        </ThemedText>
        <ThemedText style={{ color: colors.tabIconDefault }}>
          {session.user.email}
        </ThemedText>
        <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
          {profile?.city ?? "Location can be added later for nearby books."}
        </ThemedText>

        <Pressable
          onPress={() => navigateToScreen("books", "my-books")}
          style={[styles.secondaryButton, { borderColor: colors.icon }]}
        >
          <ThemedText type="defaultSemiBold">See my books</ThemedText>
        </Pressable>
        <Pressable
          disabled={isSigningOut}
          onPress={handleSignOut}
          style={[styles.primaryButton, { backgroundColor: colors.tint }]}
        >
          {isSigningOut ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>Sign out</ThemedText>
          )}
        </Pressable>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  avatar: {
    alignItems: "center",
    borderRadius: 48,
    height: 96,
    justifyContent: "center",
    marginBottom: 18,
    width: 96,
  },
  avatarText: {
    fontSize: 42,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  nameText: {
    fontSize: 30,
    marginBottom: 6,
  },
  helperText: {
    marginBottom: 24,
    marginTop: 14,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    marginTop: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
  },
});
