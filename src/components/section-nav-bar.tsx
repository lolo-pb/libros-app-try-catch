import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { AppShadow, Colors } from "@/src/constants/theme";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { NavigationSection } from "@/src/navigation/types";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SectionNavBarProps {
  sections: NavigationSection[];
  currentSectionId: string;
  onSectionChange: (sectionId: string) => void;
}

export function SectionNavBar({
  sections,
  currentSectionId,
  onSectionChange,
}: SectionNavBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleSectionPress = (sectionId: string) => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSectionChange(sectionId);
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.chrome,
            borderColor: colors.separator,
          },
          AppShadow,
        ]}
      >
        {sections.map((section) => {
          const isActive = currentSectionId === section.id;
          return (
            <Pressable
              key={section.id}
              onPress={() => handleSectionPress(section.id)}
              style={({ pressed }) => [
                styles.tabButton,
                isActive && {
                  backgroundColor: colors.tint + "16",
                },
                pressed && styles.tabButtonPressed,
              ]}
            >
              <View style={styles.tabContent}>
                <IconSymbol
                  size={23}
                  name={section.icon as any}
                  color={isActive ? colors.tint : colors.tabIconDefault}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? colors.tint : colors.tabIconDefault,
                    },
                  ]}
                >
                  {section.name}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingTop: 7,
  },
  container: {
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 3,
    minHeight: 62,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: 19,
    justifyContent: "center",
    minHeight: 52,
  },
  tabButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
});
