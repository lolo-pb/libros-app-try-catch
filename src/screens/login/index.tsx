import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { supabase } from "@/src/lib/supabase";
import * as Linking from "expo-linking";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getEmailRedirectTo() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  return Linking.createURL("/");
}

export function LoginScreen() {
  const { navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage(null);

    const trimmedEmail = email.trim();
    const result = isSignUp
      ? await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              display_name: trimmedEmail.split("@")[0],
            },
            emailRedirectTo: getEmailRedirectTo(),
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setMessage(result.error.message);
    } else {
      const needsEmailConfirmation = isSignUp && !result.data.session;

      setMessage(
        needsEmailConfirmation
          ? "Check your email to confirm your account, then sign in."
          : isSignUp
            ? "Account created. You are signed in."
            : "Signed in.",
      );

      if (!needsEmailConfirmation) {
        navigateToScreen("user", "my-user");
      }
    }

    setIsSubmitting(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.logoText}>
          BookTrade
        </ThemedText>
        <ThemedText style={[styles.intro, { color: colors.tabIconDefault }]}>
          Sign in to publish books, manage your shelf, and start trades.
        </ThemedText>

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={colors.tabIconDefault}
          value={email}
          onChangeText={setEmail}
          style={[
            styles.input,
            {
              backgroundColor: colorScheme === "dark" ? "#2c2c2e" : "#f0f0f0",
              color: colors.text,
            },
          ]}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.tabIconDefault}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          style={[
            styles.input,
            {
              backgroundColor: colorScheme === "dark" ? "#2c2c2e" : "#f0f0f0",
              color: colors.text,
            },
          ]}
        />

        <Pressable
          onPress={() => setShowPassword((value) => !value)}
          style={styles.checkboxRow}
        >
          <ThemedView
            style={[
              styles.checkbox,
              {
                backgroundColor: showPassword ? colors.tint : "transparent",
                borderColor: showPassword ? colors.tint : colors.icon,
              },
            ]}
          >
            {showPassword ? (
              <ThemedText style={styles.checkboxMark}>x</ThemedText>
            ) : null}
          </ThemedView>
          <ThemedText style={{ color: colors.tabIconDefault }}>
            Show password
          </ThemedText>
        </Pressable>

        {message ? (
          <ThemedText style={[styles.message, { color: colors.tabIconDefault }]}>
            {message}
          </ThemedText>
        ) : null}

        <Pressable
          disabled={isSubmitting}
          onPress={handleSubmit}
          style={[styles.primaryButton, { backgroundColor: colors.tint }]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>
              {isSignUp ? "Create account" : "Sign in"}
            </ThemedText>
          )}
        </Pressable>

        <Pressable onPress={() => setIsSignUp((value) => !value)}>
          <ThemedText type="link">
            {isSignUp ? "I already have an account" : "Create a new account"}
          </ThemedText>
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
    justifyContent: "center",
    padding: 24,
  },
  logoText: {
    color: "#E91E63",
    fontSize: 34,
    fontWeight: "900",
    marginBottom: 10,
    textAlign: "center",
  },
  intro: {
    marginBottom: 26,
    textAlign: "center",
  },
  input: {
    borderRadius: 8,
    fontSize: 16,
    height: 48,
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  checkboxRow: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  checkbox: {
    alignItems: "center",
    borderRadius: 4,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  checkboxMark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
  },
  message: {
    marginBottom: 12,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
