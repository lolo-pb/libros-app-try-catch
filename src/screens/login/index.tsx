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
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedNickname = nickname.trim();

    if (!trimmedEmail || !password) {
      setMessage("Email and password are required.");
      return;
    }

    if (isSignUp) {
      if (!trimmedNickname) {
        setMessage("Pick a nickname so other readers know who you are.");
        return;
      }

      if (password.length < 8) {
        setMessage("Use at least 8 characters for your password.");
        return;
      }

      if (password !== confirmPassword) {
        setMessage("Your password confirmation does not match.");
        return;
      }
    }

    setIsSubmitting(true);
    setMessage(null);

    const result = isSignUp
      ? await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              display_name: trimmedNickname,
            },
            emailRedirectTo: getEmailRedirectTo(),
          },
        })
      : await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

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
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.logoText}>
          BookTrade
        </ThemedText>
        <ThemedText style={[styles.intro, { color: colors.tabIconDefault }]}>
          {isSignUp
            ? "Create your account to start swapping books with the community."
            : "Sign in to publish books, manage your shelf, and start trades."}
        </ThemedText>

        {isSignUp ? (
          <>
            <TextInput
              autoCapitalize="words"
              placeholder="Nickname"
              placeholderTextColor={colors.tabIconDefault}
              value={nickname}
              onChangeText={setNickname}
              style={[
                styles.input,
                {
                  backgroundColor: colorScheme === "dark" ? "#2c2c2e" : "#f0f0f0",
                  color: colors.text,
                },
              ]}
            />
            <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
              This is the name other readers will see on your profile and discussions.
            </ThemedText>
          </>
        ) : null}

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
        {isSignUp ? (
          <>
            <TextInput
              placeholder="Confirm password"
              placeholderTextColor={colors.tabIconDefault}
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={[
                styles.input,
                {
                  backgroundColor: colorScheme === "dark" ? "#2c2c2e" : "#f0f0f0",
                  color: colors.text,
                },
              ]}
            />
            <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
              Use at least 8 characters so your account is easier to keep secure.
            </ThemedText>
          </>
        ) : null}

        {message ? (
          <ThemedText style={[styles.message, { color: colors.tabIconDefault }]}>
            {message}
          </ThemedText>
        ) : null}

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
              <ThemedText style={styles.checkboxMark}>✓</ThemedText>
            ) : null}
          </ThemedView>
          <ThemedText style={{ color: colors.text, fontWeight: "600" }}>
            {showPassword ? "Hide password" : "Show password"}
          </ThemedText>
        </Pressable>

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

        <Pressable
          onPress={() => {
            setIsSignUp((value) => !value);
            setMessage(null);
            setPassword("");
            setConfirmPassword("");
          }}
        >
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
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    marginTop: -4,
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
    height: 22,
    justifyContent: "center",
    width: 22,
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
