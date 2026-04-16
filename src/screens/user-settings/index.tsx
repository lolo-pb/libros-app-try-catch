import { ThemedText } from "@/src/components/themed-text";
import { ThemedView } from "@/src/components/themed-view";
import { Colors } from "@/src/constants/theme";
import { useAuth } from "@/src/context/auth-context";
import { useAppNavigation } from "@/src/context/navigation-context";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { supabase } from "@/src/lib/supabase";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function UserSettingsScreen() {
  const { session, profile, refreshProfile } = useAuth();
  const { navigateToScreen } = useAppNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarAsset, setAvatarAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [shouldRemoveAvatar, setShouldRemoveAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setCity(profile?.city ?? "");
    setAvatarPath(profile?.avatar_path ?? null);
  }, [profile]);

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colorScheme === "dark" ? "#2c2c2e" : "#f0f0f0",
      color: colors.text,
    },
  ];

  const getExistingAvatarUrl = () => {
    if (!avatarPath) {
      return null;
    }

    if (avatarPath.startsWith("http")) {
      return avatarPath;
    }

    return supabase.storage.from("avatars").getPublicUrl(avatarPath).data
      .publicUrl;
  };

  const handleChooseAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setMessage("Allow photo access to choose a profile image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.85,
    });

    if (!result.canceled) {
      setAvatarAsset(result.assets[0]);
      setShouldRemoveAvatar(false);
      setMessage(null);
    }
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarAsset) {
      return null;
    }

    const mimeType = avatarAsset.mimeType ?? "image/jpeg";
    const extension = mimeType.split("/")[1] ?? "jpg";
    const normalizedExtension = extension === "jpeg" ? "jpg" : extension;
    const filePath = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${normalizedExtension}`;
    const response = await fetch(avatarAsset.uri);
    const arrayBuffer = await response.arrayBuffer();
    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    return filePath;
  };

  const removeStorageAvatar = async (path: string | null) => {
    if (!path || path.startsWith("http")) {
      return;
    }

    await supabase.storage.from("avatars").remove([path]);
  };

  const handleSave = async () => {
    if (!session) {
      navigateToScreen("user", "login");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const uploadedAvatarPath = await uploadAvatar(session.user.id);
      const nextAvatarPath = uploadedAvatarPath
        ? uploadedAvatarPath
        : shouldRemoveAvatar
          ? null
          : avatarPath;

      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_path: nextAvatarPath,
          city: city.trim() || null,
          display_name: displayName.trim() || null,
        })
        .eq("id", session.user.id);

      if (error) {
        setMessage(error.message);
      } else {
        if (uploadedAvatarPath || shouldRemoveAvatar) {
          await removeStorageAvatar(avatarPath);
        }
        await refreshProfile();
        navigateToScreen("user", "my-user");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save profile.",
      );
    }

    setIsSaving(false);
  };

  const previewUrl =
    avatarAsset?.uri ?? (shouldRemoveAvatar ? null : getExistingAvatarUrl());

  if (!session) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ThemedView style={styles.container}>
          <ThemedText type="title">User Settings</ThemedText>
          <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
            Sign in to edit your profile.
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
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable
          onPress={() => navigateToScreen("user", "my-user")}
          style={[styles.backButton, { backgroundColor: colors.tint + "15" }]}
        >
          <ThemedText style={{ color: colors.tint, fontWeight: "700" }}>
            Back
          </ThemedText>
        </Pressable>

        <ThemedText type="title" style={styles.title}>
          User Settings
        </ThemedText>
        <ThemedText style={[styles.helperText, { color: colors.tabIconDefault }]}>
          Update the profile people see when they find your books.
        </ThemedText>

        <ThemedView style={styles.avatarSection}>
          <ThemedView
            style={[
              styles.avatarPreview,
              { backgroundColor: colors.tint + "20" },
            ]}
          >
            {previewUrl ? (
              <Image
                source={{ uri: previewUrl }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <ThemedText style={[styles.avatarText, { color: colors.tint }]}>
                {(displayName || session.user.email || "B").slice(0, 1)}
              </ThemedText>
            )}
          </ThemedView>
          <ThemedView style={styles.avatarActions}>
            <Pressable
              onPress={handleChooseAvatar}
              style={[styles.secondaryButton, { borderColor: colors.icon }]}
            >
              <ThemedText type="defaultSemiBold">
                {previewUrl ? "Change photo" : "Choose photo"}
              </ThemedText>
            </Pressable>
            {previewUrl ? (
              <Pressable
                onPress={() => {
                  setAvatarAsset(null);
                  setShouldRemoveAvatar(true);
                }}
                style={[styles.secondaryButton, { borderColor: colors.icon }]}
              >
                <ThemedText type="defaultSemiBold">Remove</ThemedText>
              </Pressable>
            ) : null}
          </ThemedView>
        </ThemedView>

        <TextInput
          placeholder="Display name"
          placeholderTextColor={colors.tabIconDefault}
          value={displayName}
          onChangeText={setDisplayName}
          style={inputStyle}
        />
        <TextInput
          placeholder="City"
          placeholderTextColor={colors.tabIconDefault}
          value={city}
          onChangeText={setCity}
          style={inputStyle}
        />

        <ThemedView
          style={[styles.infoBox, { backgroundColor: colors.tint + "10" }]}
        >
          <ThemedText type="defaultSemiBold">Reviews and ratings</ThemedText>
          <ThemedText style={{ color: colors.tabIconDefault }}>
            Coming later. We will add trusted ratings after trade requests are in.
          </ThemedText>
        </ThemedView>

        {message ? (
          <ThemedText style={[styles.message, { color: colors.tint }]}>
            {message}
          </ThemedText>
        ) : null}

        <Pressable
          disabled={isSaving}
          onPress={handleSave}
          style={[styles.primaryButton, { backgroundColor: colors.tint }]}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>Save profile</ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 8,
    marginBottom: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  title: {
    fontSize: 30,
    marginBottom: 6,
  },
  helperText: {
    marginBottom: 22,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 22,
  },
  avatarPreview: {
    alignItems: "center",
    borderRadius: 56,
    height: 112,
    justifyContent: "center",
    marginBottom: 14,
    overflow: "hidden",
    width: 112,
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  avatarText: {
    fontSize: 48,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  avatarActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  input: {
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoBox: {
    borderRadius: 8,
    gap: 6,
    marginBottom: 18,
    marginTop: 4,
    padding: 14,
  },
  message: {
    marginBottom: 12,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
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
    flex: 1,
    height: 44,
    justifyContent: "center",
  },
});
