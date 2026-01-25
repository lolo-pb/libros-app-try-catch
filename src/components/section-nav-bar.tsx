import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { Colors } from "@/src/constants/theme";
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
    <SafeAreaView edges={["bottom"]}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.icon,
          },
        ]}
      >
        {sections.map((section) => {
          const isActive = currentSectionId === section.id;
          return (
            <Pressable
              key={section.id}
              onPress={() => handleSectionPress(section.id)}
              style={[styles.tabButton, { flex: 1 }]}
            >
              <View style={styles.tabContent}>
                <IconSymbol
                  size={28}
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
  container: {
    flexDirection: "row",
    borderTopWidth: 1,
    backgroundColor: "#fff",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 3,
    paddingBottom: 3,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
});
